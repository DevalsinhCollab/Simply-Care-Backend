const moment = require("moment");
const PatientFormSchema = require("../models/patientform");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { generateReceiptNumber } = require("../comman/comman");
const PatientSchema = require("../models/patient");
const Patient = require("../models/patient");

// exports.addPatientForm = async (req, res) => {
//     try {
//         const patientData = await PatientFormSchema.create(req.body);

//         return res.status(200).json({
//             success: true,
//             message: "Added Successfully",
//             data: patientData,
//         });
//     } catch (error) {
//         return res.status(400).json({ message: error.message, success: false });
//     }
// };

exports.addPatientForm = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      phone,
      name,
      age,
      gender,
      occupation,
      address,
      pincode,
      city,
      state,
      area,

      referenceDoctor,
      ...otherFields
    } = req.body;

    let finalPatient;

    // ✅ CASE 1 — User selected EXISTING patient
    if (patient && patient._id) {
      finalPatient = await PatientSchema.findById(patient._id);
    }

    // ✅ CASE 2 — No patient._id → manually entered → create or find by phone
    if (!finalPatient) {
      finalPatient = await PatientSchema.findOne({ phone: phone });

      if (!finalPatient) {
        finalPatient = await PatientSchema.create({
          name: name,
          phone: phone,
          age: age,
          gender: gender,
          occupation: occupation,
          address: address,
          pincode: pincode,
          city: city,
          state: state,
          area: area,
        });
      }
    }


    // 🟢 Now prepare final payload
    const payload = {
      patient: {
        _id: finalPatient._id,
        name: finalPatient.name,
        phone: finalPatient.phone,
        age: finalPatient.age,
        address: finalPatient.address,
        pincode: finalPatient.pincode,
        city: finalPatient.city,
        state: finalPatient.state,
        occupation: finalPatient.occupation,
        area: finalPatient.area,
        gender: finalPatient.gender,
      },
      doctor: doctor ? { _id: doctor._id, name: doctor.name } : null,
      referenceDoctor: referenceDoctor
        ? { _id: referenceDoctor.value, name: referenceDoctor.label }
        : null,
      ...otherFields,
    };

    const patientForm = await PatientFormSchema.create(payload);

    return res.status(200).json({
      success: true,
      message: "Added Successfully",
      data: patientForm,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// exports.addPatientForm = async (req, res) => {
//   try {
//     const {
//       // patient fields
//       name,
//       phone,
//       age,
//       gender,
//       occupation,
//       address,
//       pincode,
//       city,
//       state,
//       area,

//       // doctor fields
//       doctor,
//       referenceDoctor,

//       // other form fields
//       ...otherFields
//     } = req.body;

//     const payload = {
//       // map nested patient
//       patient: {
//         name,
//         phone,
//         age,
//         gender,
//         occupation,
//         address,
//         pincode,
//         city,
//         state,
//         area,
//       },

//       // map doctor to doctorSchema format
//       doctor: doctor ? { _id: doctor.value, name: doctor.label } : null,

//       referenceDoctor: referenceDoctor
//         ? { _id: referenceDoctor.value, name: referenceDoctor.label }
//         : null,

//       // all other fields (description, dosage, treatment, etc.)
//       ...otherFields,
//     };
//     let patient = await PatientSchema.findOne({ phone: phone });
//     if (!patient) {
//       patient = await PatientSchema.create(payload.patient);
//     }
//     payload.patient = patient;
//     const patientForm = await PatientFormSchema.create(payload);

//     return res.status(200).json({
//       success: true,
//       message: "Added Successfully",
//       data: patientForm,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

exports.getPatientsForm = async (req, res) => {
  try {
    const {
      page = 0,
      pageSize = 10,
      search,
      patient,
      doctor,
      startDate,
      endDate,
    } = req.query;

    const userLoggedClinicId = req.user.clinicId;

    console.log("User Clinic ID:", req.user);

    let findObject = { isDeleted: false };

    if(userLoggedClinicId){
      findObject.clinicId = userLoggedClinicId;
    }

    if (search && search !== "") {
      findObject = {
        $or: [
          { description: { $regex: search, $options: "i" } },
          { "doctor.name": { $regex: search, $options: "i" } },
          { "patient.name": { $regex: search, $options: "i" } },
          { "patient.email": { $regex: search, $options: "i" } },
          { "patient.phone": { $regex: search, $options: "i" } },
          { "patient.address": { $regex: search, $options: "i" } },
          { treatment: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (patient && patient !== "") {
      findObject = {
        ...findObject,
        "patient._id": patient,
      };
    }

    if (doctor && doctor !== "") {
      findObject = {
        ...findObject,
        "doctor._id": doctor,
      };
    }

    if (startDate || endDate) {
      findObject.date = {};

      if (startDate && startDate !== "null") {
        const parsedStart = moment(startDate, "DD/MM/YYYY")
          .startOf("day")
          .toDate();
        findObject.date.$gte = parsedStart;
      }

      if (endDate && endDate !== "null") {
        const parsedEnd = moment(endDate, "DD/MM/YYYY").endOf("day").toDate();
        findObject.date.$lte = parsedEnd;
      }
    }

    const skip = page * pageSize;
    const totalCount = await PatientFormSchema.countDocuments(findObject);
    const doctors = await PatientFormSchema.find(findObject)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    return res.status(200).json({ data: doctors, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// New: get history (all forms) for a specific patient (clinic-scoped)
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }

    const userLoggedClinicId = req.user && req.user.clinicId;

    const findObject = { isDeleted: false, 'patient._id': patientId };
    if (userLoggedClinicId) findObject.clinicId = userLoggedClinicId;


    console.log('getPatientHistory findObject', findObject);

    const forms = await PatientFormSchema.find(findObject)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const totalCount = forms.length;

    return res.status(200).json({ success: true, data: forms, totalCount });
  } catch (error) {
    console.error('getPatientHistory error', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// exports.updatePatientForm = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const patientData = await PatientFormSchema.findByIdAndUpdate(
//       id,
//       req.body,
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Updated Successfully",
//       data: patientData,
//     });
//   } catch (error) {
//     return res.status(400).json({ message: error.message, success: false });
//   }
// };

// const PatientForm = require("../models/PatientForm");


exports.updatePatientForm = async (req, res) => {
  try {

    const { id } = req.params;
    const formData = req.body;

    // 1️⃣ Validate patientFormId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient form ID",
      });
    }

    // 2️⃣ Validate mobile number
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    // 3️⃣ Find Patient by mobile
    const patient = await Patient.findOne({
      phone: formData.phone,
      isDeleted: false,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found with this mobile number",
      });
    }

    // 4️⃣ Update Patient (safe fields only)
    const patientUpdateData = {
      name: formData.name,
      email: formData.email,
      gender: formData.gender,
      age: formData.age,
      occupation: formData.occupation,
      address: formData.address,
      area: formData.area,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    };

    Object.keys(patientUpdateData).forEach(
      (key) =>
        patientUpdateData[key] === undefined &&
        delete patientUpdateData[key]
    );

    await Patient.findByIdAndUpdate(patient._id, {
      $set: patientUpdateData,
    });

    // 5️⃣ Update PatientForm
    const updatedForm = await PatientFormSchema.findByIdAndUpdate(
      id,
      {
        ...formData,
        patientId: patient._id, // link for future
      },
      { new: true, runValidators: true }
    );

    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: "Patient form not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient & PatientForm updated successfully",
      data: updatedForm,
    });
  } catch (error) {
    console.error("🔥 INTERNAL SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


// exports.updatePatientForm = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const cleanObject = (obj) => {
//       Object.keys(obj).forEach((key) => {
//         if (obj[key] === null || obj[key] === undefined) {
//           delete obj[key];
//         }
//       });
//       return obj;
//     };

//     const updateData = cleanObject({ ...req.body });

//     const patientData = await PatientFormSchema.findByIdAndUpdate(
//       id,
//       { $set: updateData }, // ✅ SAFE UPDATE
//       { new: true }
//     )
//       .populate("patient")
//       .populate("doctor")
//       .populate("referenceDoctor");

//     return res.status(200).json({
//       success: true,
//       message: "Updated Successfully",
//       data: patientData,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.deletePatientForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the patientForm to find the associated patient
    const patientForm = await PatientFormSchema.findById(id);

    if (!patientForm) {
      return res.status(404).json({
        success: false,
        message: "PatientForm not found",
      });
    }

    // Mark the patientForm as deleted
    const deletedForm = await PatientFormSchema.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    // Mark the associated patient as deleted
    if (patientForm.patient && patientForm.patient._id) {
      await PatientSchema.findByIdAndUpdate(
        patientForm.patient._id,
        { isDeleted: true },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Deleted Successfully",
      data: deletedForm,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

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

    // Aggregate patient form data
    const data = await PatientFormSchema.aggregate([
      {
        $match: {
          "patient._id": new mongoose.Types.ObjectId(patient),
          "doctor._id": new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
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
          "patient.name": 1,
          "doctor.name": 1,
          treatment: 1,
          payment: { $toDouble: "$payment" },
        },
      },
      {
        $group: {
          _id: "$patient.name",
          doctorName: { $first: "$doctor.name" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              doctor: "$doctor.name",
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

    const data = await PatientFormSchema.findById(id).lean().exec();

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
          text: `This letter is to certify that ${data.patient.name} is suffering from ${data.treatment}.`,
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
          text: `This certificate is issued on request by ${data.patient.name}`,
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
      `inline; filename=${data.patient.name} Certificate.pdf`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

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

    // Aggregate patient form data
    const data = await PatientFormSchema.aggregate([
      {
        $match: {
          "patient._id": new mongoose.Types.ObjectId(patient),
          "doctor._id": new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
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
          "patient.name": 1,
          "doctor.name": 1,
          description: 1,
          payment: { $toDouble: "$payment" },
        },
      },
      {
        $group: {
          _id: "$patient.name",
          doctorName: { $first: "$doctor.name" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              doctor: "$doctor.name",
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
                  text: recordData ? recordData.description : "-" || "N/A",
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

    // Aggregate patient form data
    const data = await PatientFormSchema.aggregate([
      {
        $match: {
          "patient._id": new mongoose.Types.ObjectId(patient),
          "doctor._id": new mongoose.Types.ObjectId(doctor),
          date: { $gte: parsedStart, $lte: parsedEnd },
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
          "patient.name": 1,
          "doctor.name": 1,
          description: 1,
          payment: { $toDouble: "$payment" },
        },
      },
      {
        $group: {
          _id: "$patient.name",
          doctorName: { $first: "$doctor.name" },
          date: { $first: "$date" },
          records: {
            $push: {
              date: "$date",
              doctor: "$doctor.name",
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
                { text: `${patientData._id || ""}`, margin: [0, 0, 0, 2] }, // Text above the line
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
                { text: "Male", margin: [50, 0, 0, 2] }, // Text above the line
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
                { text: moment().format("DD/MM/YYYY"), margin: [50, 0, 0, 2] }, // Text above the line
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

exports.getPatientsFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const patientFormData = await PatientFormSchema.findById(id)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.status(200).json({ data: patientFormData, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.assessmentForm = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Patient ID is required." });
    }

    const { name, age, phone, address, patientId } = req.body;

    let patient = {
      name: name,
      age: age,
      phone: phone,
      address: address,
    };

    const patientFormData = await PatientFormSchema.findByIdAndUpdate(
      id,
      { ...req.body, patient: { _id: patientId, ...patient } },
      { new: true }
    );
    await PatientSchema.findByIdAndUpdate(
      patientId,
      { ...patient },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Assessment Added Successfully",
      data: patientFormData,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.generateAssessment = async (req, res) => {
  try {
    const imagePath = path.resolve(__dirname, "../images/ErayaLogo.png");

    let imageDataUri = null;

    try {
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      imageDataUri = `data:image/png;base64,${imageBase64}`;
    } catch (err) {
      console.error("Image load error:", err.message);
    }

    const { id } = req.query;

    const patientFormData = await PatientFormSchema.findById(id);

    const docDefinition = {
      content: [
        {
          columns: [
            {
              image: imageDataUri,
              width: 150,
            },
            {
              text: "",
              style: "invoiceTitle",
              alignment: "right",
              margin: [0, 20, 0, 0],
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },
        {
          text: "ASSESSMENT FORM",
          style: "assessmentTitle",
          alignment: "center",
          margin: [0, 0, 0, 0],
        },
        {
          text: "General Information",
          fontSize: 15,
          bold: true,
          margin: [0, 10, 0, 0],
        },
        {
          columns: [
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Pt. Name",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.patient &&
                          patientFormData.patient.name) ||
                        "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Phone",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.patient &&
                          patientFormData.patient.phone) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Age",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.patient &&
                          patientFormData.patient.age) ||
                        "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Address",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.patient &&
                          patientFormData.patient.address) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [0, 20, 10, 0], // spacing between columns
            },
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Payment",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.payment) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Date",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.date &&
                          moment(patientFormData.date).format("DD/MM/YYYY")) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [10, 20, 0, 0],
            },
          ],
        },
        {
          text: "Examination",
          fontSize: 15,
          bold: true,
          margin: [0, 20, 0, 0],
        },
        {
          columns: [
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Flex",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.flex,
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Abd",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.abd,
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [0, 20, 10, 0], // spacing between columns
            },
          ],
        },
        {
          text: "Palpation & Other Info",
          fontSize: 15,
          bold: true,
          margin: [0, 20, 0, 0],
        },
        {
          columns: [
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Spasm",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.spasm,
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Stiffness",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.stiffness,
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Tenderness",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.tenderness,
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Effusion",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.effusion,
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [0, 20, 10, 0], // spacing between columns
            },
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "MMT",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.mmt,
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "C/C",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.cc,
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "History",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: patientFormData && patientFormData.history,
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Ex. Comment",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.examinationComment) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [10, 20, 0, 0],
            },
          ],
        },
        {
          text: "Functional Assessment and Treatment",
          fontSize: 15,
          bold: true,
          margin: [0, 150, 0, 0],
        },
        {
          columns: [
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "NRS",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.nrs) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 1",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage1) || "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 2",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage2) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 3",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage3) || "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [0, 20, 10, 0], // spacing between columns
            },
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 4",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage4) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 5",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage5) || "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Dosage 6",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.dosage6) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [10, 20, 0, 0],
            },
          ],
        },
        {
          text: "Diagnosis",
          fontSize: 15,
          bold: true,
          margin: [0, 20, 0, 0],
        },
        {
          columns: [
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Description",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData && patientFormData.description) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Joint",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.joint) || "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Treatment",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData && patientFormData.treatment) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Assess By",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: (patientFormData && patientFormData.assessBy) || "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [0, 20, 10, 0], // spacing between columns
            },
            {
              table: {
                headerRows: 1,
                widths: [50, 180],
                body: [
                  [
                    {
                      text: "Name",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text: "Details",
                      bold: true,
                      fillColor: "#166964",
                      color: "#fff",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Doctor",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 10,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.doctor &&
                          patientFormData.doctor.name) ||
                        "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Ref. Doctor",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.referenceDoctor &&
                          patientFormData.referenceDoctor.name) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Payment Type",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData && patientFormData.paymentType) || "",
                      bold: true,
                      color: "black",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                  [
                    {
                      text: "Prescribe Medicine",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      fontSize: 9.5,
                      border: [false, false, true, false],
                      borderColor: [
                        "transparent",
                        "transparent",
                        "#e7e7e7",
                        "transparent",
                      ],
                    },
                    {
                      text:
                        (patientFormData &&
                          patientFormData.prescribeMedicine) ||
                        "",
                      bold: true,
                      color: "black",
                      fillColor: "#e8f4f4",
                      lineHeight: 1.5,
                      alignment: "center",
                      border: [false, false, false, false],
                    },
                  ],
                ],
              },
              margin: [10, 20, 0, 0],
            },
          ],
        },
      ],
      styles: {
        header: { fontSize: 14, margin: [0, 10, 0, 0] },
        header2: { fontSize: 14, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, alignment: "right" },
        assessmentTitle: { fontSize: 20, bold: true, color: "#13756f" },
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
    res.setHeader("Content-Disposition", `inline; filename=Assessment.pdf`);

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
