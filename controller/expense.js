const Expense = require('../models/expense');

// Create expense
exports.createExpense = async (req, res) => {
  try {
    const { description, amount, expenseDate, month, category } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Description and amount are required',
      });
    }

    const expense = await Expense.create({
      description,
      amount: Number(amount),
      expenseDate: expenseDate || new Date(),
      month: month || new Date().toISOString().split('T')[0],
      category: category || 'other',
    });

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
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
    const { month, category, page = 0, pageSize = 10 } = req.query;

    let filter = { isDeleted: false };

    if (month) filter.month = month;
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
        message: 'Expense not found',
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
    const { description, amount, expenseDate, month, category } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        expenseDate,
        month,
        category,
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
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
        message: 'Expense not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
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
    const { month } = req.query;

    let filter = { isDeleted: false };
    if (month) filter.month = month;

    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
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
