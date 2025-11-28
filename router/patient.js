const express = require("express");
const { addPatient, getPatients, updatePatient, deletePatient, searchPatients, getPatientByPhone } = require("../controller/patient");


const router = express.Router();

router.post("/addpatient", addPatient);
router.get("/getpatients", getPatients);
router.put("/updatepatient/:id", updatePatient);
router.delete("/deletepatient/:id", deletePatient);
router.get("/searchpatients", searchPatients);
router.get("/getpatientbyphone", getPatientByPhone);

module.exports = router;
