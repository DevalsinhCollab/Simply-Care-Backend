const moment = require("moment");
const PatientFormSchema = require("../models/patientform");
const PdfPrinter = require("pdfmake");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { generateReceiptNumber } = require("../comman/comman");

exports.addPatientForm = async (req, res) => {
    try {
        const patientData = await PatientFormSchema.create(req.body);

        return res.status(200).json({
            success: true,
            message: "Added Successfully",
            data: patientData,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.getPatientsForm = async (req, res) => {
    try {
        const { page = 0, pageSize = 10, search, patient, doctor, startDate, endDate } = req.query;

        let findObject = {}

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
                "patient._id": patient
            };
        }

        if (doctor && doctor !== "") {
            findObject = {
                ...findObject,
                "doctor._id": doctor
            };
        }

        if (startDate || endDate) {
            findObject.date = {};

            if (startDate && startDate !== "null") {
                const parsedStart = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
                findObject.date.$gte = parsedStart;
            }

            if (endDate && endDate !== "null") {
                const parsedEnd = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();
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

exports.updatePatientForm = async (req, res) => {
    try {
        const { id } = req.params;

        const patientData = await PatientFormSchema.findByIdAndUpdate(id, req.body, { new: true });

        return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            data: patientData,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.deletePatientForm = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await PatientFormSchema.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
            data: patient,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.generateReport = async (req, res) => {
    try {
        const imagePath = path.resolve(__dirname, '../images/ErayaLogo.png');

        let imageDataUri = null;

        try {
            const imageBase64 = fs.readFileSync(imagePath).toString('base64');
            imageDataUri = `data:image/png;base64,${imageBase64}`;
        } catch (err) {
            console.error("Image load error:", err.message);
        }


        const { startDate, endDate, patient, doctor } = req.query;

        if (!patient || !startDate || !endDate || !doctor) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Parse dates
        let parsedStart = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
        let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();

        // Aggregate patient form data
        const data = await PatientFormSchema.aggregate([
            {
                $match: {
                    "patient._id": new mongoose.Types.ObjectId(patient),
                    "doctor._id": new mongoose.Types.ObjectId(doctor),
                    date: { $gte: parsedStart, $lte: parsedEnd }
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    "patient.name": 1,
                    "doctor.name": 1,
                    treatment: 1,
                    payment: { $toDouble: "$payment" }
                }
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
                            payment: "$payment"
                        }
                    },
                    totalAmount: { $sum: "$payment" }
                }
            }
        ]);
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "No data found for the given patient and date range." });
        }

        const patientData = data[0];
        const records = patientData.records.map((record, index) => {
            const isEven = index % 2 === 1;
            const rowStyle = { fillColor: isEven ? '#eaf4f3' : null, lineHeight: 1.5, margin: [0, 5, 0, 5] };
            return [
                { text: `${index + 1}.`, ...rowStyle, alignment: 'center' },
                { text: record.treatment || "N/A", ...rowStyle, alignment: 'center' },
                { text: moment(record.date).format("DD/MM/YYYY"), ...rowStyle, alignment: 'center' },
                {
                    text: record.payment != null
                        ? `${Number(record.payment)}/-`
                        : "0.00/-",
                    alignment: 'right',
                    ...rowStyle,
                    alignment: 'center'
                }
            ];
        });

        const isEvenSubtotal = records.length % 2 === 1;

        records.push([
            { text: 'Sub Total', bold: true, colSpan: 3, alignment: 'right', fillColor: isEvenSubtotal ? '#eaf4f3' : null, lineHeight: 1.5, margin: [0, 5, 0, 5] },
            {}, {},
            { text: `${patientData.totalAmount}/-`, bold: true, alignment: 'right', fillColor: isEvenSubtotal ? '#eaf4f3' : null, lineHeight: 1.5, margin: [0, 5, 0, 5] }
        ]);

        const docDefinition = {
            content: [
                {
                    columns: [
                        {
                            image: imageDataUri,
                            width: 150
                        },
                        {
                            text: 'Invoice',
                            style: 'invoiceTitle',
                            alignment: 'right',
                            margin: [0, 20, 0, 0]
                        }
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, color: "#13756f" }
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        {
                            text: [
                                { text: 'Patient Name:- ', bold: true },
                                `${patientData._id}`
                            ],
                            style: "header"
                        },
                        {
                            text: [
                                { text: 'Date:- ', bold: true },
                                `${patientData.date ? moment(patientData.date).format("DD/MM/YYYY") : "N/A"}`
                            ],
                            style: "header",
                            margin: [110, 10, 0, 0]
                        }
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    text: [
                        { text: 'Doctor Name:- ', bold: true },
                        `${patientData.doctorName}`
                    ],
                    style: "header2"
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [50, 300, '*', 'auto'],
                        body: [
                            [
                                { text: 'Sr. No.', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Treatment', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Date', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Amount', bold: true, fillColor: '#166964', color: '#fff', alignment: 'center', lineHeight: 1.5 }
                            ],
                            ...records
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 30, 0, 0]
                },
            ],
            styles: {
                header: { fontSize: 14, margin: [0, 10, 0, 0] },
                header2: { fontSize: 14, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, alignment: 'right' },
                invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" }
            },
            footer: function () {
                return {
                    margin: [0, 0, 0, 0],
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                {
                                    text: '+91 84870 77767',
                                    fontSize: 10,
                                    margin: [10, 9],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'B/513, AWS-3, Manav Mandir Road Memnagar, Ahmedabad (Gujarat), 380052',
                                    fontSize: 10,
                                    margin: [10, 5],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'erayahealthcare@gmail.com',
                                    fontSize: 10,
                                    margin: [30, 9],
                                    color: '#ffffff'
                                },
                            ]
                        ]
                    },
                    layout: {
                        fillColor: function () {
                            return '#166964';
                        },
                        hLineWidth: function () {
                            return 0;
                        },
                        vLineWidth: function () {
                            return 0;
                        }
                    },
                    margin: [0, 0, 0, 0]
                };
            }


        };

        const fonts = {
            Roboto: {
                normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
                bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
                italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${patientData._id}.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateCertificate = async (req, res) => {
    try {
        const { id } = req.query
        const imagePath = path.resolve(__dirname, '../images/ErayaLogo.png');
        const stampPath = path.resolve(__dirname, '../images/stamp.png');

        let imageDataUri = null;
        let stampDataUri = null;

        try {
            const imageBase64 = fs.readFileSync(imagePath).toString('base64');
            imageDataUri = `data:image/png;base64,${imageBase64}`;

            const stampBase64 = fs.readFileSync(stampPath).toString('base64');
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
                            width: 150
                        },
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, color: "#13756f" }
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    text: 'TO WHOM SO EVER IT MAY CONCERN',
                    style: 'title',
                    alignment: 'center',
                    margin: [0, 20, 0, 20]
                },
                {
                    text: `Date: ${moment().format("D/M/YYYY")}`,
                    alignment: 'right',
                    style: 'date',
                    fontSize: 12,
                    bold: true,
                    margin: [0, 0, 0, 10]
                },
                {
                    text: `This letter is to certify that ${data.patient.name} is suffering from ${data.treatment}.`,
                    style: 'paragraph',
                    margin: [0, 10, 0, 10]
                },
                {
                    text: `He/She was diagnosed with ${data.treatment} on ${moment(data.date).format("DD/MM/YYYY")} and is having difficulty in performing few daily living activities. As per his/her ${data.treatment} he/she shall require elaser calmative therapy and advance physiotherapy exercise for approx. 30 sessions depending on the prognosis.`,
                    style: 'paragraph',
                    margin: [0, 0, 0, 10]
                },
                {
                    text: `During the treatment days we suggest to take rest and avoid stressful activities like prolong standing/sitting/walking.`,
                    style: 'paragraph',
                    margin: [0, 0, 0, 15]
                },
                {
                    text: `This certificate is issued on request by ${data.patient.name}`,
                    bold: true,
                    style: 'paragraph',
                    margin: [0, 0, 0, 40]
                },
                {
                    columns: [
                        {},
                        {
                            stack: [
                                { text: 'Thank You,', style: 'paragraph' },
                                { text: 'Eraya Health Care', style: 'paragraph' }
                            ],
                            alignment: 'right'
                        },
                    ]
                },
                {
                    columns: [
                        {},
                        {
                            image: stampDataUri,
                            width: 120,
                            margin: [20, 0, 0, 0]
                        },
                    ]
                }
            ],
            styles: {
                title: { fontSize: 16, bold: true },
                date: { fontSize: 10 },
                paragraph: { fontSize: 12, lineHeight: 1.5 }
            }
        };


        const fonts = {
            Roboto: {
                normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
                bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
                italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${data.patient.name} Certificate.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateReceipt = async (req, res) => {
    try {
        const imagePath = path.resolve(__dirname, '../images/ErayaLogo.png');
        const signPath = path.resolve(__dirname, '../images/Disha Sign.png');
        const stampPath = path.resolve(__dirname, '../images/stamp.png');

        let imageDataUri = null;
        let signDataUri = null;
        let stampDataUri = null;

        try {
            const imageBase64 = fs.readFileSync(imagePath).toString('base64');
            const signBase64 = fs.readFileSync(signPath).toString('base64');
            const stampBase64 = fs.readFileSync(stampPath).toString('base64');

            imageDataUri = `data:image/png;base64,${imageBase64}`;
            signDataUri = `data:image/png;base64,${signBase64}`;
            stampDataUri = `data:image/png;base64,${stampBase64}`;
        } catch (err) {
            console.error("Image load error:", err.message);
        }


        const { startDate, endDate, patient, doctor } = req.query;

        if (!patient || !startDate || !endDate || !doctor) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Parse dates
        let parsedStart = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
        let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();

        // Aggregate patient form data
        const data = await PatientFormSchema.aggregate([
            {
                $match: {
                    "patient._id": new mongoose.Types.ObjectId(patient),
                    "doctor._id": new mongoose.Types.ObjectId(doctor),
                    date: { $gte: parsedStart, $lte: parsedEnd }
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    "patient.name": 1,
                    "doctor.name": 1,
                    description: 1,
                    payment: { $toDouble: "$payment" }
                }
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
                            payment: "$payment"
                        }
                    },
                    totalAmount: { $sum: "$payment" }
                }
            }
        ]);
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "No data found for the given patient and date range." });
        }

        const patientData = data[0];

        let recordData = patientData && patientData.records && patientData.records[0]
        let lastDataArray = patientData?.records?.[patientData.records.length - 1];

        const receiptNumber = await generateReceiptNumber();

        const docDefinition = {
            content: [
                {
                    columns: [
                        {
                            image: imageDataUri,
                            width: 150
                        },
                        {
                            text: 'Receipt',
                            style: 'invoiceTitle',
                            alignment: 'right',
                            margin: [0, 20, 0, 0]
                        }
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, color: "#13756f" }
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        {
                            text: [
                                { text: 'Receipt No.:- ', bold: true },
                                `${receiptNumber}`
                            ],
                            style: "header"
                        },
                        {
                            text: [
                                { text: 'Date:- ', bold: true },
                                `${moment().format("DD/MM/YYYY")}`
                            ],
                            style: "header",
                            margin: [110, 10, 0, 0]
                        }
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        {
                            text: [
                                { text: 'Patient Name:- ', bold: true },
                                `${patientData._id}`
                            ],
                            style: "header"
                        },
                        {
                            text: [
                                { text: 'Doctor Name:- ', bold: true },
                                `${patientData.doctorName}`
                            ],
                            style: "header",
                            margin: [50, 10, 0, 0]
                        },
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    table: {
                        headerRows: 1,
                        widths: [50, 80, 150, 50, '*', '*'],
                        body: [
                            [
                                { text: 'Sr. No.', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Start Date', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Treatment', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'No. Rx', bold: true, fillColor: '#166964', color: '#fff', lineHeight: 1.5, alignment: 'center' },
                                { text: 'Per Day', bold: true, fillColor: '#166964', color: '#fff', alignment: 'center', lineHeight: 1.5 },
                                { text: 'Total Rs.', bold: true, fillColor: '#166964', color: '#fff', alignment: 'center', lineHeight: 1.5 }
                            ],
                            [
                                { text: 1, alignment: 'center' },
                                { text: lastDataArray && lastDataArray.date ? moment(lastDataArray.date).format("DD/MM/YYYY") : "-" || "N/A", alignment: 'center' },
                                { text: recordData ? recordData.description : "-" || "N/A", alignment: 'center' },
                                { text: patientData.records.length || "N/A", alignment: 'center' },
                                {
                                    text: recordData.payment != null
                                        ? `${Number(recordData.payment)}/-`
                                        : "0.00/-",
                                    alignment: 'right',
                                },
                                {
                                    text: recordData.payment != null
                                        ? `${Number(recordData.payment) * patientData.records.length}/-`
                                        : "0.00/-",
                                    alignment: 'right',
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 30, 0, 0]
                },
                {
                    text: [
                        { text: 'Payment received at Eraya Health Care for the given treatment. If you have any questions concerning this invoice contact Eraya Health Care' },
                    ],
                    margin: [0, 50, 0, 0]
                },
                {
                    text: [
                        { text: 'Thank you Eraya Health Care' },
                    ],
                    margin: [0, 20, 0, 0]
                },
                {
                    columns: [
                        {},
                        {
                            image: signDataUri,
                            width: 120,
                            margin: [20, 70, 0, 0]
                        },
                    ]
                },
                {
                    text: [
                        { text: 'Dr. Disha Shah' },
                    ],
                    fontSize: 14,
                    alignment: 'right',
                    margin: [0, 20, 0, 0]
                },
                {
                    columns: [
                        {},
                        {
                            image: stampDataUri,
                            width: 120,
                            margin: [20, 20, 0, 0]
                        },
                    ]
                },
            ],
            styles: {
                header: { fontSize: 14, margin: [0, 10, 0, 0] },
                header2: { fontSize: 14, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, alignment: 'right' },
                invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" }
            },
            footer: function () {
                return {
                    margin: [0, 0, 0, 0],
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                {
                                    text: '+91 84870 77767',
                                    fontSize: 10,
                                    margin: [10, 9],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'B/513, AWS-3, Manav Mandir Road Memnagar, Ahmedabad (Gujarat), 380052',
                                    fontSize: 10,
                                    margin: [10, 5],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'erayahealthcare@gmail.com',
                                    fontSize: 10,
                                    margin: [30, 9],
                                    color: '#ffffff'
                                },
                            ]
                        ]
                    },
                    layout: {
                        fillColor: function () {
                            return '#166964';
                        },
                        hLineWidth: function () {
                            return 0;
                        },
                        vLineWidth: function () {
                            return 0;
                        }
                    },
                    margin: [0, 0, 0, 0]
                };
            }


        };

        const fonts = {
            Roboto: {
                normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
                bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
                italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${patientData._id}.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.generatePrescription = async (req, res) => {
    try {
        const imagePath = path.resolve(__dirname, '../images/ErayaLogo.png');
        const signPath = path.resolve(__dirname, '../images/Disha Sign.png');
        const stampPath = path.resolve(__dirname, '../images/stamp.png');
        const lightStampPath = path.resolve(__dirname, '../images/LightStamp.png');

        let imageDataUri = null;
        let signDataUri = null;
        let stampDataUri = null;
        let lightStampDataUri = null;

        try {
            const imageBase64 = fs.readFileSync(imagePath).toString('base64');
            const signBase64 = fs.readFileSync(signPath).toString('base64');
            const stampBase64 = fs.readFileSync(stampPath).toString('base64');
            const lightStampBase64 = fs.readFileSync(lightStampPath).toString('base64');

            imageDataUri = `data:image/png;base64,${imageBase64}`;
            signDataUri = `data:image/png;base64,${signBase64}`;
            stampDataUri = `data:image/png;base64,${stampBase64}`;
            lightStampDataUri = `data:image/png;base64,${lightStampBase64}`;
        } catch (err) {
            console.error("Image load error:", err.message);
        }


        const { startDate, endDate, patient, doctor } = req.query;

        if (!patient || !startDate || !endDate || !doctor) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Parse dates
        let parsedStart = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
        let parsedEnd = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();

        // Aggregate patient form data
        const data = await PatientFormSchema.aggregate([
            {
                $match: {
                    "patient._id": new mongoose.Types.ObjectId(patient),
                    "doctor._id": new mongoose.Types.ObjectId(doctor),
                    date: { $gte: parsedStart, $lte: parsedEnd }
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    date: 1,
                    "patient.name": 1,
                    "doctor.name": 1,
                    description: 1,
                    payment: { $toDouble: "$payment" }
                }
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
                            payment: "$payment"
                        }
                    },
                    totalAmount: { $sum: "$payment" }
                }
            }
        ]);
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: "No data found for the given patient and date range." });
        }

        const patientData = data[0];

        const docDefinition = {
            content: [
                {
                    columns: [
                        {},
                        {
                            image: imageDataUri,
                            width: 150
                        },
                    ],
                    columnGap: 10,
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        {
                            width: 'auto',
                            text: [
                                { text: 'Patient Name', bold: true },
                                { text: ' :- ', bold: true }
                            ],
                            margin: [0, 0, 5, 0]
                        },
                        {
                            width: '*',
                            stack: [
                                { text: `${patientData._id || ''}`, margin: [0, 0, 0, 2] }, // Text above the line
                                {
                                    canvas: [
                                        {
                                            type: 'line',
                                            x1: 0, y1: 0,
                                            x2: 400, y2: 0,
                                            lineWidth: 0.5
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 20]
                },
                {
                    columns: [
                        {
                            width: 'auto',
                            text: [
                                { text: 'Gender', bold: true },
                                { text: ' :- ', bold: true }
                            ],
                            margin: [0, 0, 5, 0]
                        },
                        {
                            width: '*',
                            stack: [
                                { text: 'Male', margin: [50, 0, 0, 2] }, // Text above the line
                                {
                                    canvas: [
                                        {
                                            type: 'line',
                                            x1: 0, y1: 0,
                                            x2: 150, y2: 0,
                                            lineWidth: 0.5
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            width: 'auto',
                            text: [
                                { text: 'Date', bold: true },
                                { text: ' :- ', bold: true }
                            ],
                            margin: [0, 0, 5, 0]
                        },
                        {
                            width: '*',
                            stack: [
                                { text: moment().format("DD/MM/YYYY"), margin: [50, 0, 0, 2] }, // Text above the line
                                {
                                    canvas: [
                                        {
                                            type: 'line',
                                            x1: 0, y1: 0,
                                            x2: 150, y2: 0,
                                            lineWidth: 0.5
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    margin: [0, 0, 0, 20]
                },
                {
                    text: [
                        { text: 'Rx,' },
                    ],
                    fontSize: 16,
                    bold: true,
                    margin: [0, 20, 0, 0]
                },
                { image: lightStampDataUri, width: 250, margin: [0, 80, 0, 0], alignment: 'center' },
                {},
                {
                    alignment: 'right',
                    columns: [
                        {},
                        {},
                        {
                            text: [
                                { text: 'Consulting Doctor Name', bold: true },
                                { text: ' :- ', bold: true }
                            ],
                        },
                        {
                            stack: [
                                {
                                    text: 'Dr. Disha Shah',
                                    margin: [0, 0, 0, 2],
                                    alignment: 'center'
                                },
                                {
                                    canvas: [
                                        {
                                            type: 'line',
                                            x1: 0, y1: 0,
                                            x2: 150, y2: 0,
                                            lineWidth: 0.5
                                        }
                                    ],
                                    margin: [0, 0, 0, 0]
                                }
                            ]
                        }
                    ],
                    margin: [-60, 180, 0, 0]
                },
                {
                    alignment: 'right',
                    columns: [
                        {},
                        {},
                        {
                            text: [
                                { text: 'Signature', bold: true },
                                { text: ' :- ', bold: true }
                            ],
                        },
                        {
                            stack: [
                                {
                                    text: '',
                                    margin: [0, 0, 0, 2],
                                    alignment: 'center'
                                },
                                {
                                    canvas: [
                                        {
                                            type: 'line',
                                            x1: 0, y1: 15,
                                            x2: 150, y2: 15,
                                            lineWidth: 0.5
                                        }
                                    ],
                                    margin: [0, 0, 0, 0]
                                }
                            ]
                        }
                    ],
                    margin: [-60, 20, 0, 0]
                }
            ],
            styles: {
                header: { fontSize: 14, margin: [0, 10, 0, 0] },
                header2: { fontSize: 14, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 14, bold: true, alignment: 'right' },
                invoiceTitle: { fontSize: 25, bold: true, color: "#13756f" }
            },
            footer: function () {
                return {
                    margin: [0, 0, 0, 0],
                    table: {
                        widths: ['*', '*', '*'],
                        body: [
                            [
                                {
                                    text: '+91 84870 77767',
                                    fontSize: 10,
                                    margin: [10, 9],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'B/513, AWS-3, Manav Mandir Road Memnagar, Ahmedabad (Gujarat), 380052',
                                    fontSize: 10,
                                    margin: [10, 5],
                                    color: '#ffffff'
                                },
                                {
                                    text: 'erayahealthcare@gmail.com',
                                    fontSize: 10,
                                    margin: [30, 9],
                                    color: '#ffffff'
                                },
                            ]
                        ]
                    },
                    layout: {
                        fillColor: function () {
                            return '#166964';
                        },
                        hLineWidth: function () {
                            return 0;
                        },
                        vLineWidth: function () {
                            return 0;
                        }
                    },
                    margin: [0, 0, 0, 0]
                };
            }


        };

        const fonts = {
            Roboto: {
                normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
                bold: path.join(__dirname, '../fonts/Roboto-Medium.ttf'),
                italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
                bolditalics: path.join(__dirname, '../fonts/Roboto-MediumItalic.ttf')
            }
        };

        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${patientData._id}.pdf`);

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
            return res.status(400).json({ success: false, message: "Patient ID is required." });
        }

        const { name, age, phone, address } = req.body;

        let patient = {
            name: name,
            age: age,
            phone: phone,
            address: address
        }

        const patientData = await PatientFormSchema.findByIdAndUpdate(id, { ...req.body, patient }, { new: true });

        return res.status(200).json({
            success: true,
            message: "Assessment Added Successfully",
            data: patientData,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}