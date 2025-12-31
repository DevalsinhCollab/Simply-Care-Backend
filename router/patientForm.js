const express = require("express");
const { addPatientForm, getPatientsForm, updatePatientForm, deletePatientForm, generateReport, generateCertificate, generateReceipt, generatePrescription, getPatientsFormById, assessmentForm, generateAssessment } = require("../controller/patientForm");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

router.post("/addpatientform", addPatientForm);
router.get("/getpatientsform", verifyToken ,getPatientsForm);
router.put("/updatepatientform/:id", updatePatientForm);
router.put("/deletepatientform/:id", deletePatientForm);
router.get("/generatereport", generateReport);
router.get("/generatecertificate", generateCertificate);
router.get("/generatereceipt", generateReceipt);
router.get("/generateprescription", generatePrescription);
router.get("/getpatientsformbyid/:id", getPatientsFormById);
router.post("/assessmentform/:id", assessmentForm);
router.get("/generateassessment", generateAssessment);

module.exports = router;