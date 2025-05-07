const express = require("express");
const { dashboardCount } = require("../controller/dashboard");

const router = express.Router();

router.get("/dashboardcount", dashboardCount);

module.exports = router;