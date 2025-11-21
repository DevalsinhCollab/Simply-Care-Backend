const mongoose = require("mongoose");
const doctorSpecialitySchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
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

module.exports = mongoose.model("doctorSpeciality", doctorSpecialitySchema);