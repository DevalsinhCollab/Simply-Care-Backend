const express = require("express");
const { dashboardCount, getRemainingPatients, getReceivedByPatient } = require("../controller/dashboard");

const router = express.Router();

router.get("/dashboardcount", dashboardCount);
router.get("/remainingPatients", getRemainingPatients);
router.get("/receivedByPatient", getReceivedByPatient);

module.exports = router;