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
};

// Get filtered dashboard stats by date or month
exports.getFilteredDashboardStats = async (req, res) => {
    try {
        const { date, month } = req.query;

        let appointmentFilter = { isDeleted: false };
        let expenseFilter = { isDeleted: false };

        // Build date/month filter
        if (date) {
            // Filter by specific date
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            appointmentFilter.appointmentDate = {
                $gte: startDate,
                $lte: endDate,
            };

            expenseFilter.expenseDate = {
                $gte: startDate,
                $lte: endDate,
            };
        } else if (month) {
            // Filter by month (expecting MM-YYYY format)
            // For appointments, we need to extract the month from appointmentDate
            // For expenses, use the month field directly
            
            // Parse month string MM-YYYY
            const [monthNum, year] = month.split('-');
            const monthStart = new Date(`${year}-${monthNum}-01`);
            monthStart.setHours(0, 0, 0, 0);
            
            // Get the last day of the month
            const monthEnd = new Date(year, monthNum, 0);
            monthEnd.setHours(23, 59, 59, 999);

            appointmentFilter.appointmentDate = {
                $gte: monthStart,
                $lte: monthEnd,
            };

            expenseFilter.month = month;
        }

        // Calculate filtered income
        const incomeResult = await Appointment.aggregate([
            { $match: appointmentFilter },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$payment' },
                    totalPaid: { $sum: '$paidAmount' },
                    count: { $sum: 1 },
                }
            }
        ]);

        const totalIncome = incomeResult[0]?.totalIncome || 0;
        const totalPaid = incomeResult[0]?.totalPaid || 0;
        const appointmentCount = incomeResult[0]?.count || 0;
        const remainingAmount = totalIncome - totalPaid;

        // Calculate filtered expenses
        const expenseResult = await Expense.aggregate([
            { $match: expenseFilter },
            {
                $group: {
                    _id: null,
                    totalExpense: { $sum: '$amount' },
                    count: { $sum: 1 },
                }
            }
        ]);

        const totalExpense = expenseResult[0]?.totalExpense || 0;
        const expenseCount = expenseResult[0]?.count || 0;

        const profitLoss = totalPaid - totalExpense;

        return res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalPaid,
                remainingAmount,
                totalExpense,
                profitLoss,
                appointmentCount,
                expenseCount,
            }
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, success: false });
    }
};

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