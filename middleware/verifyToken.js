const JWT = require("jsonwebtoken");

// Extracts token from Authorization header `Bearer <token>` and verifies it.
// On success attaches decoded payload to `req.user` and calls next().
// On failure returns 401.
module.exports = function verifyToken(req, res, next) {
  try {

      
      const authHeader = req.headers["authorization"] || req.headers["Authorization"];
      if (!authHeader) {
          return res.status(401).json({ success: false, message: "No token provided." });
        }
        
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ success: false, message: "Invalid token format." });
        }
        
        const token = parts[1];
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);

    // Attach decoded data (e.g., { userId, role }) to req.user
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: error.message });
  }
};
