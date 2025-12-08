const PatientSchema = require("../models/patient")
const DoctorSchema = require("../models/doctor")
const PatientFormSchema = require("../models/patientform")
const Appointment = require("../models/appointment")
const Expense = require("../models/expense")
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const moment = require('moment');

exports.dashboardCount = async (req, res) => {
    try {
        const patientCount = await PatientSchema.countDocuments();
        const doctorCount = await DoctorSchema.countDocuments({ isDeleted: false });
        const patientFormCount = await PatientFormSchema.countDocuments({ isDeleted: false });

        // Calculate income (total payment from appointments)
        const incomeResult = await Appointment.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                }
            }
        ]);

        const totalIncome = incomeResult[0]?.totalIncome || 0;
        const totalPaid = incomeResult[0]?.totalPaid || 0;
        const remainingAmount = totalIncome - totalPaid;

        // Calculate total expenses
        const expenseResult = await Expense.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalExpense: { $sum: '$amount' },
                }
            }
        ]);

        const totalExpense = expenseResult[0]?.totalExpense || 0;

        return res.status(200).json({
            patientCount,
            doctorCount,
            patientFormCount,
            totalIncome,
            totalPaid,
            remainingAmount,
            totalExpense,
            success: true
        })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

// Get filtered dashboard stats by date or month
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
            const [monthNum, year] = month.split('-');
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
                    totalIncome: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                    count: { $sum: 1 },
                }
            }
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
                    totalExpense: { $sum: '$amount' },
                    count: { $sum: 1 },
                }
            }
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
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

// Get patients with remaining amount (patient-wise remaining > 0)
exports.getRemainingPatients = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let match = { isDeleted: false };
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const data = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$patientId',
                    totalPayment: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                },
            },
            {
                $project: {
                    totalPayment: 1,
                    totalPaid: 1,
                    remaining: { $subtract: ['$totalPayment', '$totalPaid'] },
                },
            },
            { $match: { remaining: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    patientId: '$_id',
                    patientName: '$patient.name',
                    phone: '$patient.phone',
                    totalPayment: 1,
                    totalPaid: 1,
                    remaining: 1,
                },
            },
            { $sort: { remaining: -1 } },
        ]);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get patients with received (paid) amounts
exports.getReceivedByPatient = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let match = { isDeleted: false };
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const data = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$patientId',
                    totalPaid: { $sum: '$paidAmount' },
                    totalPayment: { $sum: '$payment' },
                },
            },
            { $match: { totalPaid: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    patientId: '$_id',
                    patientName: '$patient.name',
                    phone: '$patient.phone',
                    totalPaid: 1,
                    totalPayment: 1,
                },
            },
            { $sort: { totalPaid: -1 } },
        ]);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
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
      .populate('patientId')
      .populate('doctorId')
      .sort({ date: 1 })
      .lean();

    if (!appts || appts.length === 0) {
      return res.status(404).json({ success: false, message: 'No records found for export' });
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
                Date: dateObj ? moment(dateObj).format('DD/MM/YYYY') : '',
                Month: dateObj ? moment(dateObj).format('MMMM YYYY') : '',
        Patient: appt.patientId ? appt.patientId.name : '',
        Phone: appt.patientId ? appt.patientId.phone : '',
        Doctor: appt.doctorId ? appt.doctorId.name : '',
        Payment: payment,
        Paid: paid,
      });
    }

    // Add total row
    rows.push({
      Date: '',
      Month: 'Total',
      Patient: '',
      Phone: '',
      Doctor: '',
      Payment: totalPayment,
      Paid: totalPaid,
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Received Payments');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fileName = patientId
      ? `Patient_${patientId}_Received.xlsx`
      : `Received_Payments.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    return res.send(buf);
  } catch (error) {
    console.error('Export error:', error);
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
            .populate('patientId')
            .populate('doctorId')
            .sort({ date: 1 })
            .lean();

        if (!appts || appts.length === 0) {
            return res.status(404).json({ success: false, message: 'No records found for export' });
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
                Date: dateObj ? moment(dateObj).format('DD/MM/YYYY') : '',
                Month: dateObj ? moment(dateObj).format('MMMM YYYY') : '',
                Patient: appt.patientId ? appt.patientId.name : '',
                Phone: appt.patientId ? appt.patientId.phone : '',
                Doctor: appt.doctorId ? appt.doctorId.name : '',
                Payment: payment,
                Paid: paid,
                Remaining: remaining,
            });
        }

        // Add total row at the end
        rows.push({
            Date: '',
            Month: 'Total',
            Patient: '',
            Phone: '',
            Doctor: '',
            Payment: totalPayment,
            Paid: totalPaid,
            Remaining: totalRemaining,
        });

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const fileName = patientId ? `Patient_${patientId.name}_Transactions.xlsx` : `Remaining_Transactions.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buf);
    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
