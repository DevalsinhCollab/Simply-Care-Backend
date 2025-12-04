// const express = require("express");
// const {
//   addAppointment,
//   getAllAppointmentsByDoc,
//   updateAppointment,
//   deleteAppointment,
//   getAppointmentByPatient,
//   getAppointmentByDoctor,
// } = require("../controller/appointment");

// const router = express.Router();

// router.post("/addappointment", (req, res) => {
//   req.io = req.app.get("socketio");
//   addAppointment(req, res);
// });
// router.post("/getallappointmentsbydoc/:did", getAllAppointmentsByDoc);
// router.post("/updateappointment/:id", (req, res) => {
//   req.io = req.app.get("socketio");
//   updateAppointment(req, res);
// });
// router.delete("/deleteappointment/:id", deleteAppointment);
// router.post("/getappointmentbypatient/:pid", getAppointmentByPatient);
// router.post("/getappointmentbydoctor/:did", getAppointmentByDoctor);

// module.exports = router;

const express = require("express");
const { createAppointment, getAllAppointments, getAppointmentById, updateAppointment, deleteAppointment, generateReport, generateCertificate, generateReceipt, generatePrescription, getAppointmentsByPatient, getAvailableSlots, createAppointmentWithSlot, getAppointmentsWithTime, updateAppointmentStatus } = require("../controller/appointment");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

// Create appointment
router.post("/createAppointment", verifyToken,  createAppointment);

// Get all appointments
router.get("/getAllAppointments",verifyToken, getAllAppointments);

// Get appointment by ID
router.get("/getAppointmentById/:id", getAppointmentById);

// Update appointment
router.put("/updateAppointment/:id",verifyToken, updateAppointment);

// Delete appointment
router.put("/deleteAppointment/:id", deleteAppointment);

// Get appointments by patient
router.get("/getAppointmentsByPatient", getAppointmentsByPatient);

// Get available slots for a doctor
router.get("/getAvailableSlots", getAvailableSlots);
// Get appointments with both startTime and endTime set
router.get("/getAppointmentsWithTime" ,verifyToken, getAppointmentsWithTime);

// Update appointment status (approve/reject)
router.put("/updateAppointmentStatus/:id", updateAppointmentStatus);

// Create appointment with slot
router.post("/createAppointmentWithSlot", createAppointmentWithSlot);

// Generate report
router.get("/generatereport", generateReport);

// Generate certificate
router.get("/generatecertificate", generateCertificate);

// Generate receipt
router.get("/generatereceipt", generateReceipt);

// Generate prescription
router.get("/generateprescription", generatePrescription);

module.exports = router;