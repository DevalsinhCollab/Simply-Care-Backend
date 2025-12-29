const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
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
    otp: {
      type: String,
      trim: true,
      default: null,
    },
    isDelete: {
      type: String,
      enum: [1, 0],
      default: 0,
    },
    keepMeLoggedIn: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["A", "U", "D" , "SA"],
      default: "U",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      default: null,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clinic",
      default: null,
    },
    // docSpeciality: {
    //   type: String,
    //   enum: ["PH", "NE"],
    // },
    // docSpeciality: {
    //   type: String,
    //   enum: ["Physiotherapy", "Counseller","Physician"],
    // },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
