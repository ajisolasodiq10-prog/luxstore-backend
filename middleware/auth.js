const jwt = require("jsonwebtoken");
const User = require("../models/user");


// protect — verify the JWT token
async function protect(req, res, next) {
  // Step 1 — Look for the Authorization header
  const authHeader = req.headers.authorization;

  // We check it starts with "Bearer " then grab the token part
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Not logged in. Please provide a token." });
  }

  // Split "Bearer eyJhbGci..." into ["Bearer", "eyJhbGci..."]
  // and take index [1] — the actual token
  const token = authHeader.split(" ")[1];

  try {
    // Step 2 — Verify the token using our secret key
    // If the token was tampered with or expired, this throws an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded now contains what we put in when we created the token:
    // { id: "...", role: "...", iat: ..., exp: ... }

    // Step 3 — Find the user in the database using the ID from the token
    // .select("-password") means "give me everything EXCEPT the password field"
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Account not found." });
    }

    // Step 4 — Attach the user to the request object
    // Now any route that uses this middleware can access req.user
    req.user = user;

    // Step 5 — Call next() to move on to the actual route handler
    next();
  } catch (error) {
    // jwt.verify throws specific errors we can check
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }
    return res
      .status(401)
      .json({ error: "Invalid token. Please log in again." });
  }
}


module.exports = { protect };

