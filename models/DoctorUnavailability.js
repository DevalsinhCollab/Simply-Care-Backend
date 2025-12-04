const mongoose = require("mongoose");

const unavailableSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // e.g. "14:00"
  endTime: { type: String, required: true },   // e.g. "18:00"
  reason: { type: String, default: "" },
});

const doctorUnavailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },

    // Full day off — stored as simple YYYY-MM-DD string (e.g. "2025-12-04")
    fullDayDates: [
      {
        date: { 
          type: String, 
          required: true 
        }, // "2025-12-04"
        reason: { type: String, default: "Doctor not available" },
      },
    ],

    // Custom unavailable time slots on specific dates
    customSlots: [
      {
        date: { 
          type: String, 
          required: true 
        }, // "2025-12-04"
        slots: [unavailableSlotSchema],
      },
    ],

  },
  {
    timestamps: true,
  }
);

// Optional: ensure one document per doctor
doctorUnavailabilitySchema.index({ doctorId: 1 }, { unique: true });

module.exports = mongoose.model("DoctorUnavailability", doctorUnavailabilitySchema);