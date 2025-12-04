// const User = require("../models/user");
// const Problem = require("../models/problem");
// const Appointment = require("../models/appointment");
// const { formateDate } = require("../comman/comman");

// exports.addAppointment = async (req, res) => {
//   try {
//     const {
//       patientId,
//       docId,
//       prbData,
//       issue,
//       start,
//       end,
//       docName,
//       docSpeciality,
//     } = req.body;

//     const appointment = await Appointment.create({
//       patientId,
//       docId,
//       prbData,
//       start,
//       end,
//       issue,
//     });
//     // const issue = prbData?.label?.split("-")[1];

//     req.io.to(patientId).emit("newAppointment", {
//       message: `Your appointment for ${issue} with ${docName} has been scheduled at ${formateDate(
//         start
//       )} To ${formateDate(end)}`,
//       data: {
//         ...appointment.toObject(),
//         docName,
//         docSpeciality,
//       },
//       type: "add",
//     });

//     return res.status(200).json({ data: appointment, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.getAllAppointmentsByDoc = async (req, res) => {
//   try {
//     const { did } = req.params;
//     // const { page = 0, pageSize = 10 } = req.body;

//     // const skip = page * pageSize;
//     // const totalCount = await Problem.countDocuments({ docId: did });
//     const appointments = await Appointment.find({ docId: did }).sort({
//       createdAt: -1,
//     });
//     // .skip(skip)
//     // .limit(pageSize)
//     // .lean()
//     // .exec();

//     const newData = appointments?.map((item) => {
//       return {
//         ...item.toObject(),
//         start: new Date(item.start),
//         end: new Date(item.end),
//       };
//     });
//     return res.status(200).json({ data: newData, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.updateAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       patientId,
//       docId,
//       prbData,
//       issue,
//       start,
//       end,
//       docName,
//       docSpeciality,
//     } = req.body;

//     const appointment = await Appointment.findByIdAndUpdate(
//       id,
//       {
//         patientId,
//         docId,
//         prbData,
//         start,
//         end,
//         issue,
//       },
//       { new: true }
//     );

//     // const issue = prbData?.label?.split("-")[1];

//     req.io.to(patientId).emit("newAppointment", {
//       message: `Your scheduled appointment for ${issue} with ${docName} has been updated at ${formateDate(
//         start
//       )} To ${formateDate(end)}`,
//       data: {
//         ...appointment.toObject(),
//         docName,
//         docSpeciality,
//       },
//       type: "update",
//     });

//     return res.status(200).json({ data: appointment, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.deleteAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const appointment = await Appointment.findByIdAndDelete(id, { new: true });

//     return res.status(200).json({ data: appointment, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.getAppointmentByPatient = async (req, res) => {
//   try {
//     const { pid } = req.params;
//     const { page = 0, pageSize = 10 } = req.body;

//     const skip = page * pageSize;
//     const totalCount = await Appointment.countDocuments({ patientId: pid });
//     const appointments = await Appointment.find({ patientId: pid })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(pageSize)
//       .lean()
//       .exec();

//     const newData = await Promise.all(
//       appointments.map(async (appt) => {
//         const findDoctor = await User.findById(appt.docId);
//         return {
//           ...appt,
//           docName: findDoctor.name,
//           docSpeciality: findDoctor.docSpeciality,
//         };
//       })
//     );
//     return res.status(200).json({ data: newData, totalCount, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.getAppointmentByDoctor = async (req, res) => {
//   try {
//     const { did } = req.params;
//     const { page = 0, pageSize = 10 } = req.body;

//     const skip = page * pageSize;
//     const totalCount = await Appointment.countDocuments({ docId: did });
//     const appointments = await Appointment.find({ docId: did })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(pageSize)
//       .lean()
//       .exec();

//     const newData = await Promise.all(
//       appointments.map(async (appt) => {
//         const findPatient = await User.findById(appt.patientId);
//         return {
//           ...appt,
//           patientName: findPatient.name,
//         };
//       })
//     );
//     return res.status(200).json({ data: newData, totalCount, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

const Appointment = require("../models/appointment");
const moment = require("moment");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { generateReceiptNumber } = require("../comman/comman");
const Doctor = require("../models/doctor");

// ===========================
// CREATE APPOINTMENT
// ===========================
exports.createAppointment = async (req, res) => {
  try {
    const {
      doctor,
      patient,
      treatment,
      description,
      date,
      payment,
      patientFormId,
      docApproval,
    } = req.body;

    const newAppointment = await Appointment.create({
      doctorId: doctor && doctor._id,
      patientId: patient && patient._id,
      patientFormId,
      treatment,
      description,
      date,
      payment,
      docApproval,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// GET ALL APPOINTMENTS
// ===========================
// exports.getAllAppointments = async (req, res) => {
//   try {
//     const { page, pageSize, doctorId, patientId, startDate, endDate, search } =
//       req.query;

//     let filter = { isDeleted: false };

//     if (doctorId) filter.doctorId = doctorId;
//     if (patientId) filter.patientId = patientId;

//     if (search) {
//       const docs = await Doctor.find({
//         name: { $regex: search, $options: "i" },
//       }).select("_id");

//       filter.doctorId = { $in: docs.map((d) => d._id) };
//     }

//     // if (startDate && endDate) {
//     //   filter.date = {
//     //     $gte: new Date(startDate),
//     //     $lte: new Date(endDate)
//     //   };
//     // }
//     if (
//       startDate &&
//       endDate &&
//       startDate !== "Invalid Date" &&
//       endDate !== "Invalid Date"
//     ) {
//       filter.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     const data = await Appointment.find(filter)
//       .populate("doctorId")
//       .populate("patientId")
//       .skip(page * pageSize)
//       .limit(pageSize)
//       .sort({ date: -1 });

//     const total = await Appointment.countDocuments(filter);

//     res.json({ success: true, data, total });
//   } catch (e) {
//     res.status(400).json({ success: false, message: e.message });
//   }
// };

exports.getAllAppointments = async (req, res) => {
  try {
    const {
      page = 0,
      pageSize = 10,
      doctorId,
      patientId,
      startDate,
      endDate,
      search,
      uniquePatient,
    } = req.query;

    let filter = {
      isDeleted: false,
      docApproval: { $ne: "pending", $exists: true },
    };

    const role = req.user.role;
    const loggedDoctor = req.user.doctorId;

    if (role == "D" && loggedDoctor) {
      filter.doctorId = new mongoose.Types.ObjectId(loggedDoctor);
    }


    if (doctorId) filter.doctorId = doctorId;
    if (patientId) filter.patientId = patientId;

    // 🔍 Search doctors by name
    if (search) {
      const matchedDoctors = await Doctor.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      if (matchedDoctors.length === 0) {
        return res.json({ success: true, data: [], total: 0 });
      }

      filter.doctorId = {
        ...(filter.doctorId && { $in: [filter.doctorId] }),
        $in: matchedDoctors.map((d) => d._id),
      };
    }

    // 📅 Date filter
    if (
      startDate &&
      endDate &&
      startDate !== "Invalid Date" &&
      endDate !== "Invalid Date"
    ) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    /* ⭐ UNIQUE PATIENT MODE -------------------------------- */
    if (uniquePatient === "true") {
      const records = await Appointment.aggregate([
        { $match: filter },
        { $sort: { date: -1 } }, // latest first
        {
          $group: {
            _id: "$patientId",
            doc: { $first: "$$ROOT" }, // pick latest appointment per patient
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $skip: Number(page) * Number(pageSize) },
        { $limit: Number(pageSize) },
      ]);
      console.log("uniquePatient", uniquePatient)

      // populate doctor & patient
      await Appointment.populate(records, [
        { path: "doctorId" },
        { path: "patientId" },
      ]);

      const total = await Appointment.distinct("patientId", filter);

      return res.json({ success: true, data: records, total: total.length });
    }
    /* ------------------------------------------------------ */

    // 🔄 DEFAULT MODE — Full appointment history
    const data = await Appointment.find(filter)
      .populate("doctorId")
      .populate("patientId")
      .sort({ date: -1 })
      .skip(Number(page) * Number(pageSize))
      .limit(Number(pageSize));

    const total = await Appointment.countDocuments(filter);

    res.json({ success: true, data, total });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// ===========================
// GET APPOINTMENT BY ID
// ===========================
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("doctorId")
      .populate("patientId");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// UPDATE APPOINTMENT
// ===========================
exports.updateAppointment = async (req, res) => {
  try {
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// DELETE APPOINTMENT
// ===========================
exports.deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// GENERATE REPORT
// ===========================
exports.generateReport = async (req, res) => {
  try {
    const imagePath = path.resolve(__dirname, "../images/ErayaLogo.png");

    let imageDataUri = null;

    try {
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      imageDataUri = `data:image/png;base64,${imageBase64}`;
    } catch (err) {
      console.error("Image load error:", err.message);
    }

    const { startDate, endDate, patient, doctor } = req.query;

    if (!patient || !startDate || !endDate || !doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Parse dates
    let parsedStart = moment(startDate, "DD/MM/YYYY").startOf("day").toDate();
    let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf("day").toDate();

    // Aggregate appointment data
    const data = await Appointment.aggregate([
      {
        $match: {
          patientId: new mongoose.Types.ObjectId(patient),
          doctorId: new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
          isDeleted: false,
          docApproval: "approved",
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientData",
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorData",
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          treatment: 1,
          payment: { $toDouble: "$payment" },
          patientName: { $arrayElemAt: ["$patientData.name", 0] },
          doctorName: { $arrayElemAt: ["$doctorData.name", 0] },
        },
      },
      {
        $group: {
          _id: "$patientName",
          doctorName: { $first: "$doctorName" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              treatment: "$treatment",
              payment: "$payment",
            },
          },
          totalAmount: { $sum: "$payment" },
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found for the given patient and date range.",
      });
    }

    const patientData = data[0];
    const records = patientData.records.map((record, index) => {
      const isEven = index % 2 === 1;
      const rowStyle = {
        fillColor: isEven ? "#eaf4f3" : null,
        lineHeight: 1.5,
        margin: [0, 5, 0, 5],
      };
      return [
        { text: `${index + 1}.`, ...rowStyle, alignment: "center" },
        { text: record.treatment || "N/A", ...rowStyle, alignment: "center" },
        {
          text: moment(record.date).format("DD/MM/YYYY"),
          ...rowStyle,
          alignment: "center",
        },
        {
          text:
            record.payment != null ? `${Number(record.payment)}/-` : "0.00/-",
          alignment: "right",
          ...rowStyle,
          alignment: "center",
        },
      ];
    });

    const isEvenSubtotal = records.length % 2 === 1;

    records.push([
      {
        text: "Sub Total",
        bold: true,
        colSpan: 3,
        alignment: "right",
        fillColor: isEvenSubtotal ? "#eaf4f3" : null,
        lineHeight: 1.5,
        margin: [0, 5, 0, 5],
      },
      {},
      {},
      {
        text: `${patientData.totalAmount}/-`,
        bold: true,
        alignment: "right",
        fillColor: isEvenSubtotal ? "#eaf4f3" : null,
        lineHeight: 1.5,
        margin: [0, 5, 0, 5],
      },
    ]);

    const docDefinition = {
      content: [
        {
          columns: [
            {
              image: imageDataUri,
              width: 150,
            },
            {
              text: "Invoice",
              style: "invoiceTitle",
              alignment: "right",
              margin: [0, 20, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              color: "#13756f",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              text: [
                { text: "Patient Name:- ", bold: true },
                `${patientData._id}`,
              ],
              style: "header",
            },
            {
              text: [
                { text: "Date:- ", bold: true },
                `${
                  patientData.date
                    ? moment(patientData.date).format("DD/MM/YYYY")
                    : "N/A"
                }`,
              ],
              style: "header",
              margin: [110, 10, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          text: [
            { text: "Doctor Name:- ", bold: true },
            `${patientData.doctorName}`,
          ],
          style: "header2",
        },
        {
          table: {
            headerRows: 1,
            widths: [50, 300, "*", "auto"],
            body: [
              [
                {
                  text: "Sr. No.",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Treatment",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Date",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Amount",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  alignment: "center",
                  lineHeight: 1.5,
                },
              ],
              ...records,
            ],
          },
          layout: "noBorders",
          margin: [0, 30, 0, 0],
        },
      ],
      styles: {
        header: { fontSize: 14, margin: [0, 10, 0, 0] },
        header2: { fontSize: 14, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, alignment: "right" },
        invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" },
      },
      // footer: function () {
      //   return {
      //     columns: [
      //       { text: "Eraya Health Care", alignment: "left", margin: [20, 0] },
      //       {
      //         text: `Page ${this.pageCount}`,
      //         alignment: "right",
      //         margin: [0, 0, 20, 0],
      //       },
      //     ],
      //     margin: [0, 10, 0, 0],
      //   };
      // },
      footer: function (currentPage, pageCount) {
        return {
          columns: [
            { text: "Eraya Health Care", alignment: "left", margin: [20, 0] },
            {
              text: `Page ${currentPage} of ${pageCount}`,
              alignment: "right",
              margin: [0, 0, 20, 0],
            },
          ],
          margin: [0, 10, 0, 0],
        };
      },
    };

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
        bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
        italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
        bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${patientData._id}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// GENERATE CERTIFICATE
// ===========================
exports.generateCertificate = async (req, res) => {
  try {
    const { id } = req.query;
    const imagePath = path.resolve(__dirname, "../images/ErayaLogo.png");
    const stampPath = path.resolve(__dirname, "../images/stamp.png");

    let imageDataUri = null;
    let stampDataUri = null;

    try {
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      imageDataUri = `data:image/png;base64,${imageBase64}`;
      const stampBase64 = fs.readFileSync(stampPath).toString("base64");
      stampDataUri = `data:image/png;base64,${stampBase64}`;
    } catch (err) {
      console.error("Image load error:", err.message);
    }

    const data = await Appointment.findById(id)
      .populate("patientId")
      .populate("doctorId")
      .lean()
      .exec();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const docDefinition = {
      content: [
        {
          columns: [
            {
              image: imageDataUri,
              width: 150,
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              color: "#13756f",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          text: "TO WHOM SO EVER IT MAY CONCERN",
          style: "title",
          alignment: "center",
          margin: [0, 20, 0, 20],
        },
        {
          text: `Date: ${moment().format("D/M/YYYY")}`,
          alignment: "right",
          style: "date",
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        {
          text: `This letter is to certify that ${data.patientId.name} is suffering from ${data.treatment}.`,
          style: "paragraph",
          margin: [0, 10, 0, 10],
        },
        {
          text: `He/She was diagnosed with ${data.treatment} on ${moment(
            data.date
          ).format(
            "DD/MM/YYYY"
          )} and is having difficulty in performing few daily living activities. As per his/her ${
            data.treatment
          } he/she shall require elaser calmative therapy and advance physiotherapy exercise for approx. 30 sessions depending on the prognosis.`,
          style: "paragraph",
          margin: [0, 0, 0, 10],
        },
        {
          text: `During the treatment days we suggest to take rest and avoid stressful activities like prolong standing/sitting/walking.`,
          style: "paragraph",
          margin: [0, 0, 0, 15],
        },
        {
          text: `This certificate is issued on request by ${data.patientId.name}`,
          bold: true,
          style: "paragraph",
          margin: [0, 0, 0, 40],
        },
        {
          columns: [
            {},
            {
              stack: [
                { text: "Thank You,", style: "paragraph" },
                { text: "Eraya Health Care", style: "paragraph" },
              ],
              alignment: "right",
            },
          ],
        },
        {
          columns: [
            {},
            {
              image: stampDataUri,
              width: 120,
              margin: [20, 0, 0, 0],
            },
          ],
        },
      ],
      styles: {
        title: { fontSize: 16, bold: true },
        date: { fontSize: 10 },
        paragraph: { fontSize: 12, lineHeight: 1.5 },
      },
    };

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
        bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
        italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
        bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=certificate_${data.patientId.name}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// GENERATE RECEIPT
// ===========================
exports.generateReceipt = async (req, res) => {
  try {
    const imagePath = path.resolve(__dirname, "../images/ErayaLogo.png");
    const signPath = path.resolve(__dirname, "../images/Disha Sign.png");
    const stampPath = path.resolve(__dirname, "../images/stamp.png");

    let imageDataUri = null;
    let signDataUri = null;
    let stampDataUri = null;

    try {
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      const signBase64 = fs.readFileSync(signPath).toString("base64");
      const stampBase64 = fs.readFileSync(stampPath).toString("base64");

      imageDataUri = `data:image/png;base64,${imageBase64}`;
      signDataUri = `data:image/png;base64,${signBase64}`;
      stampDataUri = `data:image/png;base64,${stampBase64}`;
    } catch (err) {
      console.error("Image load error:", err.message);
    }

    const { startDate, endDate, patient, doctor } = req.query;

    if (!patient || !startDate || !endDate || !doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Parse dates
    let parsedStart = moment(startDate, "DD/MM/YYYY").startOf("day").toDate();
    let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf("day").toDate();

    // Aggregate appointment data
    const data = await Appointment.aggregate([
      {
        $match: {
          patientId: new mongoose.Types.ObjectId(patient),
          doctorId: new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientData",
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorData",
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          treatment: 1,
          description: 1,
          payment: { $toDouble: "$payment" },
          patientName: { $arrayElemAt: ["$patientData.name", 0] },
          doctorName: { $arrayElemAt: ["$doctorData.name", 0] },
        },
      },
      {
        $group: {
          _id: "$patientName",
          doctorName: { $first: "$doctorName" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              treatment: "$treatment",
              description: "$description",
              payment: "$payment",
            },
          },
          totalAmount: { $sum: "$payment" },
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found for the given patient and date range.",
      });
    }

    const patientData = data[0];
    let recordData =
      patientData && patientData.records && patientData.records[0];
    let lastDataArray = patientData?.records?.[patientData.records.length - 1];

    const receiptNumber = await generateReceiptNumber();

    const docDefinition = {
      content: [
        {
          columns: [
            {
              image: imageDataUri,
              width: 150,
            },
            {
              text: "Receipt",
              style: "invoiceTitle",
              alignment: "right",
              margin: [0, 20, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              color: "#13756f",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              text: [
                { text: "Receipt No.:- ", bold: true },
                `${receiptNumber}`,
              ],
              style: "header",
            },
            {
              text: [
                { text: "Date:- ", bold: true },
                `${moment().format("DD/MM/YYYY")}`,
              ],
              style: "header",
              margin: [110, 10, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              text: [
                { text: "Patient Name:- ", bold: true },
                `${patientData._id}`,
              ],
              style: "header",
            },
            {
              text: [
                { text: "Doctor Name:- ", bold: true },
                `${patientData.doctorName}`,
              ],
              style: "header",
              margin: [50, 10, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            headerRows: 1,
            widths: [50, 80, 150, 50, "*", "*"],
            body: [
              [
                {
                  text: "Sr. No.",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Start Date",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Treatment",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "No. Rx",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  lineHeight: 1.5,
                  alignment: "center",
                },
                {
                  text: "Per Day",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  alignment: "center",
                  lineHeight: 1.5,
                },
                {
                  text: "Total Rs.",
                  bold: true,
                  fillColor: "#166964",
                  color: "#fff",
                  alignment: "center",
                  lineHeight: 1.5,
                },
              ],
              [
                { text: 1, alignment: "center" },
                {
                  text:
                    lastDataArray && lastDataArray.date
                      ? moment(lastDataArray.date).format("DD/MM/YYYY")
                      : "-" || "N/A",
                  alignment: "center",
                },
                {
                  text: recordData ? recordData.treatment : "-" || "N/A",
                  alignment: "center",
                },
                {
                  text: patientData.records.length || "N/A",
                  alignment: "center",
                },
                {
                  text:
                    recordData.payment != null
                      ? `${Number(recordData.payment)}/-`
                      : "0.00/-",
                  alignment: "right",
                },
                {
                  text:
                    recordData.payment != null
                      ? `${
                          Number(recordData.payment) *
                          patientData.records.length
                        }/-`
                      : "0.00/-",
                  alignment: "right",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 30, 0, 0],
        },
        {
          text: [
            {
              text: "Payment received at Eraya Health Care for the given treatment. If you have any questions concerning this invoice contact Eraya Health Care",
            },
          ],
          margin: [0, 50, 0, 0],
        },
        {
          text: [{ text: "Thank you Eraya Health Care" }],
          margin: [0, 20, 0, 0],
        },
        {
          columns: [
            {},
            {
              image: signDataUri,
              width: 120,
              margin: [20, 70, 0, 0],
            },
          ],
        },
        {
          text: [{ text: "Dr. Disha Shah" }],
          fontSize: 14,
          alignment: "right",
          margin: [0, 20, 0, 0],
        },
        {
          columns: [
            {},
            {
              image: stampDataUri,
              width: 120,
              margin: [20, 20, 0, 0],
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 14, margin: [0, 10, 0, 0] },
        header2: { fontSize: 14, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, alignment: "right" },
        invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" },
      },
      footer: function () {
        return {
          margin: [0, 0, 0, 0],
          table: {
            widths: ["*", "*", "*"],
            body: [
              [
                {
                  text: "+91 84870 77767",
                  fontSize: 10,
                  margin: [10, 9],
                  color: "#ffffff",
                },
                {
                  text: "B/513, AWS-3, Manav Mandir Road Memnagar, Ahmedabad (Gujarat), 380052",
                  fontSize: 10,
                  margin: [10, 5],
                  color: "#ffffff",
                },
                {
                  text: "erayahealthcare@gmail.com",
                  fontSize: 10,
                  margin: [30, 9],
                  color: "#ffffff",
                },
              ],
            ],
          },
          layout: {
            fillColor: function () {
              return "#166964";
            },
            hLineWidth: function () {
              return 0;
            },
            vLineWidth: function () {
              return 0;
            },
          },
          margin: [0, 0, 0, 0],
        };
      },
    };

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
        bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
        italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
        bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${patientData._id}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// GENERATE PRESCRIPTION
// ===========================
exports.generatePrescription = async (req, res) => {
  try {
    const imagePath = path.resolve(__dirname, "../images/ErayaLogo.png");
    const signPath = path.resolve(__dirname, "../images/Disha Sign.png");
    const stampPath = path.resolve(__dirname, "../images/stamp.png");
    const lightStampPath = path.resolve(__dirname, "../images/LightStamp.png");

    let imageDataUri = null;
    let signDataUri = null;
    let stampDataUri = null;
    let lightStampDataUri = null;

    try {
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      const signBase64 = fs.readFileSync(signPath).toString("base64");
      const stampBase64 = fs.readFileSync(stampPath).toString("base64");
      const lightStampBase64 = fs
        .readFileSync(lightStampPath)
        .toString("base64");

      imageDataUri = `data:image/png;base64,${imageBase64}`;
      signDataUri = `data:image/png;base64,${signBase64}`;
      stampDataUri = `data:image/png;base64,${stampBase64}`;
      lightStampDataUri = `data:image/png;base64,${lightStampBase64}`;
    } catch (err) {
      console.error("Image load error:", err.message);
    }

    const { startDate, endDate, patient, doctor } = req.query;

    if (!patient || !startDate || !endDate || !doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // Parse dates
    let parsedStart = moment(startDate, "DD/MM/YYYY").startOf("day").toDate();
    let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf("day").toDate();

    // Aggregate appointment data
    const data = await Appointment.aggregate([
      {
        $match: {
          patientId: new mongoose.Types.ObjectId(patient),
          doctorId: new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patientData",
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorData",
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          treatment: 1,
          description: 1,
          payment: { $toDouble: "$payment" },
          patientName: { $arrayElemAt: ["$patientData.name", 0] },
          doctorName: { $arrayElemAt: ["$doctorData.name", 0] },
        },
      },
      {
        $group: {
          _id: "$patientName",
          doctorName: { $first: "$doctorName" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              treatment: "$treatment",
              description: "$description",
              payment: "$payment",
            },
          },
          totalAmount: { $sum: "$payment" },
        },
      },
    ]);

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found for the given patient and date range.",
      });
    }

    const patientData = data[0];

    const docDefinition = {
      content: [
        {
          columns: [
            {},
            {
              image: imageDataUri,
              width: 150,
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "auto",
              text: [
                { text: "Patient Name", bold: true },
                { text: " :- ", bold: true },
              ],
              margin: [0, 0, 5, 0],
            },
            {
              width: "*",
              stack: [
                { text: `${patientData._id || ""}`, margin: [0, 0, 0, 2] },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 400,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "auto",
              text: [
                { text: "Gender", bold: true },
                { text: " :- ", bold: true },
              ],
              margin: [0, 0, 5, 0],
            },
            {
              width: "*",
              stack: [
                { text: "Male", margin: [50, 0, 0, 2] },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                },
              ],
            },
            {
              width: "auto",
              text: [
                { text: "Date", bold: true },
                { text: " :- ", bold: true },
              ],
              margin: [0, 0, 5, 0],
            },
            {
              width: "*",
              stack: [
                { text: moment().format("DD/MM/YYYY"), margin: [50, 0, 0, 2] },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          text: [{ text: "Rx," }],
          fontSize: 16,
          bold: true,
          margin: [0, 20, 0, 0],
        },
        {
          image: lightStampDataUri,
          width: 250,
          margin: [0, 80, 0, 0],
          alignment: "center",
        },
        {},
        {
          alignment: "right",
          columns: [
            {},
            {},
            {
              text: [
                { text: "Consulting Doctor Name", bold: true },
                { text: " :- ", bold: true },
              ],
            },
            {
              stack: [
                {
                  text: "Dr. Disha Shah",
                  margin: [0, 0, 0, 2],
                  alignment: "center",
                },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 150,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                  margin: [0, 0, 0, 0],
                },
              ],
            },
          ],
          margin: [-60, 180, 0, 0],
        },
        {
          alignment: "right",
          columns: [
            {},
            {},
            {
              text: [
                { text: "Signature", bold: true },
                { text: " :- ", bold: true },
              ],
            },
            {
              stack: [
                {
                  text: "",
                  margin: [0, 0, 0, 2],
                  alignment: "center",
                },
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 15,
                      x2: 150,
                      y2: 15,
                      lineWidth: 0.5,
                    },
                  ],
                  margin: [0, 0, 0, 0],
                },
              ],
            },
          ],
          margin: [-60, 20, 0, 0],
        },
      ],
      styles: {
        header: { fontSize: 14, margin: [0, 10, 0, 0] },
        header2: { fontSize: 14, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, alignment: "right" },
        invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" },
      },
      footer: function () {
        return {
          margin: [0, 0, 0, 0],
          table: {
            widths: ["*", "*", "*"],
            body: [
              [
                {
                  text: "+91 84870 77767",
                  fontSize: 10,
                  margin: [10, 9],
                  color: "#ffffff",
                },
                {
                  text: "B/513, AWS-3, Manav Mandir Road Memnagar, Ahmedabad (Gujarat), 380052",
                  fontSize: 10,
                  margin: [10, 5],
                  color: "#ffffff",
                },
                {
                  text: "erayahealthcare@gmail.com",
                  fontSize: 10,
                  margin: [30, 9],
                  color: "#ffffff",
                },
              ],
            ],
          },
          layout: {
            fillColor: function () {
              return "#166964";
            },
            hLineWidth: function () {
              return 0;
            },
            vLineWidth: function () {
              return 0;
            },
          },
          margin: [0, 0, 0, 0],
        };
      },
    };

    const fonts = {
      Roboto: {
        normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
        bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
        italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
        bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
      },
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=${patientData._id}.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ===========================
// GET APPOINTMENTS BY PATIENT
// ===========================
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    const appointments = await Appointment.find({
      patientId,
      isDeleted: false,
    })
      .populate("doctorId", "name email phone docSpeciality")
      .populate("patientId", "name email phone")
      .sort({ appointmentDate: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAppointmentsWithTime = async (req, res) => {
  try {
    // const appointments = await Appointment.find({
    //   startTime: { $exists: true, $ne: null, $ne: "" },
    //   endTime: { $exists: true, $ne: null, $ne: "" },
    //   isDeleted: false,
    // })
    //   .populate("doctorId")
    //   .populate("patientId")
    //   .sort({ appointmentDate: -1 });

    const doctorId = req.user.doctorId;

    const findObject = { docApproval: "pending", isDeleted: false };

    if (doctorId) {
      findObject.doctorId = doctorId;
    }

    const appointments = await Appointment.find(findObject)
      .populate("doctorId")
      .populate("patientId")
      .sort({ appointmentDate: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// UPDATE APPOINTMENT STATUS
// ===========================
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { docApproval } = req.body;

    // Validate status
    if (!["pending", "approved", "rejected"].includes(docApproval)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { docApproval },
      { new: true }
    )
      .populate("doctorId")
      .populate("patientId");

    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment ${docApproval} successfully`,
      data: updatedAppointment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ===========================
// GET AVAILABLE SLOTS
// ===========================
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, appointmentDate } = req.query;
    const DoctorUnavailability = require("../models/DoctorUnavailability");

    if (!doctorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and appointment date are required",
      });
    }

    // Get doctor with working hours
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Parse working hours
    const startTime = doctor.workingHours?.startTime || "09:00";
    const endTime = doctor.workingHours?.endTime || "17:00";

    // Get booked slots for this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999),
      },
      isDeleted: false,
    });

    // Get doctor unavailability
    const unavailability = await DoctorUnavailability.findOne({ doctorId });

    // Check if date is full day off
    const appointmentDateObj = new Date(appointmentDate);
    const dayName = appointmentDateObj.toLocaleDateString("en-US", { weekday: "long" });
    
    let isFullDayOff = false;
    let unavailabilityReason = "";
    const unavailableCustomSlots = [];

    if (unavailability) {
      // Check full day dates
      isFullDayOff = unavailability.fullDayDates.some(
        (item) =>
          new Date(item.date).toDateString() === appointmentDateObj.toDateString()
      );

      if (isFullDayOff) {
        const fullDayItem = unavailability.fullDayDates.find(
          (item) =>
            new Date(item.date).toDateString() === appointmentDateObj.toDateString()
        );
        unavailabilityReason = fullDayItem?.reason || "Doctor not available";
      }

      // Check weekly off
      // if (!isFullDayOff && unavailability.weeklyOff.includes(dayName)) {
      //   isFullDayOff = true;
      //   unavailabilityReason = `Weekly off on ${dayName}`;
      // }

      // Get custom unavailable slots for this date
      const customSlotEntry = unavailability.customSlots.find(
        (item) =>
          new Date(item.date).toDateString() === appointmentDateObj.toDateString()
      );

      if (customSlotEntry) {
        unavailableCustomSlots.push(
          ...customSlotEntry.slots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
          }))
        );
      }
    }

    // If full day off, return all slots as unavailable
    if (isFullDayOff) {
      const slots = [];
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      let currentHour = startHour;
      let currentMin = startMin;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin < endMin)
      ) {
        const nextHour = currentMin + 60 === 60 ? currentHour + 1 : currentHour;
        const nextMin = currentMin + 60 === 60 ? 0 : currentMin + 60;

        const slotStart = `${String(currentHour).padStart(2, "0")}:${String(
          currentMin
        ).padStart(2, "0")}`;
        const slotEnd = `${String(nextHour).padStart(2, "0")}:${String(
          nextMin
        ).padStart(2, "0")}`;

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          isBooked: true,
          isHoliday: true,
          reason: unavailabilityReason,
        });

        currentHour = nextHour;
        currentMin = nextMin;
      }

      return res.status(200).json({
        success: true,
        data: slots,
      });
    }

    // Generate 1-hour slots
    const slots = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const nextHour = currentMin + 60 === 60 ? currentHour + 1 : currentHour;
      const nextMin = currentMin + 60 === 60 ? 0 : currentMin + 60;

      const slotStart = `${String(currentHour).padStart(2, "0")}:${String(
        currentMin
      ).padStart(2, "0")}`;
      const slotEnd = `${String(nextHour).padStart(2, "0")}:${String(
        nextMin
      ).padStart(2, "0")}`;

      // Check if slot is booked by patient
      const isBooked = bookedAppointments.some(
        (apt) =>
          apt.startTime === slotStart &&
          apt.endTime === slotEnd &&
          apt.docApproval !== "rejected"
      );

      // Check if slot is in unavailable custom slots
      const isCustomUnavailable = unavailableCustomSlots.some(
        (slot) => slot.startTime === slotStart && slot.endTime === slotEnd
      );

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        isBooked,           // Patient already booked
        isUnavailable: isCustomUnavailable,  // Doctor marked as unavailable (custom slot)
        isHoliday: false,    // Not a full day/weekly off (handled above)
        isAvailable: !isBooked && !isCustomUnavailable,  // Can be booked
      });

      currentHour = nextHour;
      currentMin = nextMin;
    }

    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// CREATE APPOINTMENT WITH SLOT
// ===========================
exports.createAppointmentWithSlot = async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
      treatment,
      description,
      patientData,
    } = req.body;

    // Validate required fields
    if (!doctorId || !patientId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999),
      },
      startTime,
      endTime,
      isDeleted: false,
      docApproval: "approved",
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const Patient = require("../models/patient");
    const PatientForm = require("../models/patientform");
    const Doctor = require("../models/doctor");

    let finalPatientId = patientId;
    let patientFormId = null;

    // ✅ CASE 1: Check if patient already exists in Patient DB by phone
    if (patientData && patientData.phone) {
      const existingPatient = await Patient.findOne({
        phone: patientData.phone,
      });

      if (existingPatient) {
        finalPatientId = existingPatient._id;
        console.log("✅ Patient already exists in Patient DB:", finalPatientId);
      } else {
        // Create new patient in Patient DB
        const newPatient = await Patient.create({
          name: patientData.name || "",
          phone: patientData.phone || "",
          email: patientData.email || "",
          age: patientData.age || "",
          gender: patientData.gender || "",
          occupation: patientData.occupation || "",
          address: patientData.address || "",
          pincode: patientData.pincode || "",
          city: patientData.city || "",
          state: patientData.state || "",
          area: patientData.area || "",
        });
        finalPatientId = newPatient._id;
        console.log("✅ New patient created in Patient DB:", finalPatientId);
      }

      // ✅ CASE 2: Check if PatientForm already exists with same phone AND name
      const existingPatientForm = await PatientForm.findOne({
        "patient.phone": patientData.phone,
        "patient.name": patientData.name,
      });

      if (!existingPatientForm) {
        // Create PatientForm only if it doesn't exist
        const doctorData = await Doctor.findById(doctorId);
        const newPatientForm = await PatientForm.create({
          patient: {
            _id: finalPatientId,
            name: patientData.name || "",
            phone: patientData.phone || "",
            age: patientData.age || "",
            gender: patientData.gender || "",
            occupation: patientData.occupation || "",
            address: patientData.address || "",
            pincode: patientData.pincode || "",
            city: patientData.city || "",
            state: patientData.state || "",
            area: patientData.area || "",
          },
          doctor: doctorData
            ? { _id: doctorData._id, name: doctorData.name }
            : null,
          // treatment: treatment || "",
          description: description || "",
        });
        patientFormId = newPatientForm._id;
        console.log("✅ New PatientForm created:", patientFormId);
      } else {
        // PatientForm already exists - use its ID
        patientFormId = existingPatientForm._id;
        console.log("✅ PatientForm already exists:", patientFormId);
      }
    }

    // Create new appointment with patientId and patientFormId
    const newAppointment = await Appointment.create({
      doctorId,
      patientId: finalPatientId,
      patientFormId: patientFormId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      treatment,
      description: description || "",
      date: new Date(appointmentDate),
    });

    // Populate doctor and patient data
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate("doctorId", "name email phone docSpeciality")
      .populate("patientId", "name email phone")
      .populate("patientFormId");

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: populatedAppointment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
