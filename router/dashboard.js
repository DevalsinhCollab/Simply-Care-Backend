const express = require("express");
const { dashboardCount, getRemainingPatients, getReceivedByPatient, getFilteredDashboardStats } = require("../controller/dashboard");

const router = express.Router();

router.get("/dashboardcount", dashboardCount);
router.get("/remainingPatients", getRemainingPatients);
router.get("/receivedByPatient", getReceivedByPatient);
router.get("/getFilteredStats", getFilteredDashboardStats);

module.exports = router;