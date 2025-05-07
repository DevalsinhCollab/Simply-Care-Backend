const express = require("express");
const { addPatient, getPatients, updatePatient, deletePatient, searchPatients } = require("../controller/patient");


const router = express.Router();

router.post("/addpatient", addPatient);
router.get("/getpatients", getPatients);
router.put("/updatepatient/:id", updatePatient);
router.delete("/deletepatient/:id", deletePatient);
router.get("/searchpatients", searchPatients);

module.exports = router;
