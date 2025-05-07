const express = require("express");
const {
  addProblem,
  getProblemsByDoc,
  getProblemsByPatient,
  getAllProblemsByDoc,
  addAppointment,
  getProblemsByDocForDashboard,
} = require("../controller/problem");
const router = express.Router();

router.post("/addProblem", (req, res) => {
  req.io = req.app.get("socketio");
  addProblem(req, res);
});
router.post("/getproblemsbypatient/:pid", getProblemsByPatient);
router.post("/getproblemsbydoc/:did", getProblemsByDoc);
router.post("/getallproblemsbydoc/:did", getAllProblemsByDoc);
router.post("/getproblemsbydocfordashboard/:did", getProblemsByDocForDashboard);
// router.post("/addappointment/:id", (req, res) => {
//   req.io = req.app.get("socketio");
//   addAppointment(req, res);
// });

module.exports = router;
