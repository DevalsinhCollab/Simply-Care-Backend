const DoctorUnavailability = require("../models/DoctorUnavailability");
const Doctor = require("../models/doctor");
const mongoose = require("mongoose");

// ===========================
// CREATE UNAVAILABILITY RECORD
// ===========================
exports.createUnavailability = async (req, res) => {
  try {
    const { doctorId, fullDayDates, customSlots, weeklyOff } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check if unavailability record already exists
    let unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (unavailability) {
      // Update existing record
      if (fullDayDates) {
        unavailability.fullDayDates = [
          ...new Map(
            [
              ...unavailability.fullDayDates,
              ...fullDayDates,
            ].map((item) => [item.date, item])
          ).values(),
        ];
      }
      if (customSlots) {
        unavailability.customSlots = [
          ...new Map(
            [
              ...unavailability.customSlots,
              ...customSlots,
            ].map((item) => [item.date, item])
          ).values(),
        ];
      }
      if (weeklyOff) {
        unavailability.weeklyOff = [
          ...new Set([...unavailability.weeklyOff, ...weeklyOff]),
        ];
      }

      unavailability = await unavailability.save();

      return res.status(200).json({
        success: true,
        message: "Unavailability updated successfully",
        data: unavailability,
      });
    }

    // Create new unavailability record
    const newUnavailability = await DoctorUnavailability.create({
      doctorId,
      fullDayDates: fullDayDates || [],
      customSlots: customSlots || [],
      weeklyOff: weeklyOff || [],
    });

    return res.status(201).json({
      success: true,
      message: "Unavailability created successfully",
      data: newUnavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// GET UNAVAILABILITY BY DOCTOR ID
// ===========================
// exports.getUnavailabilityByDoctorAndDate = async (req, res) => {
//   try {
//     const { doctorId, date } = req.query;

//     if (!doctorId) {
//       return res.status(400).json({
//         success: false,
//         message: "Doctor ID is required",
//       });
//     }

//     let filters = { doctorId };

//     const unavailability = await DoctorUnavailability.find(filters)
//       .populate("doctorId", "name email phone docSpeciality");

//     if (!date) {
//       return res.status(200).json({ success: true, data: unavailability });
//     }

//     // Format date
//     const selectedDate = new Date(date).setHours(0, 0, 0, 0);

//     // Filter matching date
//     const filtered = unavailability.filter(item => {
//       const hasFullDay = item.fullDayDates.some(fd =>
//         new Date(fd.date).setHours(0, 0, 0, 0) === selectedDate
//       );

//       const hasCustomSlot = item.customSlots.some(cs =>
//         new Date(cs.date).setHours(0, 0, 0, 0) === selectedDate
//       );

//       return hasFullDay || hasCustomSlot;
//     });

//     return res.status(200).json({
//       success: true,
//       data: filtered,
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
exports.getUnavailabilityByDoctorAndDate = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    // Extract YYYY-MM-DD from any date input
    let targetDate;
    if (date) {
      const parsed = new Date(date);
      if (isNaN(parsed)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format",
        });
      }
      targetDate = parsed.toISOString().slice(0, 10); // "2025-12-04"
    }

    const doctorUnavail = await DoctorUnavailability.findOne({ doctorId })
      .populate("doctorId", "name email phone docSpeciality")
      .lean();

    if (!doctorUnavail) {
      return res.status(200).json({ success: true, data: null });
    }

    if (!targetDate) {
      // Return full record if no date specified
      return res.status(200).json({ success: true, data: doctorUnavail });
    }

    const matchingFullDay = doctorUnavail.fullDayDates?.find(
      (fd) => fd.date === targetDate
    );

    const matchingCustom = doctorUnavail.customSlots?.find(
      (cs) => cs.date === targetDate
    );

    const result = {
      _id: doctorUnavail._id,
      doctorId: doctorUnavail.doctorId,
      weeklyOff: doctorUnavail.weeklyOff || [],
      fullDayDates: matchingFullDay ? [matchingFullDay] : [],
      customSlots: matchingCustom ? matchingCustom.slots : [],
    };

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// exports.getUnavailabilityByDoctorAndDate = async (req, res) => {
//   try {
//     const { doctorId, date } = req.query;

//     if (!doctorId) {
//       return res.status(400).json({
//         success: false,
//         message: "Doctor ID is required",
//       });
//     }

//     // 👉 If no date is provided, return all unavailability of doctor
//     if (!date) {
//       const allData = await DoctorUnavailability.find({ doctorId })
//         .populate("doctorId", "name email phone docSpeciality");

//       return res.status(200).json({ success: true, data: allData });
//     }

//     // 👉 Calculate start & end of selected day
//     let start = new Date(date);
//     start.setHours(0, 0, 0, 0);

//     let end = new Date(date);
//     end.setHours(23, 59, 59, 999);

//     // 👉 Query DB for records matching the exact day
//     const filteredData = await DoctorUnavailability.find({
//       doctorId,
//       $or: [
//         { "fullDayDates.date": { $gte: start, $lte: end } },
//         { "customSlots.date": { $gte: start, $lte: end } },
//       ],
//     }).populate("doctorId", "name email phone docSpeciality");

//     return res.status(200).json({
//       success: true,
//       data: filteredData,
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// ===========================
// ADD FULL DAY UNAVAILABILITY
// ===========================
exports.addFullDayUnavailability = async (req, res) => {
  try {
    const { doctorId, date, reason } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and date are required",
      });
    }

    let unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      unavailability = await DoctorUnavailability.create({
        doctorId,
        fullDayDates: [{ date: new Date(date), reason: reason || "" }],
      });
    } else {
      // Check if date already exists
      const dateExists = unavailability.fullDayDates.some(
        (item) => new Date(item.date).toDateString() === new Date(date).toDateString()
      );

      if (!dateExists) {
        unavailability.fullDayDates.push({
          date: new Date(date),
          reason: reason || "",
        });
        unavailability = await unavailability.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Full day unavailability added successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// ADD CUSTOM SLOT UNAVAILABILITY
// ===========================
exports.addCustomSlotUnavailability = async (req, res) => {
  try {
    const { doctorId, date, slots } = req.body;

    if (!doctorId || !date || !slots || !Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID, date, and slots array are required",
      });
    }

    let unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      unavailability = await DoctorUnavailability.create({
        doctorId,
        customSlots: [{ date: new Date(date), slots }],
      });
    } else {
      // Check if date already exists in customSlots
      const existingSlotIndex = unavailability.customSlots.findIndex(
        (item) => new Date(item.date).toDateString() === new Date(date).toDateString()
      );

      if (existingSlotIndex !== -1) {
        // Merge slots
        const existingSlots = unavailability.customSlots[existingSlotIndex].slots;
        const mergedSlots = [
          ...new Map(
            [...existingSlots, ...slots].map((slot) => [
              `${slot.startTime}-${slot.endTime}`,
              slot,
            ])
          ).values(),
        ];
        unavailability.customSlots[existingSlotIndex].slots = mergedSlots;
      } else {
        unavailability.customSlots.push({ date: new Date(date), slots });
      }

      unavailability = await unavailability.save();
    }

    return res.status(200).json({
      success: true,
      message: "Custom slot unavailability added successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// ADD WEEKLY OFF
// ===========================
exports.addWeeklyOff = async (req, res) => {
  try {
    const { doctorId, weeklyOff } = req.body;

    if (!doctorId || !Array.isArray(weeklyOff)) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and weeklyOff array are required",
      });
    }

    // Validate days
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const isValid = weeklyOff.every((day) => validDays.includes(day));

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid day in weeklyOff. Must be valid weekday names",
      });
    }

    let unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      unavailability = await DoctorUnavailability.create({
        doctorId,
        weeklyOff,
      });
    } else {
      // Merge with existing weeklyOff
      unavailability.weeklyOff = [
        ...new Set([...unavailability.weeklyOff, ...weeklyOff]),
      ];
      unavailability = await unavailability.save();
    }

    return res.status(200).json({
      success: true,
      message: "Weekly off added successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// REMOVE FULL DAY UNAVAILABILITY
// ===========================
exports.removeFullDayUnavailability = async (req, res) => {
  try {
    const { doctorId, date } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and date are required",
      });
    }

    const unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      return res.status(404).json({
        success: false,
        message: "Unavailability record not found",
      });
    }

    unavailability.fullDayDates = unavailability.fullDayDates.filter(
      (item) => new Date(item.date).toDateString() !== new Date(date).toDateString()
    );

    await unavailability.save();

    return res.status(200).json({
      success: true,
      message: "Full day unavailability removed successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// REMOVE CUSTOM SLOT UNAVAILABILITY
// ===========================
exports.removeCustomSlotUnavailability = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and date are required",
      });
    }

    const unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      return res.status(404).json({
        success: false,
        message: "Unavailability record not found",
      });
    }

    const slotIndex = unavailability.customSlots.findIndex(
      (item) => new Date(item.date).toDateString() === new Date(date).toDateString()
    );

    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "No custom slots found for this date",
      });
    }

    if (startTime && endTime) {
      // Remove specific slot
      unavailability.customSlots[slotIndex].slots = unavailability.customSlots[
        slotIndex
      ].slots.filter(
        (slot) => !(slot.startTime === startTime && slot.endTime === endTime)
      );

      // If no slots left, remove the date entry
      if (unavailability.customSlots[slotIndex].slots.length === 0) {
        unavailability.customSlots.splice(slotIndex, 1);
      }
    } else {
      // Remove all slots for this date
      unavailability.customSlots.splice(slotIndex, 1);
    }

    await unavailability.save();

    return res.status(200).json({
      success: true,
      message: "Custom slot unavailability removed successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// REMOVE WEEKLY OFF
// ===========================
exports.removeWeeklyOff = async (req, res) => {
  try {
    const { doctorId, day } = req.body;

    if (!doctorId || !day) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and day are required",
      });
    }

    const unavailability = await DoctorUnavailability.findOne({ doctorId });

    if (!unavailability) {
      return res.status(404).json({
        success: false,
        message: "Unavailability record not found",
      });
    }

    unavailability.weeklyOff = unavailability.weeklyOff.filter(
      (d) => d !== day
    );

    await unavailability.save();

    return res.status(200).json({
      success: true,
      message: "Weekly off removed successfully",
      data: unavailability,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===========================
// DELETE ALL UNAVAILABILITY FOR DOCTOR
// ===========================
exports.deleteUnavailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
      });
    }

    const result = await DoctorUnavailability.deleteOne({ doctorId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Unavailability record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Unavailability deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
