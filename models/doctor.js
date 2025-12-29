const mongoose = require("mongoose");

const doctorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clinic",
    },
    // docSpeciality: {
    //   type: String,
    // },
    docSpeciality: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctorSpeciality",
    },
    joiningDate: {
      type: String,
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

module.exports = mongoose.model("doctor", doctorSchema);
