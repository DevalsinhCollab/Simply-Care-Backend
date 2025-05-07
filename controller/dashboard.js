const PatientSchema = require("../models/patient")
const DoctorSchema = require("../models/doctor")
const PatientFormSchema = require("../models/patientform")

exports.dashboardCount = async (req, res) => {
    try {

        const patientCount = await PatientSchema.countDocuments()
        const doctorCount = await DoctorSchema.countDocuments()
        const patientFormCount = await PatientFormSchema.countDocuments()

        return res.status(200).json({ patientCount, doctorCount, patientFormCount, success: true })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}