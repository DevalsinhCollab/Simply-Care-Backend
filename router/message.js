const express = require("express");
const {
  getChat,
  getPatientsByDoctorId,
  markAsReadMsg,
  getUnreadMsgs,
  getUnreadMsgsCount,
} = require("../controller/message");
const router = express.Router();

router.post("/getchat", getChat);
router.get("/getpatientsbyDoctorid/:doctorId", getPatientsByDoctorId);
router.post("/markasreadmsg/:id", markAsReadMsg);
router.get("/getunreadmsgs/:id", getUnreadMsgs);
router.get("/getunreadmsgscount/:id", getUnreadMsgsCount);

module.exports = router;
