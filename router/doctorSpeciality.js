const express = require("express");
const { createSpeciality, getSpecialities, getSpecialityById, updateSpeciality, deleteSpeciality } = require("../controller/doctorSpeciality");
const router = express.Router();
 

// CREATE
router.post("/createSpeciality", createSpeciality);

// GET ALL
router.get("/getAllDocSpecialities", getSpecialities);

// GET BY ID
router.get("/getSpecialityById/:id", getSpecialityById);

// UPDATE
router.put("/updateSpeciality/:id", updateSpeciality);

// DELETE (soft delete)
router.put("/deleteSpeciality/:id", deleteSpeciality);

module.exports = router;
