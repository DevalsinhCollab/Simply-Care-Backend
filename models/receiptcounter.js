const mongoose = require("mongoose");

const receiptCounterSchema = mongoose.Schema({
    dateKey: { type: String, required: true, unique: true },
    sequence: { type: Number, default: 0 },
});

module.exports = mongoose.model("ReceiptCounter", receiptCounterSchema);