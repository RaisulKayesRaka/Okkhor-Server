const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  blogName: { type: String, required: true },
  blogImage: { type: String },
  blogDescription: { type: String, required: true },
  blogTags: [{ type: String }],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
  type: { type: String, enum: ["Normal", "Featured"], default: "Normal" },
  isReported: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("Blog", blogSchema);
