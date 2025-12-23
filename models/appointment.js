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

const sessionSchema = new mongoose.Schema(
  {
    sessionNo: {
      type: Number,
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    treatment: {
      type: String,
      required: true,
    },

    sessionDesc: {
      type: String,
      default: "",
    },

    sessionDate: {
      type: Date,
      required: false,
    },

    payment: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "bank", "upi"],
      default: "cash",
    },
   
    paymentLogs: [
      {
        paidAmount: Number,
        receiveBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

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

    sessions: [sessionSchema],

    appointmentDate: {
      type: Date,
      required: false,
    },

    startTime: {
      type: String,
      required: false,
    },

    endTime: {
      type: String,
      required: false,
    },

    docApproval: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

// const appointmentSchema = new mongoose.Schema(
//   {
//     doctorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "doctor",
//       required: true,
//     },

//     patientId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "patient",
//       required: true,
//     },
//     patientFormId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "PatientForm",
//       required: false,
//     },

//     sessions: [sessionSchema],

//     // treatment: {
//     //   type: String,
//     //   // required: true,
//     // },

//     // description: {
//     //   type: String,
//     //   default: "",
//     // },

//     // date: {
//     //   type: Date,
//     //   default: Date.now,
//     // },

//     appointmentDate: {
//       type: Date,
//       required: false,
//     },

//     startTime: {
//       type: String,
//       required: false,
//     },

//     endTime: {
//       type: String,
//       required: false,
//     },

//     // visitStatus: {
//     //   type: Boolean,
//     //   default: false,
//     // },
//     docApproval: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },
//     // payment: {
//     //   type: Number,
//     //   required: false,
//     //   default: 0,
//     // },
//     // paymentMode: {
//     //   type: String,
//     //   enum: ["cash", "bank" , "upi"],
//     //   default: "cash",
//     // },
//     // paidAmount: {
//     //   type: Number,
//     //   default: 0,
//     // },
//     // remainingAmount: {
//     //   type: Number,
//     //   default: 0,
//     // },
//     // paymentLog: [
//     //   {
//     //     paidAmount: {
//     //       type: Number,
//     //     },
//     //     receiveBy: {
//     //       type: mongoose.Schema.Types.ObjectId,
//     //       ref: "user",
//     //     },
//     //     paymentDate: {
//     //       type: String,
//     //     },
//     //   },
//     // ],

//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("appointment", appointmentSchema);
