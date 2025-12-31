const PatientSchema = require("../models/patient");
const PatientFormSchema = require("../models/patientform");

exports.addPatient = async (req, res) => {
  try {
    const { phone } = req.body;

    const patient = await PatientSchema.findOne({ phone });

    if (patient) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Patient already exists with this phone",
        });
    }

    const patientData = await PatientSchema.create(req.body);

    return res.status(200).json({
      success: true,
      message: "Added Successfully",
      data: patientData,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search } = req.query;

    const loggedUserClinicId = req.user.clinicId;
    let findObject = { isDeleted: false };

    console.log("User Clinic ID:", req.user);
  

    if (loggedUserClinicId) {
      findObject.clinicId = loggedUserClinicId;
    }

    console.log(findObject, "findObject");

    if (search && search !== "") {
      findObject = {
        ...findObject,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { gender: { $regex: search, $options: "i" } },
          { occupation: { $regex: search, $options: "i" } },
        ],
      };
    }
    

    const skip = page * pageSize;
    const totalCount = await PatientSchema.countDocuments(findObject);
    const doctors = await PatientSchema.find(findObject).populate('clinicId')
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

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, phone, address } = req.body;

    const patient = await PatientSchema.findByIdAndUpdate(
      id,
      {
        ...req.body,
      },
      { new: true }
    );

    await PatientFormSchema.updateMany(
      { "patient._id": id },
      {
        "patient.name": name,
        "patient.phone": phone,
        "patient.address": address,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Updated Successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await PatientSchema.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Deleted Successfully",
      data: patient,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.getPatientByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    const patient = await PatientSchema.findOne({ phone, isDeleted: false });

    if (!patient) {
      return res.status(200).json({
        success: true,
        message: "Patient not found",
        data: null,
        found: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient found",
      data: patient,
      found: true,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.searchPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const loggedUserClinicId = req.user.clinicId;

    let findObject = { isDeleted: false };

     
    if(loggedUserClinicId){
      findObject.clinicId = loggedUserClinicId
    }

    if (search && search !== "") {
      findObject = {
        ...findObject,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { gender: { $regex: search, $options: "i" } },
          { occupation: { $regex: search, $options: "i" } },
        ],
      };
    }

    const patients = await PatientSchema.find(findObject)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();

    return res.status(200).json({ data: patients, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
