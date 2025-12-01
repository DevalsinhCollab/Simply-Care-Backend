const express = require("express");
const {
  addDoctor,
  getDoctors,
  updateDoctor,
  deleteDoctor,
  searchDoctors,
} = require("../controller/doctor");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post("/adddoctor", addDoctor);
router.get("/getdoctors", getDoctors);
router.put("/updatedoctor/:id", updateDoctor);
router.put("/deletedoctor/:id", deleteDoctor);
router.get("/searchdoctors", verifyToken, searchDoctors);

module.exports = router;
