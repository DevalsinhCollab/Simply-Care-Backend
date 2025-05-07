const PatientFormSchema = require("../models/patientform");

exports.addPatientForm = async (req, res) => {
    try {
        const {
            doctor,
            patient,
            date,
            description,
            payment
        } = req.body;


        const patientData = await PatientFormSchema.create({
            doctor,
            patient,
            date,
            description,
            payment
        });

        return res.status(200).json({
            success: true,
            message: "Added Successfully",
            data: patientData,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.getPatientsForm = async (req, res) => {
    try {
        const { page = 0, pageSize = 10, search } = req.query;

        let findObject = {}

        if (search && search !== "") {
            findObject = {
                $or: [
                    { description: { $regex: search, $options: "i" } },
                    { "doctor.name": { $regex: search, $options: "i" } },
                    { "patient.name": { $regex: search, $options: "i" } },
                    { "patient.email": { $regex: search, $options: "i" } },
                    { "patient.phone": { $regex: search, $options: "i" } },
                    { "patient.address": { $regex: search, $options: "i" } },
                ],
            };
        }

        const skip = page * pageSize;
        const totalCount = await PatientFormSchema.countDocuments(findObject);
        const doctors = await PatientFormSchema.find(findObject)
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

exports.updatePatientForm = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            doctor,
            patient,
            date,
            description,
            payment
        } = req.body;

        const patientData = await PatientFormSchema.findByIdAndUpdate(id, {
            doctor,
            patient,
            date,
            description,
            payment
        }, { new: true });


        return res.status(200).json({
            success: true,
            message: "Updated Successfully",
            data: patientData,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.deletePatientForm = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await PatientFormSchema.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
            data: patient,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message, success: false });
    }
};