const moment = require("moment");

exports.formateDate = (date) => {
  const formatedDate = moment(date).format("MMMM Do YYYY, h:mm:ss a");
  return formatedDate;
};
