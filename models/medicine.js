const mongoose = require("mongoose");

const medicineSchema = mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clinic",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
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

module.exports = mongoose.model("medicine", medicineSchema);
