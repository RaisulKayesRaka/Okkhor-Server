const SavedBlog = require("../models/SavedBlog");
const Blog = require("../models/Blog");

const saveBlog = async (req, res) => {
  const { userId, blogId } = req.body;
  if (!userId || !blogId) {
    return res.status(400).send({ message: "Missing userId or blogId" });
  }

  const existingSave = await SavedBlog.findOne({ userId, blogId });
  if (existingSave) {
    return res.send({ message: "Blog already saved", insertedId: null });
  }

  const newSavedBlog = new SavedBlog({ userId, blogId });
  const result = await newSavedBlog.save();
  res.send({ insertedId: result._id, ...result._doc });
};

const unsaveBlog = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.query.userId;

  if (!userId || !blogId) {
    return res.status(400).send({ message: "Missing userId or blogId" });
  }

  const result = await SavedBlog.deleteOne({ userId, blogId });
  res.send(result);
};

const checkSavedStatus = async (req, res) => {
  const { blogId } = req.params;
  const userId = req.query.userId;

  if (!userId) return res.send({ isSaved: false });

  const existingSave = await SavedBlog.findOne({ userId, blogId });
  res.send({ isSaved: !!existingSave });
};

const getSavedBlogs = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).send({ message: "userId is required" });
  }

  const savedBlogs = await SavedBlog.find({ userId })
    .populate("blogId")
    .sort({ createdAt: -1 });

  // Filter out any where blogId is null (in case the blog was deleted)
  const validSavedBlogs = savedBlogs.filter((sb) => sb.blogId != null);
  
  res.send(validSavedBlogs.map(sb => ({
    _id: sb._id,
    savedAt: sb.createdAt,
    ...sb.blogId._doc
  })));
};

module.exports = {
  saveBlog,
  unsaveBlog,
  checkSavedStatus,
  getSavedBlogs
};
