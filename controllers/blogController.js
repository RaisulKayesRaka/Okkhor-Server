const Blog = require("../models/Blog");
const Vote = require("../models/Vote");
const User = require("../models/User");
const { addLog } = require("./logController");

const createBlog = async (req, res) => {
  const blogData = req.body;
  if (blogData.ownerEmail) {
    const user = await User.findOne({ email: blogData.ownerEmail });
    if (user) {
      blogData.ownerId = user._id;
    }
  }
  
  if (blogData.blogTags && Array.isArray(blogData.blogTags) && blogData.blogTags.length > 0 && typeof blogData.blogTags[0] === 'object') {
    blogData.blogTags = blogData.blogTags.map(tag => tag.text);
  }

  const newBlog = new Blog(blogData);
  const result = await newBlog.save();
  res.send({ insertedId: result._id, ...result._doc });
};

const getAllBlogs = async (req, res) => {
  const email = req?.query?.email;
  let query = {};
  if (email) {
    const user = await User.findOne({ email });
    if (user) {
      query.ownerId = user._id;
    }
  }
  const result = await Blog.find(query).sort({ date: -1 }).populate("ownerId", "name photoUrl email");
  res.send(result);
};

const getQueuedBlogs = async (req, res) => {
  const result = await Blog.aggregate([
    {
      $addFields: {
        statusOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$status", "Pending"] }, then: 0 },
              { case: { $eq: ["$status", "Accepted"] }, then: 1 },
              { case: { $eq: ["$status", "Rejected"] }, then: 2 },
            ],
            default: 3,
          },
        },
      },
    },
    { $sort: { statusOrder: 1, date: -1 } },
    { $project: { statusOrder: 0 } },
  ]);
  
  await Blog.populate(result, { path: "ownerId", select: "name photoUrl email" });
  res.send(result);
};

const getAcceptedBlogs = async (req, res) => {
  const email = req?.query?.email;
  const page = parseInt(req?.query?.page) || 0;
  const size = parseInt(req?.query?.size) || 10;
  const search = req?.query?.search;
  const sort = req?.query?.sort;

  let query = { status: "Accepted" };

  if (search) {
    query.blogTags = { $regex: search, $options: "i" };
  }

  if (email) {
    const user = await User.findOne({ email });
    if (user) query.ownerId = user._id;
  }

  const sortOption = sort === "newest" ? { date: -1 } : { date: 1 };

  const result = await Blog.find(query)
    .sort(sortOption)
    .skip(page * size)
    .limit(size)
    .populate("ownerId", "name photoUrl email");
    
  res.send(result);
};

const getReportedBlogs = async (req, res) => {
  const result = await Blog.find({ isReported: true }).sort({ date: -1 }).populate("ownerId", "name photoUrl email");
  res.send(result);
};

const dismissReport = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { isReported: false } });
  res.send(result);
};

const makeReported = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { isReported: true } });
  res.send(result);
};

const makeFeatured = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { type: "Featured", status: "Accepted" } });
  if (result.modifiedCount > 0) {
    await addLog("Feature Blog", `Blog ${id} was featured`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const removeFeatured = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { type: "Normal" } });
  res.send(result);
};

const makeAccepted = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { status: "Accepted" } });
  if (result.modifiedCount > 0) {
    await addLog("Approve Blog", `Blog ${id} was approved`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const makeRejected = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.updateOne({ _id: id }, { $set: { status: "Rejected", type: "Normal" } });
  if (result.modifiedCount > 0) {
    await addLog("Reject Blog", `Blog ${id} was rejected`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const isUpvoted = async (req, res) => {
  const id = req?.params?.id;
  const email = req?.query?.email;
  const user = await User.findOne({ email });
  if(!user) return res.send(false);
  
  const result = await Vote.findOne({ blogId: id, userId: user._id, type: "upvote" });
  res.send(!!result);
};

const upvote = async (req, res) => {
  const id = req?.params?.id;
  const email = req?.query?.email;
  const user = await User.findOne({ email });
  if(!user) return res.status(400).send({ message: "User not found" });

  const existingVote = await Vote.findOne({ blogId: id, userId: user._id });

  if (existingVote) {
    if (existingVote.type === "upvote") {
      await Vote.deleteOne({ _id: existingVote._id });
      await Blog.updateOne({ _id: id }, { $inc: { upvotes: -1 } });
    } else {
      await Vote.updateOne({ _id: existingVote._id }, { type: "upvote" });
      await Blog.updateOne({ _id: id }, { $inc: { upvotes: 1, downvotes: -1 } });
    }
  } else {
    await Vote.create({ blogId: id, userId: user._id, type: "upvote" });
    await Blog.updateOne({ _id: id }, { $inc: { upvotes: 1 } });
  }

  res.send({ success: true });
};

const isDownvoted = async (req, res) => {
  const id = req?.params?.id;
  const email = req?.query?.email;
  const user = await User.findOne({ email });
  if(!user) return res.send(false);
  
  const result = await Vote.findOne({ blogId: id, userId: user._id, type: "downvote" });
  res.send(!!result);
};

const downvote = async (req, res) => {
  const id = req?.params?.id;
  const email = req?.query?.email;
  const user = await User.findOne({ email });
  if(!user) return res.status(400).send({ message: "User not found" });

  const existingVote = await Vote.findOne({ blogId: id, userId: user._id });

  if (existingVote) {
    if (existingVote.type === "downvote") {
      await Vote.deleteOne({ _id: existingVote._id });
      await Blog.updateOne({ _id: id }, { $inc: { downvotes: -1 } });
    } else {
      await Vote.updateOne({ _id: existingVote._id }, { type: "downvote" });
      await Blog.updateOne({ _id: id }, { $inc: { downvotes: 1, upvotes: -1 } });
    }
  } else {
    await Vote.create({ blogId: id, userId: user._id, type: "downvote" });
    await Blog.updateOne({ _id: id }, { $inc: { downvotes: 1 } });
  }

  res.send({ success: true });
};

const getFeaturedBlogs = async (req, res) => {
  const result = await Blog.find({ type: "Featured", status: "Accepted" }).sort({ date: -1 }).populate("ownerId", "name photoUrl email");
  res.send(result);
};

const getTrendingBlogs = async (req, res) => {
  const result = await Blog.find({ status: "Accepted" })
    .sort({ upvotes: -1, downvotes: 1 })
    .limit(6)
    .populate("ownerId", "name photoUrl email");
  res.send(result);
};

const getBlogById = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.findOne({ _id: id }).populate("ownerId", "name photoUrl email");
  res.send(result);
};

const updateBlog = async (req, res) => {
  const id = req?.params?.id;
  const blogData = req?.body;
  
  if (blogData.blogTags && Array.isArray(blogData.blogTags) && blogData.blogTags.length > 0 && typeof blogData.blogTags[0] === 'object') {
    blogData.blogTags = blogData.blogTags.map(tag => tag.text);
  }
  
  const result = await Blog.updateOne({ _id: id }, { $set: blogData }, { upsert: true });
  res.send(result);
};

const deleteBlog = async (req, res) => {
  const id = req?.params?.id;
  const result = await Blog.deleteOne({ _id: id });
  if (result.deletedCount > 0) {
    await addLog("Delete Blog", `Blog ${id} was deleted`, req?.decoded?.email || "Unknown");
    // Also delete associated reviews and votes
    const Review = require("../models/Review");
    await Review.deleteMany({ blogId: id });
    await Vote.deleteMany({ blogId: id });
  }
  res.send(result);
};

const getBlogsCount = async (req, res) => {
  const search = req?.query?.search;
  const status = req?.query?.status;
  
  let query = {};
  if (status) query.status = status;
  if (search) query.blogTags = { $regex: search, $options: "i" };

  const count = await Blog.countDocuments(query);
  res.send({ count });
};

const getAuthorAnalytics = async (req, res) => {
  const email = req?.params?.email;
  const user = await User.findOne({ email });
  if(!user) return res.status(404).send({ message: "User not found" });

  const blogs = await Blog.find({ ownerId: user._id });
  
  const totalBlogs = blogs.length;
  const totalUpvotes = blogs.reduce((sum, blog) => sum + (blog.upvotes || 0), 0);
  const totalDownvotes = blogs.reduce((sum, blog) => sum + (blog.downvotes || 0), 0);
  
  const statusCounts = blogs.reduce((acc, blog) => {
    const status = blog.status || "Pending";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  res.send({ totalBlogs, totalUpvotes, totalDownvotes, statusCounts });
};

module.exports = {
  createBlog,
  getAllBlogs,
  getQueuedBlogs,
  getAcceptedBlogs,
  getReportedBlogs,
  dismissReport,
  makeReported,
  makeFeatured,
  removeFeatured,
  makeAccepted,
  makeRejected,
  isUpvoted,
  upvote,
  isDownvoted,
  downvote,
  getFeaturedBlogs,
  getTrendingBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsCount,
  getAuthorAnalytics,
};
