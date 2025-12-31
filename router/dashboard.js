const express = require("express");
const { dashboardCount, getRemainingPatients, getReceivedByPatient, getFilteredDashboardStats, exportRemainingExcel, exportReceivedExcel } = require("../controller/dashboard");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/dashboardcount",verifyToken, dashboardCount);
router.get("/remainingPatients",verifyToken, getRemainingPatients);
router.get("/receivedByPatient",verifyToken, getReceivedByPatient);
router.get("/getFilteredStats", getFilteredDashboardStats);
router.get("/exportRemaining", exportRemainingExcel);
router.get("/exportReceived", exportReceivedExcel);

module.exports = router;