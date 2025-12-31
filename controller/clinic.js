const Clinic = require('../models/clinic');

/**
 * GET ALL CLINICS
 */
exports.getAllClinics = async (req, res) => {
  try {
    const { clinicId } = req.query;
  const loggedUserClinicId = req.user.clinicId;

  console.log(loggedUserClinicId, "loggedUserClinicId");

    const filter = { isDeleted: false };
    if (clinicId) filter._id = clinicId;
    if( loggedUserClinicId ){
      filter._id = loggedUserClinicId;
    }

    const clinics = await Clinic.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Clinics retrieved successfully',
      data: clinics,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * GET CLINIC BY ID
 */
exports.getClinicById = async (req, res) => {
  try {
    const clinicId = req.params.id;

    const clinic = await Clinic.findOne({ _id: clinicId, isDeleted: false });

    if (!clinic) {
      return res.status(404).json({ message: 'No Clinic found' });
    }

    return res.status(200).json({
      message: 'Clinic retrieved successfully',
      data: clinic,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * CREATE CLINIC
 */
exports.createClinic = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Clinic name is required' });
    }

    const existing = await Clinic.findOne({ name: name.trim(), isDeleted: false });
    if (existing) {
      return res.status(409).json({ message: 'Clinic already exists' });
    }

    const clinic = await Clinic.create({ name, email, phone, address });

    return res.status(200).json({ message: 'Clinic created successfully', data: clinic });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * UPDATE CLINIC
 */
exports.updateClinic = async (req, res) => {
  try {
    const clinicId = req.params.id;
    const data = req.body;

    const clinic = await Clinic.findOneAndUpdate({ _id: clinicId, isDeleted: false }, data, {
      new: true,
    });

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not updated' });
    }

    return res.status(200).json({ message: 'Clinic updated successfully', data: clinic });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * DELETE CLINIC (SOFT DELETE)
 */
exports.deleteClinic = async (req, res) => {
  try {
    const clinicId = req.params.id;

    const clinic = await Clinic.findOneAndUpdate(
      { _id: clinicId, isDeleted: false },
      { isDeleted: true },
      { new: true },
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not deleted' });
    }

    return res.status(200).json({ message: 'Clinic deleted successfully', data: clinic });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
