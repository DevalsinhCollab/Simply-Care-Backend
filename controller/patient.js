const PatientSchema = require("../models/patient");
const PatientFormSchema = require("../models/patientform")

exports.addPatient = async (req, res) => {
    try {
        const {
            email,
        } = req.body;

        const patient = await PatientSchema.findOne({ email });

        if (patient) {
            return res
                .status(400)
                .json({ success: false, message: "Patient already exists with this email" });
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

        let findObject = {}

        if (search && search !== "") {
            findObject = {
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
        const doctors = await PatientSchema.find(findObject)
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

        const {
            name,
            email,
            phone,
            address,
        } = req.body;

        const patient = await PatientSchema.findByIdAndUpdate(id, {
            ...req.body
        }, { new: true });

        console.log(patient)

        await PatientFormSchema.updateMany({ "patient._id": id }, { "patient.name": name, "patient.email": email, "patient.phone": phone, "patient.address": address })

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

        const patient = await PatientSchema.findByIdAndDelete(id)

        return res.status(200).json({
            success: true,
            message: "Deleted Successfully",
            data: patient,
        });
    } catch (error) {

        console.log(error)

        return res.status(400).json({ message: error.message, success: false });
    }
};

exports.searchPatients = async (req, res) => {
    try {
        const { search } = req.query;

        let findObject = {};

        if (search && search !== "") {
            findObject = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
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
