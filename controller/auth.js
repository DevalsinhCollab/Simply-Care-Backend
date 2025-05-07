const User = require("../models/user");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "tarunrudakiya123@gmail.com",
    pass: "zbqq zncs dusx ocsc",
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, role, keepMeLoggedIn } = req.body;
    const user = await User.findOne({ email }).select("-password");

    if (user) {
      return res.status(400).json({
        success: false,
        message: `User Already Exits With This Email`,
        success: false,
      });
    }

    const otp = generateOTP();

    const userData = await User.create({
      name,
      email,
      phone,
      role,
      otp,
      keepMeLoggedIn,
    });

    // const mailOptions = {
    //   from: "tarunrudakiya123@gmail.com",
    //   to: email,
    //   subject: "OTP",
    //   text: `Your OTP is ${otp}`,
    // };

    // const emailResponse = await new Promise((resolve, reject) => {
    //   transporter.sendMail(mailOptions, function (err, data) {
    //     if (err) {
    //       // If an error occurs, reject the promise with the error message
    //       reject(err.message);
    //     } else {
    //       // If email sent successfully, resolve the promise
    //       resolve("OTP sent to your Email-Id.");
    //     }
    //   });
    // });

    return res.status(200).json({
      success: true,
      message: "Registered",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message, success: false });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: `Invalid OTP`,
        success: false,
      });
    }

    if (user.isDelete == "1") {
      return res.status(400).json({
        success: false,
        message: "You can't login please contact your admin.",
      });
    }

    JWT_DATA = {
      userId: user.id,
      role: user.role,
    };

    const expiresTime = user.keepMeLoggedIn ? "24h" : "30min";

    const token = JWT.sign(JWT_DATA, process.env.JWT_SECRET_KEY, {
      expiresIn: expiresTime,
    });

    return res.status(200).json({
      success: true,
      message: "User login successfully.",
      token,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        docSpeciality: user.docSpeciality,
      },
    });
  } catch (error) {
    return res.status(400).json({ error, success: false });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, keepMeLoggedIn } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Email not found" });
    }

    if (user.isDelete == "1") {
      return res.status(400).json({
        success: false,
        message: "You can't login please contact your admin.",
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.keepMeLoggedIn = keepMeLoggedIn;
    await user.save();

    // const mailOptions = {
    //   from: "tarunrudakiya123@gmail.com",
    //   to: email,
    //   subject: "OTP",
    //   text: `Your OTP is ${otp}`,
    // };

    // const emailResponse = await new Promise((resolve, reject) => {
    //   transporter.sendMail(mailOptions, function (err, data) {
    //     if (err) {
    //       // If an error occurs, reject the promise with the error message
    //       reject(err.message);
    //     } else {
    //       // If email sent successfully, resolve the promise
    //       resolve("OTP sent to your Email-Id.");
    //     }
    //   });
    // });

    return res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.adduser = async (req, res) => {
  try {
    let { name, email, role, phone, designation } = req.body;

    email = email.toLowerCase();

    const userCheck = await User.findOne({ email });

    if (userCheck) {
      return res.status(400).json({
        success: false,
        message: "User already exists with the email.",
      });
    }

    // const salt = await bcrypt.genSalt(10);
    // const bcryptPass = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      role,
      phone,
      designation,
      // password: bcryptPass,
    });

    return res.status(200).json({
      success: true,
      message: "User created Successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select("-password");

  if (!user) {
    return res.status(400).json({
      success: false,
      message: `Incorrect credentials.`,
      success: false,
    });
  }

  JWT_DATA = {
    userId: user._id,
  };

  const token = JWT.sign(JWT_DATA, process.env.JWT_SECRET_KEY, {
    expiresIn: "24h",
  });

  const urlToken = token.split(".");
  const link = `${process.env.FRONTEND_URL}/auth/resetpassword/${urlToken[0]}/${urlToken[1]}/${urlToken[2]}`;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "tarunrudakiya123@gmail.com",
      pass: "zbqq zncs dusx ocsc",
    },
  });

  const mailOptions = {
    from: "tarunrudakiya123@gmail.com",
    to: email,
    subject: "Reset Password Project",
    text: `This mail is regarding password change request.
              Follow the given link for further process .
              Link : ${link}`,
  };

  try {
    transporter.sendMail(mailOptions, function (err, data) {
      if (err) {
        return res.status(400).json({ err, success: false });
      } else {
        return res.status(200).json({
          success: true,
          message: `Link sent to your registered Email-Id.`,
          success: true,
        });
      }
    });
  } catch (error) {
    return res.status(400).json({ error, success: false });
  }
};

exports.resetpassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    var decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
    const { userId } = decoded;
    const salt = await bcrypt.genSalt(10);
    const bcryptPass = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(
      userId,
      { password: bcryptPass },
      { new: true }
    );

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.getUserbyToken = async (req, res) => {
  try {
    const { token } = req.body;

    var decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);

    const { userId } = decoded;

    const user = await User.findById(userId).select("-password");
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
