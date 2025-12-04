const PatientSchema = require("../models/patient")
const DoctorSchema = require("../models/doctor")
const PatientFormSchema = require("../models/patientform")
const Appointment = require("../models/appointment")
const Expense = require("../models/expense")

exports.dashboardCount = async (req, res) => {
    try {
        const patientCount = await PatientSchema.countDocuments();
        const doctorCount = await DoctorSchema.countDocuments({ isDeleted: false });
        const patientFormCount = await PatientFormSchema.countDocuments({ isDeleted: false });

        // Calculate income (total payment from appointments)
        const incomeResult = await Appointment.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                }
            }
        ]);

        const totalIncome = incomeResult[0]?.totalIncome || 0;
        const totalPaid = incomeResult[0]?.totalPaid || 0;
        const remainingAmount = totalIncome - totalPaid;

        // Calculate total expenses
        const expenseResult = await Expense.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: null,
                    totalExpense: { $sum: '$amount' },
                }
            }
        ]);

        const totalExpense = expenseResult[0]?.totalExpense || 0;

        return res.status(200).json({
            patientCount,
            doctorCount,
            patientFormCount,
            totalIncome,
            totalPaid,
            remainingAmount,
            totalExpense,
            success: true
        })

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}

// Get patients with remaining amount (patient-wise remaining > 0)
exports.getRemainingPatients = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let match = { isDeleted: false };
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const data = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$patientId',
                    totalPayment: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                },
            },
            {
                $project: {
                    totalPayment: 1,
                    totalPaid: 1,
                    remaining: { $subtract: ['$totalPayment', '$totalPaid'] },
                },
            },
            { $match: { remaining: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    patientId: '$_id',
                    patientName: '$patient.name',
                    phone: '$patient.phone',
                    totalPayment: 1,
                    totalPaid: 1,
                    remaining: 1,
                },
            },
            { $sort: { remaining: -1 } },
        ]);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Get patients with received (paid) amounts
exports.getReceivedByPatient = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let match = { isDeleted: false };
        if (startDate && endDate) {
            match.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const data = await Appointment.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$patientId',
                    totalPaid: { $sum: '$paidAmount' },
                    totalPayment: { $sum: '$payment' },
                },
            },
            { $match: { totalPaid: { $gt: 0 } } },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    patientId: '$_id',
                    patientName: '$patient.name',
                    phone: '$patient.phone',
                    totalPaid: 1,
                    totalPayment: 1,
                },
            },
            { $sort: { totalPaid: -1 } },
        ]);

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};