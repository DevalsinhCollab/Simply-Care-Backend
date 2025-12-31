const PatientSchema = require("../models/patient");
const DoctorSchema = require("../models/doctor");
const PatientFormSchema = require("../models/patientform");
const Appointment = require("../models/appointment");
const Expense = require("../models/expense");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const moment = require("moment");

// exports.dashboardCount = async (req, res) => {
//     try {

//         const loggedUserClinicId = req.user.clinicId;

//         const filter = { isDeleted: false };
//         if (loggedUserClinicId) {
//             filter.clinicId = loggedUserClinicId;
//         }

//         const patientCount = await PatientSchema.countDocuments({isDeleted: false});
//         const doctorCount = await DoctorSchema.countDocuments({ isDeleted: false });
//         const patientFormCount = await Appointment.countDocuments({ isDeleted: false });

//         // Calculate income (total payment from appointments)
//         // const incomeResult = await Appointment.aggregate([
//         //     { $match: { isDeleted: false } },
//         //     {
//         //         $group: {
//         //             _id: null,
//         //             totalIncome: { $sum: '$payment' },
//         //             totalPaid: { $sum: '$paidAmount' },
//         //         }
//         //     }
//         // ]);

//         // const totalIncome = incomeResult[0]?.totalIncome || 0;
//         // const totalPaid = incomeResult[0]?.totalPaid || 0;
//         // const remainingAmount = totalIncome - totalPaid;

//         // // Calculate total expenses
//         // const expenseResult = await Expense.aggregate([
//         //     { $match: { isDeleted: false } },
//         //     {
//         //         $group: {
//         //             _id: null,
//         //             totalExpense: { $sum: '$amount' },
//         //         }
//         //     }
//         // ]);

//         // const totalExpense = expenseResult[0]?.totalExpense || 0;

//         // ------------------ Calculate income and payments from sessions ------------------
// // ------------------ Calculate income and payments from sessions ------------------
// const incomeResult = await Appointment.aggregate([
//   { $match: { isDeleted: false } },
//   {
//     $unwind: { path: "$sessions", preserveNullAndEmptyArrays: true } // keep appointments without sessions
//   },
//   {
//     $group: {
//       _id: null,
//       totalIncome: {
//         $sum: { $ifNull: ["$sessions.payment", 0] } // fallback 0 if payment is missing
//       },
//       totalPaid: {
//         $sum: { $ifNull: ["$sessions.paidAmount", 0] } // fallback 0 if paidAmount is missing
//       },
//     }
//   }
// ]);

// let totalIncome = incomeResult[0]?.totalIncome || 0;
// let totalPaid = incomeResult[0]?.totalPaid || 0;
// let remainingAmount = totalIncome - totalPaid;

// // ------------------ Add PatientForm payments ------------------
// const patientForms = await PatientFormSchema.find({ isDeleted: false }).select("payment").lean();

// patientForms.forEach(form => {
//   if (form.payment) {
//     // Extract numeric value from strings like "100-infinite"
//     const match = form.payment.match(/\d+/);
//     const numericPayment = match ? parseFloat(match[0]) : 0;

//     totalIncome += numericPayment;
//     totalPaid += numericPayment; // assume fully paid
//   }
// });

// // ------------------ Calculate total expenses ------------------
// const expenseResult = await Expense.aggregate([
//   { $match: { isDeleted: false } },
//   {
//     $group: {
//       _id: null,
//       totalExpense: { $sum: { $ifNull: ["$amount", 0] } },
//     }
//   }
// ]);

// const totalExpense = expenseResult[0]?.totalExpense || 0;

//         return res.status(200).json({
//             patientCount,
//             doctorCount,
//             patientFormCount,
//             totalIncome,
//             totalPaid,
//             remainingAmount,
//             totalExpense,
//             success: true
//         })

//     } catch (error) {
//         return res.status(500).json({ message: "Internal Server Error", success: false });
//     }
// };

// Get filtered dashboard stats by date or month

exports.dashboardCount = async (req, res) => {
  try {
    
      const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);
      
      const findFilter = { isDeleted: false };
        if (clinicId) {
            findFilter.clinicId = clinicId;
        }
    // ================= COUNTS =================
    const patientCount = await PatientSchema.countDocuments(findFilter);

    const doctorCount = await DoctorSchema.countDocuments(findFilter);
    console.log("CLINIC ID DASHBOARD 👉", clinicId);

    const appointmentCount = await Appointment.countDocuments(findFilter);

    // ================= SESSION-WISE INCOME =================
    const sessionAgg = await Appointment.aggregate([
      {
        $match: findFilter,
      },
      {
        $unwind: "$sessions",
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$sessions.payment" },
          totalPaid: { $sum: "$sessions.paidAmount" },
          totalRemaining: { $sum: "$sessions.remainingAmount" },
        },
      },
    ]);

    const sessionIncome = sessionAgg[0]?.totalIncome || 0;
    const sessionPaid = sessionAgg[0]?.totalPaid || 0;
    const sessionRemaining = sessionAgg[0]?.totalRemaining || 0;

    // ================= PATIENT FORM INCOME (NODE.JS SAFE) =================
    const patientForms = await PatientFormSchema.find(findFilter)
      .select("payment")
      .lean();

    let patientFormIncome = 0;

    for (const form of patientForms) {
      if (!form.payment) continue;

      // Handles: "100", "100-infinite", number, null
      if (typeof form.payment === "number") {
        patientFormIncome += form.payment;
      } else if (typeof form.payment === "string") {
        const match = form.payment.match(/\d+/);
        patientFormIncome += match ? Number(match[0]) : 0;
      }
    }

    // ================= FINAL TOTALS =================
    const totalIncome = sessionIncome + patientFormIncome;
    const totalPaid = sessionPaid + patientFormIncome; // patient form fully paid
    const remainingAmount = sessionRemaining;

    // ================= EXPENSE =================
    const expenseAgg = await Expense.aggregate([
      {
        $match: findFilter,
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpense = expenseAgg[0]?.totalExpense || 0;

    // ================= RESPONSE =================
    return res.status(200).json({
      patientCount,
      doctorCount,
      patientFormCount: appointmentCount,
      totalIncome,
      totalPaid,
      remainingAmount,
      totalExpense,
      success: true,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR 👉", error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};
exports.getFilteredDashboardStats = async (req, res) => {
  try {
    const { date, month } = req.query;

    let appointmentFilter = { isDeleted: false };
    let expenseFilter = { isDeleted: false };

    // Build date/month filter
    if (date) {
      // Filter by specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      appointmentFilter.appointmentDate = {
        $gte: startDate,
        $lte: endDate,
      };

      expenseFilter.expenseDate = {
        $gte: startDate,
        $lte: endDate,
      };
    } else if (month) {
      // Filter by month (expecting MM-YYYY format)
      // For appointments, we need to extract the month from appointmentDate
      // For expenses, use the month field directly

      // Parse month string MM-YYYY
      const [monthNum, year] = month.split("-");
      const monthStart = new Date(`${year}-${monthNum}-01`);
      monthStart.setHours(0, 0, 0, 0);

      // Get the last day of the month
      const monthEnd = new Date(year, monthNum, 0);
      monthEnd.setHours(23, 59, 59, 999);

      appointmentFilter.appointmentDate = {
        $gte: monthStart,
        $lte: monthEnd,
      };

      expenseFilter.month = month;
    }

    // Calculate filtered income
    const incomeResult = await Appointment.aggregate([
      { $match: appointmentFilter },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$payment" },
          totalPaid: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = incomeResult[0]?.totalIncome || 0;
    const totalPaid = incomeResult[0]?.totalPaid || 0;
    const appointmentCount = incomeResult[0]?.count || 0;
    const remainingAmount = totalIncome - totalPaid;

    // Calculate filtered expenses
    const expenseResult = await Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpense = expenseResult[0]?.totalExpense || 0;
    const expenseCount = expenseResult[0]?.count || 0;

    const profitLoss = totalPaid - totalExpense;

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalPaid,
        remainingAmount,
        totalExpense,
        profitLoss,
        appointmentCount,
        expenseCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

exports.getRemainingPatients = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);

    // ================= MATCH FILTER =================
    const match = {
      isDeleted: false,
    };

    if (clinicId) {
      match.clinicId = clinicId;
    }

    // Date filter (session date based)
    if (startDate && endDate) {
      match["sessions.sessionDate"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await Appointment.aggregate([
      { $match: match },

      // Break sessions into rows
      { $unwind: "$sessions" },

      // ================= GROUP PATIENT-WISE =================
      {
        $group: {
          _id: "$patientId",
          totalRemaining: { $sum: "$sessions.remainingAmount" },
          totalPayment: { $sum: "$sessions.payment" },
          totalPaid: { $sum: "$sessions.paidAmount" },
        },
      },

      // ================= ONLY REMAINING > 0 =================
      {
        $match: {
          totalRemaining: { $gt: 0 },
        },
      },

      // ================= PATIENT LOOKUP =================
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $unwind: {
          path: "$patient",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ================= FINAL PROJECTION =================
      {
        $project: {
          _id: 0,
          patientId: "$_id",
          patientName: "$patient.name",
          phone: "$patient.phone",
          totalPayment: 1,
          totalPaid: 1,
          remaining: "$totalRemaining",
        },
      },

      // ================= SORT =================
      { $sort: { remaining: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("REMAINING PATIENT ERROR 👉", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// // Get patients with received (paid) amounts
// exports.getReceivedByPatient = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;

//     let match = { isDeleted: false };
//     if (startDate && endDate) {
//       match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     }

//     const data = await Appointment.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: "$patientId",
//           totalPaid: { $sum: "$paidAmount" },
//           totalPayment: { $sum: "$payment" },
//         },
//       },
//       { $match: { totalPaid: { $gt: 0 } } },
//       {
//         $lookup: {
//           from: "patients",
//           localField: "_id",
//           foreignField: "_id",
//           as: "patient",
//         },
//       },
//       { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
//       {
//         $project: {
//           patientId: "$_id",
//           patientName: "$patient.name",
//           phone: "$patient.phone",
//           totalPaid: 1,
//           totalPayment: 1,
//         },
//       },
//       { $sort: { totalPaid: -1 } },
//     ]);

//     return res.status(200).json({ success: true, data });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


exports.getReceivedByPatient = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

  

    const clinicId = new mongoose.Types.ObjectId(req.user.clinicId);

    // ================= MATCH FILTER =================
    const match = {
      isDeleted: false,
    };

    if(clinicId){   
        match.clinicId = clinicId
    }

    // Date filter (session-wise)
    if (startDate && endDate) {
      match["sessions.sessionDate"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await Appointment.aggregate([
      { $match: match },

      // break sessions
      { $unwind: "$sessions" },

      // ================= GROUP PATIENT-WISE =================
      {
        $group: {
          _id: "$patientId",
          totalPaid: { $sum: "$sessions.paidAmount" },
          totalPayment: { $sum: "$sessions.payment" },
        },
      },

      // only patients with paid amount
      {
        $match: {
          totalPaid: { $gt: 0 },
        },
      },

      // ================= PATIENT LOOKUP =================
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $unwind: {
          path: "$patient",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ================= FINAL PROJECTION =================
      {
        $project: {
          _id: 0,
          patientId: "$_id",
          patientName: "$patient.name",
          phone: "$patient.phone",
          totalPaid: 1,
          totalPayment: 1,
        },
      },

      // ================= SORT =================
      { $sort: { totalPaid: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("RECEIVED PATIENT ERROR 👉", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export received / patient transactions to Excel
exports.exportReceivedExcel = async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.query;

    let filter = { isDeleted: false };

    if (patientId) {
      filter.patientId = new mongoose.Types.ObjectId(patientId);
    }

    if (startDate && endDate) {
      const sd = new Date(startDate);
      sd.setHours(0, 0, 0, 0);
      const ed = new Date(endDate);
      ed.setHours(23, 59, 59, 999);
      filter.date = { $gte: sd, $lte: ed };
    }

    // Fetch appointments only — include patient + doctor
    const appts = await Appointment.find(filter)
      .populate("patientId")
      .populate("doctorId")
      .sort({ date: 1 })
      .lean();

    if (!appts || appts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No records found for export" });
    }

    const rows = [];
    let totalPayment = 0;
    let totalPaid = 0;

    for (const appt of appts) {
      const apptDate = appt.appointmentDate || appt.date || appt.createdAt;
      const dateObj = apptDate ? new Date(apptDate) : null;

      const payment = Number(appt.payment || 0);
      const paid = Number(appt.paidAmount || 0);

      totalPayment += payment;
      totalPaid += paid;

      rows.push({
        Date: dateObj ? moment(dateObj).format("DD/MM/YYYY") : "",
        Month: dateObj ? moment(dateObj).format("MMMM YYYY") : "",
        Patient: appt.patientId ? appt.patientId.name : "",
        Phone: appt.patientId ? appt.patientId.phone : "",
        Doctor: appt.doctorId ? appt.doctorId.name : "",
        Payment: payment,
        Paid: paid,
      });
    }

    // Add total row
    rows.push({
      Date: "",
      Month: "Total",
      Patient: "",
      Phone: "",
      Doctor: "",
      Payment: totalPayment,
      Paid: totalPaid,
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Received Payments");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = patientId
      ? `Patient_${patientId}_Received.xlsx`
      : `Received_Payments.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buf);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportRemainingExcel = async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.query;

    let filter = { isDeleted: false };

    if (patientId) {
      filter.patientId = new mongoose.Types.ObjectId(patientId);
    }

    if (startDate && endDate) {
      const sd = new Date(startDate);
      sd.setHours(0, 0, 0, 0);
      const ed = new Date(endDate);
      ed.setHours(23, 59, 59, 999);
      filter.date = { $gte: sd, $lte: ed };
    }

    // Fetch appointments matching filter — include patient and doctor
    const appts = await Appointment.find(filter)
      .populate("patientId")
      .populate("doctorId")
      .sort({ date: 1 })
      .lean();

    if (!appts || appts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No records found for export" });
    }

    // Build rows for Excel
    const rows = [];
    let totalPayment = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    for (const appt of appts) {
      const apptDate = appt.appointmentDate || appt.date || appt.createdAt;
      const dateObj = apptDate ? new Date(apptDate) : null;

      const payment = Number(appt.payment || 0);
      const paid = Number(appt.paidAmount || 0);
      const remaining = payment - paid;

      totalPayment += payment;
      totalPaid += paid;
      totalRemaining += remaining;

      rows.push({
        Date: dateObj ? moment(dateObj).format("DD/MM/YYYY") : "",
        Month: dateObj ? moment(dateObj).format("MMMM YYYY") : "",
        Patient: appt.patientId ? appt.patientId.name : "",
        Phone: appt.patientId ? appt.patientId.phone : "",
        Doctor: appt.doctorId ? appt.doctorId.name : "",
        Payment: payment,
        Paid: paid,
        Remaining: remaining,
      });
    }

    // Add total row at the end
    rows.push({
      Date: "",
      Month: "Total",
      Patient: "",
      Phone: "",
      Doctor: "",
      Payment: totalPayment,
      Paid: totalPaid,
      Remaining: totalRemaining,
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = patientId
      ? `Patient_${patientId.name}_Transactions.xlsx`
      : `Remaining_Transactions.xlsx`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.send(buf);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
