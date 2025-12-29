const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      default: null,
    },
    gender: {
      type: String,
      trim: true,
      enum: ["Male", "Female", "Other" , ""],
    },
    age: {
      type: String,
      default: null,
    },
    occupation: {
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
    area: {
      type: String,
      trim: true,
      default: null,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clinic",
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

module.exports = mongoose.model("patient", patientSchema);
