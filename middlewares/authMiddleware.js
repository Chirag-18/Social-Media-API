const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  // Get the token from the header if present
  const token = req.headers["authorization"];

  // If no token found, return error response
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWTSECRET);

    // Extract user ID from the token and add it to the request object
    req.userId = decoded.userId;

    // Pass control to the next middleware
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
}

module.exports = authMiddleware;
