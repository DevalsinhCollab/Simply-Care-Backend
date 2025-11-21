
const DoctorSpeciality = require("../models/doctorSpeciality");

// Create speciality
exports.createSpeciality = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await DoctorSpeciality.findOne({
      name: name.trim(),
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Speciality already exists",
      });
    }

    const newSpeciality = await DoctorSpeciality.create({ name });

    return res.status(201).json({
      success: true,
      message: "Speciality created successfully",
      data: newSpeciality,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all specialities
exports.getSpecialities = async (req, res) => {
  try {
    const list = await DoctorSpeciality.find({ isDeleted: false }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get speciality by ID
exports.getSpecialityById = async (req, res) => {
  try {
    const speciality = await DoctorSpeciality.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: speciality,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update speciality
exports.updateSpeciality = async (req, res) => {
  try {
    const { name } = req.body;

    const speciality = await DoctorSpeciality.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { name },
      { new: true }
    );

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Speciality updated successfully",
      data: speciality,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Soft delete speciality
exports.deleteSpeciality = async (req, res) => {
  try {
    const speciality = await DoctorSpeciality.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!speciality) {
      return res.status(404).json({
        success: false,
        message: "Speciality not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Speciality deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
