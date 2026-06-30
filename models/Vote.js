const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["upvote", "downvote"], required: true },
}, { versionKey: false, timestamps: true });

// Ensure a user can only vote (either up or down) once per blog
voteSchema.index({ blogId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
