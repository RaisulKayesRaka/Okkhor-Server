const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  photoUrl: { type: String },
  role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("User", userSchema);
