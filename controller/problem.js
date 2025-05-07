const User = require("../models/user");
const Problem = require("../models/problem");

exports.addProblem = async (req, res) => {
  try {
    const { patientId, docId, docSpeciality, issue, description, patientName } =
      req.body;

    const problemData = await Problem.create({
      patientId,
      docId,
      docSpeciality,
      issue,
      description,
    });

    req.io.to(docId).emit("newProblem", {
      message: "A new problem has been created",
      data: { ...problemData.toObject(), patientName },
    });

    const findDoc = await User.findById(docId);

    return res.status(200).json({
      success: true,
      message: "Problem Added Successfully",
      data: { ...problemData.toObject(), docName: findDoc?.name },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.getProblemsByPatient = async (req, res) => {
  try {
    const { pid } = req.params;
    const { page = 0, pageSize = 10 } = req.body;

    const skip = page * pageSize;
    const totalCount = await Problem.countDocuments({ patientId: pid });
    const problems = await Problem.find({ patientId: pid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    const newData = await Promise.all(
      problems.map(async (problem) => {
        const findDoctor = await User.findById(problem.docId);
        return {
          ...problem,
          docName: findDoctor.name,
        };
      })
    );
    return res.status(200).json({ data: newData, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProblemsByDoc = async (req, res) => {
  try {
    const { did } = req.params;
    const { page = 0, pageSize = 10 } = req.body;

    const skip = page * pageSize;
    const totalCount = await Problem.countDocuments({ docId: did });
    const problems = await Problem.find({ docId: did })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();
    const newData = await Promise.all(
      problems.map(async (problem) => {
        const findPatient = await User.findById(problem.patientId);
        return {
          ...problem,
          patientName: findPatient.name,
        };
      })
    );
    return res.status(200).json({ data: newData, totalCount, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getProblemsByDocForDashboard = async (req, res) => {
  try {
    const { did } = req.params;

    const problems = await Problem.find({ docId: did })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
      .exec();
    const newData = await Promise.all(
      problems.map(async (problem) => {
        const findPatient = await User.findById(problem.patientId);
        return {
          ...problem,
          patientName: findPatient.name,
        };
      })
    );
    return res.status(200).json({ data: newData, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllProblemsByDoc = async (req, res) => {
  try {
    const { did } = req.params;
    // const { page = 0, pageSize = 10 } = req.body;

    // const skip = page * pageSize;
    // const totalCount = await Problem.countDocuments({ docId: did });
    const problems = await Problem.find({ docId: did }).sort({ createdAt: -1 });
    // .skip(skip)
    // .limit(pageSize)
    // .lean()
    // .exec();
    const newData = await Promise.all(
      problems.map(async (problem) => {
        const findPatient = await User.findById(problem.patientId);
        return {
          ...problem.toObject(),
          patientName: findPatient.name,
        };
      })
    );
    return res.status(200).json({ data: newData, success: true });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// exports.addAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { start, end, preId, docName } = req.body;

//     const problem = await Problem.findByIdAndUpdate(
//       id,
//       { start, end },
//       { new: true }
//     );

//     const findPatient = await User.findById(problem.patientId);

//     const newData = {
//       ...problem.toObject(),
//       patientData: {
//         label: `${findPatient?.name}-${problem?.issue}`,
//         value: problem._id,
//       },
//     };

//     req.io.to(problem.patientId).emit("newAppointment", {
//       message: "A new appointment has been created",
//       data: { ...problem.toObject(), docName },
//     });

//     return res.status(200).json({ data: newData, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.approveDoctor = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const doctor = await Doctor.findByIdAndUpdate(
//       id,
//       { isApproved: "1" },
//       { new: true }
//     );

//     await User.create({
//       name: doctor.name,
//       email: doctor.email,
//       phone: doctor.phone,
//       docSpeciality: doctor.speciality,
//       role: "D",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "approved successfully",
//       data: doctor,
//     });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.getDoctorsBySpeciality = async (req, res) => {
//   try {
//     const { pageSize = 5, docSpeciality, search } = req.body;

//     let findObject = { role: "D" };

//     if (docSpeciality) {
//       findObject.docSpeciality = docSpeciality;
//     }

//     if (search) {
//       findObject.$or = [{ name: search }];
//     }

//     const doctors = await User.find(findObject).limit(pageSize).lean().exec();

//     return res.status(200).json({ data: doctors, success: true });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };
