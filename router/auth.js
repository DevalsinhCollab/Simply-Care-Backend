const express = require("express");
const {
  login,
  adduser,
  forgotpassword,
  resetpassword,
  signup,
  verifyOtp,
  getUserbyToken,
} = require("../controller/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/verifyotp", verifyOtp);
router.post("/login", login);
router.post("/adduser", adduser);
router.post("/forgotpassword", forgotpassword);
router.post("/resetpassword", resetpassword);
router.post("/getuserbytoken", getUserbyToken);

module.exports = router;
