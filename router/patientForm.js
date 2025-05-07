const express = require("express");
const { addPatientForm, getPatientsForm, updatePatientForm, deletePatientForm } = require("../controller/patientForm");
const router = express.Router();

router.post("/addpatientform", addPatientForm);
router.get("/getpatientsform", getPatientsForm);
router.put("/updatepatientform/:id", updatePatientForm);
router.delete("/deletepatientform/:id", deletePatientForm);

module.exports = router;