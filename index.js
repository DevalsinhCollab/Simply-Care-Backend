const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const Message = require("./models/message");
const User = require("./models/user");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

const env = require("dotenv");
const connectDB = require("./db/db");
env.config();

const PORT = process.env.PORT || 5000;
connectDB();

app.set("socketio", io);

app.get("/", (req, res) => {
  res.send("Server is running");
})

app.use("/api/auth", require("./router/auth"));
app.use("/api/doc", require("./router/doctor"));
app.use("/api/msg", require("./router/message"));
app.use("/api/prb", require("./router/problem"));
app.use("/api/patient", require("./router/patient"));
app.use("/api/patientform", require("./router/patientForm"));
app.use("/api/dashboard", require("./router/dashboard"));
app.use("/api/appointment", require("./router/appointment"));
app.use("/api/doctorSpeciality", require("./router/doctorSpeciality"));
app.use("/api/unavailability", require("./router/doctorUnavailability"));
app.use("/api/expense", require("./router/expense"));

const activeUsers = {};
const userSocketMap = {};

// io.on("connection", (socket) => {
//   socket.on("registerUser", (userId) => {
//     userSocketMap[userId] = socket.id;
//   });
//   socket.emit("me", socket.id);

//   socket.on("disconnect", () => {
//     for (let userId in userSocketMap) {
//       if (userSocketMap[userId] === socket.id) {
//         delete userSocketMap[userId];
//         break;
//       }
//     }
//     socket.broadcast.emit("callended");
//   });
//   // socket.on("callUser", ({ userToCall, signalData, from, name }) => {
//   //   console.log(userToCall)
//   //   console.log(from)
//   //   io.to(userToCall).emit("callUser", { signal: signalData, from, name });
//   // });

//   socket.on("callUser", ({ userToCallId, signalData, from, name }) => {
//     console.log("userToCallId---", userToCallId);
//     const userToCallSocket = userSocketMap[userToCallId];
//     console.log("userToCallSocket--", userToCallSocket);
//     if (userToCallSocket) {
//       io.to(userToCallSocket).emit("callUser", {
//         signal: signalData,
//         from,
//         name,
//       });
//     }
//   });

//   socket.on("answercall", (data) => {
//     io.to(data.to).emit("callaccepted", data.signal);
//   });
//   // console.log(`New connection: ${socket.id}`);

//   socket.on("disconnect", () => {
//     Object.keys(activeUsers).forEach((userId) => {
//       if (activeUsers[userId] === socket.id) {
//         delete activeUsers[userId];
//       }
//     });
//     // console.log(`Disconnected: ${socket.id}`);
//   });

//   socket.on("joinChatRoom", ({ senderId, roomId }) => {
//     socket.join(roomId);
//     activeUsers[senderId] = socket.id;
//     console.log(`${senderId} joined chat room ${roomId}`);
//   });

//   socket.on("leaveChatRoom", ({ senderId, roomId }) => {
//     socket.leave(roomId);
//     delete activeUsers[senderId];
//     console.log(`${senderId} left chat room ${roomId}`);
//   });

//   socket.on(
//     "sendMessage",
//     ({ senderId, receiverId, message, senderName, roomId, prbId }) => {
//       const newMessage = new Message({
//         senderId,
//         receiverId,
//         message,
//         prbId,
//       });

//       newMessage.save().then((msg) => {
//         io.to(roomId).emit("receiveMessage", msg);
//         if (!activeUsers[receiverId]) {
//           io.to(receiverId).emit("notifyUser", {
//             title: `New message from ${senderName} : ${message}`,
//             message: `New message ${message}`,
//             receiverId,
//             _id: msg._id,
//             senderName,
//           });
//         }
//       });
//     }
//   );

//   socket.on("markAsRead", async ({ messageId }) => {
//     try {
//       await Message.findByIdAndUpdate(messageId, { read: true });
//       console.log(`Message ${messageId} marked as read`);
//     } catch (error) {
//       console.error(`Error marking message ${messageId} as read:`, error);
//     }
//   });

//   socket.on("joinRoom", (docId) => {
//     socket.join(docId);
//   });

  // socket.on("typing", ({ senderId, receiverId }) => {
  //   const roomId = [senderId, receiverId].sort().join("_");
  //   socket.to(roomId).emit("typing", { senderId });
  // });

  // socket.on("stopTyping", ({ senderId, receiverId }) => {
  //   const roomId = [senderId, receiverId].sort().join("_");
  //   socket.to(roomId).emit("stopTyping", { senderId });
  // });
// });

server.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
