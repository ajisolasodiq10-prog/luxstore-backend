const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../models/user");


const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All field are required." });
  }
  
  if (name.trim().length < 3) {
      return res
      .status(400)
      .json({ message: "Name must be at least 2 characters." });
    }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res
      .status(400)
      .json({ message: "Please enter a valid email address." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with that email already exists." });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, rounds);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Return success — don't send back the password (even hashed)
    return res.status(201).json({
      message: "Account created successfully! You can now log in.",
      newUser: {
        id:    newUser._id,
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role,
      }
    });
    
   
  } catch (error) {
    console.error("registerUser error:", error.message);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
      
  }
};


const loginUser = async (req, res) => {
  console.log('loginUser body:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.log('loginUser missing credentials');
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Find the user by email
    // We need the password field for comparison — it's excluded by default
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    console.log('loginUser found user:', !!existingUser, email.toLowerCase());

    if (!existingUser) {
      // Don't say "email not found" — that would tell attackers which emails exist
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // Compare what the user typed with the stored hash
    const passwordMatches = await existingUser.checkPassword(password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // Creates a JWT that contains the user's ID and role
function makeToken(existingUser) {
  return jwt.sign(
    { id: existingUser._id, role: existingUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

    // Passwords match — create a token for this user
    const token = makeToken(existingUser);

    res.status(200).json({
      message: "Logged in successfully!",
       token,   // the frontend stores this and sends it with future requests
      user: {
        id:    existingUser._id,
        name:  existingUser.name,
        email: existingUser.email,
        role:  existingUser.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Something went wrong. Please try again." });
  }
};

//middleware testing in postman
//----------------------------------
// const getMe = async (req, res) => {
//   // req.user is already attached by the protect middleware
//   // so you don't need to query the database again
//   return res.status(200).json({
//     user: req.user
//   });
// };
// const adminTest = async (req, res) => {
//   // req.user is already attached by the protect middleware
//   // so you don't need to query the database again
//   return res.status(200).json({
//     message:"you're an admin"
//   });
// };// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select("password");
    if (!me) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({
      user: {
        id:        me._id,
        name:      me.name,
        email:     me.email,
        role:      me.role,
        createdAt: me.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Could not get user." });
  }
};

// GET /api/auth/users — admin + superadmin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (error) {
    console.error("getAllUsers error:", error.message);
    return res.status(500).json({ error: "Could not get users." });
  }
};

// PUT /api/auth/users/:id/role — superadmin only
const changeUserRole = async (req, res) => {
  try {
    const role = req.body.role && String(req.body.role).toLowerCase().trim();

    const allowed = ["user", "admin"];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'." });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({ error: "Cannot change a superadmin's role." });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: `User role updated to "${role}".`,
      user,
    });
  } catch (error) {
    console.error("changeUserRole error:", error.message);
    return res.status(500).json({ error: "Could not change role." });
  }
};

module.exports = { registerUser, loginUser, getMe, getAllUsers, changeUserRole };




// module.exports = { registerUser, loginUser,   };