const express = require("express");
const { addPatient, getPatients, updatePatient, deletePatient, searchPatients, getPatientByPhone } = require("../controller/patient");
const verifyToken = require("../middleware/verifyToken");


const router = express.Router();

router.post("/addpatient", addPatient);
router.get("/getpatients",verifyToken, getPatients);
router.put("/updatepatient/:id", updatePatient);
router.delete("/deletepatient/:id", deletePatient);
router.get("/searchpatients",verifyToken, searchPatients);
router.get("/getpatientbyphone", getPatientByPhone);

module.exports = router;
