const express = require("express");
const { addPatientForm, getPatientsForm, updatePatientForm, deletePatientForm, generateReport, generateCertificate, generateReceipt, generatePrescription, getPatientsFormById, assessmentForm, generateAssessment } = require("../controller/patientForm");
const router = express.Router();

router.post("/addpatientform", addPatientForm);
router.get("/getpatientsform", getPatientsForm);
router.put("/updatepatientform/:id", updatePatientForm);
router.delete("/deletepatientform/:id", deletePatientForm);
router.get("/generatereport", generateReport);
router.get("/generatecertificate", generateCertificate);
router.get("/generatereceipt", generateReceipt);
router.get("/generateprescription", generatePrescription);
router.get("/getpatientsformbyid/:id", getPatientsFormById);
router.post("/assessmentform/:id", assessmentForm);
router.get("/generateassessment", generateAssessment);

module.exports = router;