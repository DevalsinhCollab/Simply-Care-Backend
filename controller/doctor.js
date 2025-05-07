const Doctor = require("../models/doctor");
const PatientFormSchema = require("../models/patientform")

exports.addDoctor = async (req, res) => {
  try {
    const {
      name,
    } = req.body;

    const doctorData = await Doctor.create({
      name,
    });

    return res.status(200).json({
      success: true,
      message: "Added Successfully",
      data: doctorData,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const { page = 0, pageSize = 0, search } = req.query;

    let findObject = {};

    if (search && search !== "") {
      findObject = {
        $or: [
          { name: { $regex: search, $options: "i" } },
        ],
      };
    }

    const skip = page * pageSize;
    const totalCount = await Doctor.countDocuments(findObject);
    const doctors = await Doctor.find(findObject)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    return res.status(200).json({ data: doctors, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
    } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, {
      name,
    }, { new: true });

    await PatientFormSchema.updateMany({ "doctor._id": id }, { "doctor.name": name })

    return res.status(200).json({
      success: true,
      message: "Updated Successfully",
      data: doctor,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: "Deleted Successfully",
      data: doctor,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.searchDoctors = async (req, res) => {
  try {
    const { search } = req.query;

    let findObject = {};

    if (search && search !== "") {
      findObject = {
        $or: [
          { name: { $regex: search, $options: "i" } },
        ],
      };
    }

    const doctors = await Doctor.find(findObject)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();

    return res.status(200).json({ data: doctors, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
