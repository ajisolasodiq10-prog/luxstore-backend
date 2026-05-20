// models/user.js  —  The user "shape"
// This "model" tells MongoDB what a user data look like


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Step 1 — Define the shape (called a "schema")
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // can't be left blank
    trim: true, // removes extra spaces around the value
  },

  email: {
    type: String,
    required: true,
    unique: true, // no two users can share an email
    lowercase: true, // always saved as lowercase so "Jane@..." = "jane@..."
  },

  // We NEVER save the real password.
  // We save a "hash" — a scrambled version that can't be reversed.
  password: {
    type: String,
    required: true,
  },

  // role tells us if this user is a normal user or an admin.
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"], // only these three values are allowed
    default: "user", // new accounts are users by default
  },

  createdAt: {
    type: Date,
    default: Date.now, // automatically set to right now when created
  },
});


// This runs automatically BEFORE a user is saved to the database.
// If the password was changed, we hash it first.

userSchema.pre("save", async function (next) {
  // "this" = the user document being saved
  if (!this.isModified("password")) {
    return next();
  }

  // genSalt(10) creates a random "salt" — extra randomness added to the hash.
  const salt = await bcrypt.genSalt(10);

  // Hash the plain password using the salt
  this.password = await bcrypt.hash(this.password, salt);

  // next(); // continue saving
});

userSchema.methods.checkPassword = async function (typedPassword) {
  return bcrypt.compare(typedPassword, this.password);
  // returns true if they match, false if they don't
};

module.exports = mongoose.model("User", userSchema);
