const express = require("express");
const {
  createUnavailability,
  addFullDayUnavailability,
  addCustomSlotUnavailability,
  addWeeklyOff,
  removeFullDayUnavailability,
  removeCustomSlotUnavailability,
  removeWeeklyOff,
  deleteUnavailability,
  getUnavailabilityByDoctorAndDate,
} = require("../controller/doctorUnavailability");

const router = express.Router();

// Create or get unavailability
router.post("/create", createUnavailability);

// Get unavailability by doctor ID
router.get("/getByDoctor", getUnavailabilityByDoctorAndDate);

// Add full day unavailability
router.post("/addFullDay", addFullDayUnavailability);

// Add custom slot unavailability
router.post("/addCustomSlot", addCustomSlotUnavailability);

// Add weekly off
router.post("/addWeeklyOff", addWeeklyOff);

// Remove full day unavailability
router.put("/removeFullDay", removeFullDayUnavailability);

// Remove custom slot unavailability
router.put("/removeCustomSlot", removeCustomSlotUnavailability);

// Remove weekly off
router.put("/removeWeeklyOff", removeWeeklyOff);

// Delete all unavailability for doctor
router.delete("/delete/:doctorId", deleteUnavailability);

module.exports = router;
