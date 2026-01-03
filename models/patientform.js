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
        pincode: {
            type: String,
            trim: true,
            default: null,
        },
        city: {
            type: String,
            trim: true,
            default: null,
        },
        state: {
            type: String,
            trim: true,
            default: null,
        },
        occupation: {
            type: String,
            trim: true,
            default: null,
        },
        area: {
            type: String,
            trim: true,
            default: null,
        },
        gender: {
            type: String,
            default: null,
        },
    },
    { _id: false }
);

const prescriptionSubSchema = new mongoose.Schema(
    {
        medicine: {
            _id: { type: mongoose.Schema.Types.ObjectId },
            name: { type: String, trim: true, default: null },
        },
        medicineId: { type: mongoose.Schema.Types.ObjectId, default: null },
        name: { type: String, trim: true, default: null },
        dosage: { type: String, trim: true, default: null },
        frequency: { type: String, trim: true, default: null },
        instruction: { type: String, trim: true, default: null },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const patientFormSchema = new mongoose.Schema(
    {
        // Common root fields for all form types
        formType: {
            type: String,
            enum: ["PHYSIO", "DENTAL", "ESTHETIC"],
            required: true,
            default: "PHYSIO",
        },
        formData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        numOfSessions: {
            type: Number,
            default: 0,
        },
        doctor: {
            type: doctorSchema,
            default: null,
        },
        patient: {
            type: patientSchema,
            default: null,
        },
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "clinic",
        },
        payment: {
            type: String,
            trim: true,
            default: null,
        },
        paymentType: {
            type: String,
            trim: true,
            default: null,
        },
        paymentOption: {
            type: String,
            trim: true,
            default: null,
        },
        prescribeMedicine: {
            type: String,
            trim: true,
            default: null,
        },
        prescriptions: {
            type: [prescriptionSubSchema],
            default: [],
        },
        referenceDoctor: {
            type: doctorSchema,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PatientForm", patientFormSchema);