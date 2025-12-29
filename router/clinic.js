const express = require('express');
const {
  createClinic,
  getAllClinics,
  getClinicById,
  updateClinic,
  deleteClinic,
} = require('../controller/clinic');

const router = express.Router();

router.post('/createClinic', createClinic);
router.get('/getAllClinics', getAllClinics);
router.get('/getClinicById/:id', getClinicById);
router.put('/updateClinic/:id', updateClinic);
router.put('/deleteClinic/:id', deleteClinic);

module.exports = router;
