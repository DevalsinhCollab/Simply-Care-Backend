
const Medicine = require("../models/medicine");

/**
 * GET ALL MEDICINES
 */
exports.getAllMedicines = async (req, res) => {
  try {

    const loggedUserClinicId = req.user.clinicId;

    const findObject = { isDeleted: false };

    if (loggedUserClinicId) {
      findObject.clinicId = loggedUserClinicId;
    }

    const medicines = await Medicine.find(findObject).populate("clinicId").sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Medicines retrieved successfully",
      data: medicines,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * GET MEDICINE BY ID
 */
exports.getMedicineById = async (req, res) => {
  try {
    const medicineId = req.params.id;

    const medicine = await Medicine.findOne({
      _id: medicineId,
      isDeleted: false,
    });

    if (!medicine) {
      return res.status(404).json({ message: "No Medicine found" });
    }

    return res.status(200).json({
      message: "Medicine retrieved successfully",
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * CREATE MEDICINE
 */
exports.createMedicine = async (req, res) => {
  try {
    const { name } = req.body;
    // determine clinicId: prefer logged user's clinic, fall back to request body
    const clinicId = req.user && req.user.clinicId ? req.user.clinicId : req.body.clinicId;

    if (!name) {
      return res.status(400).json({ message: "Medicine name is required" });
    }

    const existingMedicine = await Medicine.findOne({
      name: name.trim(),
      isDeleted: false,
      clinicId,
    });

    if (existingMedicine) {
      return res.status(409).json({
        message: "Medicine already exists",
      });
    }

    const medicine = await Medicine.create({ name, clinicId });

    return res.status(200).json({
      message: "Medicine created successfully",
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * UPDATE MEDICINE
 */
exports.updateMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;
    const data = req.body;

    // ensure user can only update medicines for their clinic
    const loggedUserClinicId = req.user && req.user.clinicId;

    const filter = { _id: medicineId, isDeleted: false };
    if (loggedUserClinicId) filter.clinicId = loggedUserClinicId;

    const medicine = await Medicine.findOneAndUpdate(filter, data, { new: true });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not updated" });
    }

    return res.status(200).json({
      message: "Medicine updated successfully",
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * DELETE MEDICINE (SOFT DELETE)
 */
exports.deleteMedicine = async (req, res) => {
  try {
    const medicineId = req.params.id;

    const loggedUserClinicId = req.user && req.user.clinicId;
    const filter = { _id: medicineId, isDeleted: false };
    if (loggedUserClinicId) filter.clinicId = loggedUserClinicId;

    const medicine = await Medicine.findOneAndUpdate(filter, { isDeleted: true }, { new: true });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not deleted" });
    }

    return res.status(200).json({
      message: "Medicine deleted successfully",
      data: medicine,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
