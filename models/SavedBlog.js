const mongoose = require("mongoose");

const savedBlogSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("SavedBlog", savedBlogSchema);
