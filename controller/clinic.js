const Clinic = require('../models/clinic');
const User = require('../models/user');

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

    try {
      // create admin user for this clinic
      const userPayload = {
        name: name,
        email: email,
        phone: phone,
        role: 'A',
        clinicId: clinic._id,
      };

      // if a user with same email and role A exists, update it; otherwise create
      if (userPayload.email) {
        await User.updateOne({ email: userPayload.email, role: 'A' }, userPayload, { upsert: true });
      } else {
        await User.create(userPayload);
      }
    } catch (uErr) {
      console.error('Failed to create admin user for clinic:', uErr.message);
    }

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

    try {
      // update admin user associated with this clinic (if any)
      const userUpdate = {};
      if (data.name) userUpdate.name = data.name;
      if (data.email) userUpdate.email = data.email;
      if (data.phone) userUpdate.phone = data.phone;
      if (Object.keys(userUpdate).length > 0) {
        userUpdate.clinicId = clinic._id;
        await User.updateOne({ clinicId: clinicId, role: 'A' }, userUpdate);
      }
    } catch (uErr) {
      console.error('Failed to update admin user for clinic:', uErr.message);
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

    try {
      // mark admin user as deleted / remove clinic reference
      await User.updateOne({ clinicId: clinicId, role: 'A' }, { isDelete: 1, clinicId: null });
    } catch (uErr) {
      console.error('Failed to delete admin user for clinic:', uErr.message);
    }

    return res.status(200).json({ message: 'Clinic deleted successfully', data: clinic });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
