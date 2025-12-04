const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String, // e.g., "12-2024" or "December-2024"
      default: () => {
        const now = new Date();
        return `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      },
    },
    category: {
      type: String,
      enum: ['utilities', 'rent', 'supplies', 'maintenance' , 'salary', 'other'],
      default: 'other',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('expense', expenseSchema);
