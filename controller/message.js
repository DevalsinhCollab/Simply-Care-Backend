const Message = require("../models/message");
const User = require("../models/user");

exports.getChat = async (req, res) => {
  try {
    const { senderId, receiverId, prbId } = req.body;
    const messages = await Message.find({
      prbId: prbId,
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort("timestamp");

    const receiver = await User.findById(receiverId);
    res.status(200).send({ messages, receiver });
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getPatientsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const messages = await Message.find({ receiver: doctorId })
      .populate("sender")
      .distinct("sender");
    res.status(200).send(messages);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.markAsReadMsg = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndUpdate(
      id,
      {
        read: true,
      },
      { new: true }
    );

    res.status(200).send({ success: true, data: message });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

exports.getUnreadMsgsCount = async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== undefined) {
      const unreadMsgCount = await Message.countDocuments({
        receiverId: id,
        read: false,
      });

      res.status(200).send({ success: true, data: unreadMsgCount });
    }
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};

exports.getUnreadMsgs = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await Message.find({
      receiverId: id,
      read: false,
    }).sort({ timestamp: -1 });

    const newData = await Promise.all(
      messages.map(async (msg) => {
        const findSender = await User.findById(msg.senderId);
        return {
          ...msg.toObject(),
          senderName: findSender.name,
        };
      })
    );

    res.status(200).send({ success: true, data: newData });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
};
