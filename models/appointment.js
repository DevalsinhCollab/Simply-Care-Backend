const mongoose = require("mongoose");

const appointmentSchema = mongoose.Schema(
  {
    patientId: {
      type: String,
      trim: true,
      default: null,
    },
    docId: {
      type: String,
      trim: true,
      default: null,
    },
    prbData: {
      type: Object,
      default: null,
    },
    issue: {
      type: String,
      trim: true,
      default: null,
    },
    start: {
      type: String,
      trim: true,
      default: null,
    },
    end: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("appointment", appointmentSchema);
