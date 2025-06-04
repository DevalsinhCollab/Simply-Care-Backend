const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { _id: false }
);

const patientSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
        },
        name: {
            type: String,
            trim: true,
            default: null,
        },
        age: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            trim: true,
            default: null,
        },
        address: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { _id: false }
);

const patientFormSchema = new mongoose.Schema(
    {
        doctor: {
            type: doctorSchema,
            default: null,
        },
        patient: {
            type: patientSchema,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        description: {
            type: String,
            trim: true,
            default: null,
        },
        payment: {
            type: String,
            trim: true,
        },
        treatment: {
            type: String,
            trim: true,
            default: null,
        },
        flex: {
            type: String,
            trim: true,
            default: null,
        },
        abd: {
            type: String,
            trim: true,
            default: null,
        },
        spasm: {
            type: String,
            trim: true,
            default: null,
        },
        stiffness: {
            type: String,
            trim: true,
            default: null,
        },
        tenderness: {
            type: String,
            trim: true,
            default: null,
        },
        effusion: {
            type: String,
            trim: true,
            default: null,
        },
        mmt: {
            type: String,
            trim: true,
            default: null,
        },
        cc: {
            type: String,
            trim: true,
            default: null,
        },
        history: {
            type: String,
            trim: true,
            default: null,
        },
        examinationComment: {
            type: String,
            trim: true,
            default: null,
        },
        nrs: {
            type: String,
            trim: true,
            default: null,
        },
        dosage1: {
            type: String,
            trim: true,
            default: null,
        },
        dosage2: {
            type: String,
            trim: true,
            default: null,
        },
        dosage3: {
            type: String,
            trim: true,
            default: null,
        },
        dosage4: {
            type: String,
            trim: true,
            default: null,
        },
        dosage5: {
            type: String,
            trim: true,
            default: null,
        },
        dosage6: {
            type: String,
            trim: true,
            default: null,
        },
        description: {
            type: String,
            trim: true,
            default: null,
        },
        dosage5: {
            type: String,
            trim: true,
            default: null,
        },
        joint: {
            type: String,
            trim: true,
            default: null,
        },
        treatment: {
            type: String,
            trim: true,
            default: null,
        },
        assessBy: {
            type: String,
            trim: true,
            default: null,
        },
        dosage5: {
            type: String,
            trim: true,
            default: null,
        },
        referenceDoctor: {
            type: doctorSchema,
            default: null,
        },
        paymentType: {
            type: String,
            trim: true,
            default: null,
        },
        prescribeMedicine: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PatientForm", patientFormSchema);