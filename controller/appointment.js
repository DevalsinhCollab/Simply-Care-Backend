const User = require("../models/user");
const Problem = require("../models/problem");
const Appointment = require("../models/appointment");
const { formateDate } = require("../comman/comman");

exports.addAppointment = async (req, res) => {
  try {
    const {
      patientId,
      docId,
      prbData,
      issue,
      start,
      end,
      docName,
      docSpeciality,
    } = req.body;

    const appointment = await Appointment.create({
      patientId,
      docId,
      prbData,
      start,
      end,
      issue,
    });
    // const issue = prbData?.label?.split("-")[1];

    req.io.to(patientId).emit("newAppointment", {
      message: `Your appointment for ${issue} with ${docName} has been scheduled at ${formateDate(
        start
      )} To ${formateDate(end)}`,
      data: {
        ...appointment.toObject(),
        docName,
        docSpeciality,
      },
      type: "add",
    });

    return res.status(200).json({ data: appointment, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllAppointmentsByDoc = async (req, res) => {
  try {
    const { did } = req.params;
    // const { page = 0, pageSize = 10 } = req.body;

    // const skip = page * pageSize;
    // const totalCount = await Problem.countDocuments({ docId: did });
    const appointments = await Appointment.find({ docId: did }).sort({
      createdAt: -1,
    });
    // .skip(skip)
    // .limit(pageSize)
    // .lean()
    // .exec();

    const newData = appointments?.map((item) => {
      return {
        ...item.toObject(),
        start: new Date(item.start),
        end: new Date(item.end),
      };
    });
    return res.status(200).json({ data: newData, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientId,
      docId,
      prbData,
      issue,
      start,
      end,
      docName,
      docSpeciality,
    } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      {
        patientId,
        docId,
        prbData,
        start,
        end,
        issue,
      },
      { new: true }
    );

    // const issue = prbData?.label?.split("-")[1];

    req.io.to(patientId).emit("newAppointment", {
      message: `Your scheduled appointment for ${issue} with ${docName} has been updated at ${formateDate(
        start
      )} To ${formateDate(end)}`,
      data: {
        ...appointment.toObject(),
        docName,
        docSpeciality,
      },
      type: "update",
    });

    return res.status(200).json({ data: appointment, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id, { new: true });

    return res.status(200).json({ data: appointment, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAppointmentByPatient = async (req, res) => {
  try {
    const { pid } = req.params;
    const { page = 0, pageSize = 10 } = req.body;

    const skip = page * pageSize;
    const totalCount = await Appointment.countDocuments({ patientId: pid });
    const appointments = await Appointment.find({ patientId: pid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    const newData = await Promise.all(
      appointments.map(async (appt) => {
        const findDoctor = await User.findById(appt.docId);
        return {
          ...appt,
          docName: findDoctor.name,
          docSpeciality: findDoctor.docSpeciality,
        };
      })
    );
    return res.status(200).json({ data: newData, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAppointmentByDoctor = async (req, res) => {
  try {
    const { did } = req.params;
    const { page = 0, pageSize = 10 } = req.body;

    const skip = page * pageSize;
    const totalCount = await Appointment.countDocuments({ docId: did });
    const appointments = await Appointment.find({ docId: did })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    const newData = await Promise.all(
      appointments.map(async (appt) => {
        const findPatient = await User.findById(appt.patientId);
        return {
          ...appt,
          patientName: findPatient.name,
        };
      })
    );
    return res.status(200).json({ data: newData, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
