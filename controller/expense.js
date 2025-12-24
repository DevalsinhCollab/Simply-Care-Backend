const Expense = require("../models/expense");
const XLSX = require("xlsx");

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { description, amount, expenseDate, month, category, paymentMode } =
      req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Description and amount are required",
      });
    }

    const expense = await Expense.create({
      description,
      amount: Number(amount),
      expenseDate: expenseDate || new Date(),
      month:
        month ||
        (() => {
          const now = new Date();
          return `${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${now.getFullYear()}`;
        })(),
      category: category || "other",
      paymentMode: paymentMode || "cash",
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const { month, category, date, page = 0, pageSize = 10 } = req.query;

    let filter = { isDeleted: false };

    // Filter by month or specific date
    if (month) {
      filter.month = month;
    } else if (date) {
      // Filter by specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.expenseDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (category) filter.category = category;

    const skip = Number(page) * Number(pageSize);

    const expenses = await Expense.find(filter)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(Number(pageSize));

    const total = await Expense.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: expenses,
      total,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update expense
exports.updateExpense = async (req, res) => {
  try {
    const { description, amount, expenseDate, month, category, paymentMode } =
      req.body;


    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        expenseDate,
        month,
        category,
        paymentMode,
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete expense (soft delete)
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get expense summary (total by category, total expenses, etc.)
exports.getExpenseSummary = async (req, res) => {
  try {
    const { month, date } = req.query;

    let filter = { isDeleted: false };

    if (month) {
      const [mm, yyyy] = month.split("-");
      filter.month = `${mm}-${yyyy}`;
    } else if (date) {
      // Filter by specific date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.expenseDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        byCategory: summary,
        totalExpense: totalExpense[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get expense statistics for dashboard (with count and breakdown)
exports.getExpenseStats = async (req, res) => {
  try {
    const { month, date } = req.query;

    let filter = { isDeleted: false };

    // month format: MM-YYYY → convert to ^YYYY-MM
    if (month) {
      const [mm, yyyy] = month.split("-");
      filter.month = `${mm}-${yyyy}`;
    } else if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.expenseDate = { $gte: startDate, $lte: endDate };
    }

    const expenseCount = await Expense.countDocuments(filter);

    // Get category breakdown with descriptions
    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          descriptions: {
            $push: {
              description: "$description",
              amount: "$amount",
            },
          },
        },
      },
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        expenseCount,
        totalExpense: totalExpense[0]?.total || 0,
        byCategory: summary,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// // Export expense stats as Excel
// exports.exportExpenseStats = async (req, res) => {
//   try {
//     const { month, date } = req.query;

//     let filter = { isDeleted: false };

//     if (month) {
//       const [mm, yyyy] = month.split("-");
//       filter.month = { $regex: new RegExp(`^${yyyy}-${mm}`) };
//     } else if (date) {
//       const startDate = new Date(date);
//       startDate.setHours(0, 0, 0, 0);
//       const endDate = new Date(date);
//       endDate.setHours(23, 59, 59, 999);

//       filter.expenseDate = { $gte: startDate, $lte: endDate };
//     }

//     // Get all expenses for the given filter
//     const expenses = await Expense.find(filter).sort({ expenseDate: -1 }).lean();

//     // Get summary stats
//     const expenseCount = expenses.length;
//     const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

//     // Group by category with descriptions
//     const byCategory = {};
//     expenses.forEach((exp) => {
//       if (!byCategory[exp.category]) {
//         byCategory[exp.category] = {
//           total: 0,
//           count: 0,
//           descriptions: [],
//         };
//       }
//       byCategory[exp.category].total += exp.amount;
//       byCategory[exp.category].count += 1;
//       byCategory[exp.category].descriptions.push(exp.description);
//     });

//     // Create Excel workbook with multiple sheets
//     const wb = XLSX.utils.book_new();

//     // Sheet 1: Summary
//     const summaryData = [
//       { 'Metric': 'Total Expenses', 'Value': totalExpense },
//       { 'Metric': 'Total Count', 'Value': expenseCount },
//       {},
//       { 'Metric': 'Category Breakdown', 'Value': '' },
//     ];

//     Object.entries(byCategory).forEach(([category, data]) => {
//       summaryData.push({
//         'Metric': category.toUpperCase(),
//         'Value': data.total,
//         'Count': data.count,
//         'Descriptions': data.descriptions.join('; '),
//       });
//     });

//     const summarySheet = XLSX.utils.json_to_sheet(summaryData);
//     summarySheet['!cols'] = [
//       { wch: 25 },
//       { wch: 15 },
//       { wch: 10 },
//       { wch: 50 },
//     ];
//     XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

//     // Sheet 2: Detailed Expenses
//     const detailedData = expenses.map((exp) => ({
//       'Date': new Date(exp.expenseDate).toLocaleDateString('en-IN'),
//       'Description': exp.description,
//       'Category': exp.category,
//       'Amount': exp.amount,
//       'Month': exp.month,
//     }));

//     const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
//     detailedSheet['!cols'] = [
//       { wch: 15 },
//       { wch: 30 },
//       { wch: 15 },
//       { wch: 12 },
//       { wch: 12 },
//     ];

//     // Add total row
//     const totalRow = {
//       'Date': 'TOTAL',
//       'Description': '',
//       'Category': '',
//       'Amount': totalExpense,
//       'Month': '',
//     };
//     detailedData.push(totalRow);
//     XLSX.utils.book_append_sheet(wb, detailedSheet, 'Detailed');

//     // Generate filename
//     let filename = 'Expense_Stats';
//     if (month) {
//       filename += `_${month}`;
//     } else if (date) {
//       filename += `_${date}`;
//     }
//     filename += '.xlsx';

//     // Send file
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader(
//       'Content-Type',
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );

//     const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
//     res.send(buffer);
//   } catch (error) {
//     console.error('Export error:', error);
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.exportExpenseStats = async (req, res) => {
  try {
    const { month, date } = req.query;

    let filter = { isDeleted: false };

    if (month) {
      const [mm, yyyy] = month.split("-");
      filter.month = `${mm}-${yyyy}`;
    } else if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.expenseDate = { $gte: startDate, $lte: endDate };
    }

    const expenses = await Expense.find(filter)
      .sort({ expenseDate: -1 })
      .lean();

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const exportRows = expenses.map((exp) => ({
      Date: new Date(exp.expenseDate).toLocaleDateString("en-IN"),
      Description: exp.description,
      Category: exp.category,
      Amount: exp.amount,
      PaymentMode: exp.paymentMode,
      Month: exp.month,
    }));

    // Add TOTAL row
    exportRows.push({
      Date: "TOTAL",
      Description: "",
      Amount: totalExpense,
      PaymentMode: "",
      Month: "",
      Category: "",
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(exportRows);

    sheet["!cols"] = [
      { wch: 15 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(wb, sheet, "Expenses");

    let filename = "Expenses";
    if (month) filename += `_${month}`;
    if (date) filename += `_${date}`;
    filename += ".xlsx";

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    return res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
