const express = require('express');
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenseStats,
  exportExpenseStats,
} = require('../controller/expense');

const router = express.Router();

// Create expense
router.post('/createExpense', createExpense);

// Get all expenses
router.get('/getAllExpenses', getAllExpenses);

// Get expense by ID
router.get('/getExpenseById/:id', getExpenseById);

// Update expense
router.put('/updateExpense/:id', updateExpense);

// Delete expense
router.put('/deleteExpense/:id', deleteExpense);

// Get expense summary
router.get('/getExpenseSummary', getExpenseSummary);

// Get expense statistics for dashboard
router.get('/getExpenseStats', getExpenseStats);

// Export expense statistics as Excel
router.get('/exportExpenseStats', exportExpenseStats);

module.exports = router;
