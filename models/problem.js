const mongoose = require("mongoose");

const problemSchema = mongoose.Schema(
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
    docSpeciality: {
      type: String,
      trim: true,
      default: null,
    },
    issue: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    isDelete: {
      type: String,
      enum: [1, 0],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("problem", problemSchema);
