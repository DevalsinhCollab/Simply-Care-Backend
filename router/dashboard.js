const express = require("express");
const { dashboardCount, getRemainingPatients, getReceivedByPatient, getFilteredDashboardStats, exportRemainingExcel, exportReceivedExcel } = require("../controller/dashboard");

const router = express.Router();

router.get("/dashboardcount", dashboardCount);
router.get("/remainingPatients", getRemainingPatients);
router.get("/receivedByPatient", getReceivedByPatient);
router.get("/getFilteredStats", getFilteredDashboardStats);
router.get("/exportRemaining", exportRemainingExcel);
router.get("/exportReceived", exportReceivedExcel);

module.exports = router;