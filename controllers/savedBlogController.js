const SavedBlog = require("../models/SavedBlog");
const Blog = require("../models/Blog");

const saveBlog = async (req, res) => {
  const { userEmail, blogId } = req.body;
  if (!userEmail || !blogId) {
    return res.status(400).send({ message: "Missing userEmail or blogId" });
  }

  const existingSave = await SavedBlog.findOne({ userEmail, blogId });
  if (existingSave) {
    return res.send({ message: "Blog already saved", insertedId: null });
  }

  const newSavedBlog = new SavedBlog({ userEmail, blogId });
  const result = await newSavedBlog.save();
  res.send({ insertedId: result._id, ...result._doc });
};

const unsaveBlog = async (req, res) => {
  const { blogId } = req.params;
  const userEmail = req.query.email;

  if (!userEmail || !blogId) {
    return res.status(400).send({ message: "Missing email or blogId" });
  }

  const result = await SavedBlog.deleteOne({ userEmail, blogId });
  res.send(result);
};

const checkSavedStatus = async (req, res) => {
  const { blogId } = req.params;
  const userEmail = req.query.email;

  if (!userEmail) return res.send({ isSaved: false });

  const existingSave = await SavedBlog.findOne({ userEmail, blogId });
  res.send({ isSaved: !!existingSave });
};

const getSavedBlogs = async (req, res) => {
  const userEmail = req.query.email;
  if (!userEmail) {
    return res.status(400).send({ message: "Email is required" });
  }

  const savedBlogs = await SavedBlog.find({ userEmail })
    .populate("blogId")
    .sort({ savedAt: -1 });

  // Filter out any where blogId is null (in case the blog was deleted)
  const validSavedBlogs = savedBlogs.filter((sb) => sb.blogId != null);
  
  res.send(validSavedBlogs.map(sb => ({
    _id: sb._id,
    savedAt: sb.savedAt,
    ...sb.blogId._doc
  })));
};

module.exports = {
  saveBlog,
  unsaveBlog,
  checkSavedStatus,
  getSavedBlogs
};
