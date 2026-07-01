const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String, required: true },
  type: { type: String, enum: ['system', 'user'], default: 'system' },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("Log", logSchema);
