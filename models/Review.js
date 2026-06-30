const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  review: { type: String, required: true },
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
