const express = require("express");
const { createMedicine, getAllMedicines, getMedicineById, updateMedicine, deleteMedicine } = require("../controller/medicine");
const verifyToken = require("../middleware/verifyToken");
 


const router = express.Router();

router.post("/createMedicine", createMedicine);
router.get("/getAllMedicines",verifyToken, getAllMedicines);
router.get("/getMedicineById/:id", getMedicineById);
router.put("/updateMedicine/:id", updateMedicine);
router.put("/deleteMedicine/:id", deleteMedicine);


module.exports = router;
