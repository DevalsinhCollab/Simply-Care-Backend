const express = require("express");
const { addPatientForm, getPatientsForm, updatePatientForm, deletePatientForm, generateReport } = require("../controller/patientForm");
const router = express.Router();

router.post("/addpatientform", addPatientForm);
router.get("/getpatientsform", getPatientsForm);
router.put("/updatepatientform/:id", updatePatientForm);
router.delete("/deletepatientform/:id", deletePatientForm);
router.get("/generatereport", generateReport);

module.exports = router;