const express = require("express");
const {
  addAppointment,
  getAllAppointmentsByDoc,
  updateAppointment,
  deleteAppointment,
  getAppointmentByPatient,
  getAppointmentByDoctor,
} = require("../controller/appointment");

const router = express.Router();

router.post("/addappointment", (req, res) => {
  req.io = req.app.get("socketio");
  addAppointment(req, res);
});
router.post("/getallappointmentsbydoc/:did", getAllAppointmentsByDoc);
router.post("/updateappointment/:id", (req, res) => {
  req.io = req.app.get("socketio");
  updateAppointment(req, res);
});
router.delete("/deleteappointment/:id", deleteAppointment);
router.post("/getappointmentbypatient/:pid", getAppointmentByPatient);
router.post("/getappointmentbydoctor/:did", getAppointmentByDoctor);

module.exports = router;
