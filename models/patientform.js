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
        email: {
            type: String,
            trim: true,
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("PatientForm", patientFormSchema);