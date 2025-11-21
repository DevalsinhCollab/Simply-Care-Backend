// const mongoose = require("mongoose");

// const appointmentSchema = mongoose.Schema(
//   {
//     patientId: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//     docId: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//     prbData: {
//       type: Object,
//       default: null,
//     },
//     issue: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//     start: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//     end: {
//       type: String,
//       trim: true,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("appointment", appointmentSchema);

const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    patientFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientForm",
      required: false,
    },

    treatment: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    payment: {
      type: Number,
      required: false,
      default: 0,
    },
    visitStatus: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("appointment", appointmentSchema);
