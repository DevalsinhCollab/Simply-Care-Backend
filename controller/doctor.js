const Doctor = require("../models/doctor");
const User = require("../models/user");
const PatientFormSchema = require("../models/patientform");

exports.addDoctor = async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    const existingDoctor = await Doctor.findOne({ email: email });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    const doctorData = await Doctor.create(req.body);

    // Create user record with role "D" for doctor
    await User.create({
      name: name,
      email: email,
      phone: phone,
      role: "D",
      doctorId: doctorData._id,
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

    let findObject = {isDeleted: false};

    if (search && search !== "") {
      findObject = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const skip = page * pageSize;
    const totalCount = await Doctor.countDocuments(findObject);
    const doctors = await Doctor.find(findObject).populate('docSpeciality')
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
    const { name, email, phone } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, req.body, { new: true });

    // Update user record with same email
    await User.updateOne(
      { email: email },
      { name: name, phone: phone, doctorId: id }
    );

    await PatientFormSchema.updateMany(
      { "doctor._id": id },
      { "doctor.name": name }
    );

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

    // Get doctor email before deleting
    const doctor = await Doctor.findById(id);

    // Delete doctor record
    await Doctor.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    // Clear doctorId from corresponding user record
    if (doctor && doctor.email) {
      await User.updateOne(
        { email: doctor.email, role: "D" },
        { doctorId: null }
      );
    }

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
    const  doctorId = req.user.doctorId

    let findObject = {isDeleted : false };

    if(doctorId){
      findObject._id = doctorId
    }

    if (search && search !== "") {
      findObject = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
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
