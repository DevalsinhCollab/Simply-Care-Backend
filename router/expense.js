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
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Create expense
router.post('/createExpense',verifyToken, createExpense);

// Get all expenses
router.get('/getAllExpenses',verifyToken, getAllExpenses);

// Get expense by ID
router.get('/getExpenseById/:id', getExpenseById);

// Update expense
router.put('/updateExpense/:id', updateExpense);

// Delete expense
router.put('/deleteExpense/:id', deleteExpense);

// Get expense summary
router.get('/getExpenseSummary', getExpenseSummary);

// Get expense statistics for dashboard
router.get('/getExpenseStats',verifyToken, getExpenseStats);

// Export expense statistics as Excel
router.get('/exportExpenseStats', exportExpenseStats);

module.exports = router;
