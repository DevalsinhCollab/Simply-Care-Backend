const moment = require("moment");
const ReceiptCounter = require("../models/receiptcounter");

exports.formateDate = (date) => {
  const formatedDate = moment(date).format("MMMM Do YYYY, h:mm:ss a");
  return formatedDate;
};

exports.generateReceiptNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const dateKey = `${year}${day}${month}`;

  const counter = await ReceiptCounter.findOneAndUpdate(
    { dateKey },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const sequence = String(counter.sequence).padStart(0, '0');
  return `${dateKey}${sequence}`;
}
