const { ObjectId } = require("mongodb");
const { getBlogsCollection, getUpvotesCollection, getDownvotesCollection } = require("../config/db");

const createBlog = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const blog = req.body;
  const result = await blogsCollection.insertOne(blog);
  res.send(result);
};

const getAllBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const email = req?.query?.email;
  let query = {};
  if (email) {
    query = { ...query, ownerEmail: email };
  }
  const result = await blogsCollection.find(query).sort({ date: -1 }).toArray();
  res.send(result);
};

const getQueuedBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const result = await blogsCollection
    .aggregate([
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
    ])
    .toArray();
  res.send(result);
};

const getAcceptedBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const email = req?.query?.email;
  const page = parseInt(req?.query?.page) || 0;
  const size = parseInt(req?.query?.size) || 10;
  const search = req?.query?.search;
  const sort = req?.query?.sort;

  let query = { status: "Accepted" };

  if (search) {
    query.blogTags = {
      $elemMatch: {
        text: { $regex: search, $options: "i" },
      },
    };
  }

  if (email) {
    query = { ...query, ownerEmail: email };
  }

  let result = [];
  if (sort === "newest") {
    result = await blogsCollection
      .find(query)
      .sort({ date: -1 })
      .skip(page * size)
      .limit(size)
      .toArray();
  } else {
    result = await blogsCollection
      .find(query)
      .sort({ date: 1 })
      .skip(page * size)
      .limit(size)
      .toArray();
  }
  res.send(result);
};

const getReportedBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  let query = { isReported: true };
  const result = await blogsCollection.find(query).sort({ date: -1 }).toArray();
  res.send(result);
};

const dismissReport = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { isReported: false } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const makeReported = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { isReported: true } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const makeFeatured = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { type: "Featured", status: "Accepted" } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const removeFeatured = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { type: "Normal" } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const makeAccepted = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { status: "Accepted" } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const makeRejected = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { status: "Rejected", type: "Normal" } };
  const result = await blogsCollection.updateOne(filter, updateDoc);
  res.send(result);
};

const isUpvoted = async (req, res) => {
  const upvotesCollection = getUpvotesCollection();
  const id = req?.params?.id;
  const email = req?.query?.email;
  const query = { blogId: new ObjectId(id), email: email };
  const result = await upvotesCollection.findOne(query);
  res.send(result?._id ? true : false);
};

const upvote = async (req, res) => {
  const upvotesCollection = getUpvotesCollection();
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const email = req?.query?.email;
  const query = { blogId: new ObjectId(id), email };

  const isUpvotedObj = await upvotesCollection.findOne(query);

  if (!isUpvotedObj) {
    await upvotesCollection.insertOne({
      email,
      blogId: new ObjectId(id),
    });
  } else {
    await upvotesCollection.deleteOne(query);
  }

  const updateDoc = isUpvotedObj
    ? { $inc: { upvotes: -1 } }
    : { $inc: { upvotes: 1 } };

  const result = await blogsCollection.updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  res.send(result);
};

const isDownvoted = async (req, res) => {
  const downvotesCollection = getDownvotesCollection();
  const id = req?.params?.id;
  const email = req?.query?.email;
  const query = { blogId: new ObjectId(id), email: email };
  const result = await downvotesCollection.findOne(query);
  res.send(result?._id ? true : false);
};

const downvote = async (req, res) => {
  const downvotesCollection = getDownvotesCollection();
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const email = req?.query?.email;
  const query = { blogId: new ObjectId(id), email };

  const isDownvotedObj = await downvotesCollection.findOne(query);

  if (!isDownvotedObj) {
    await downvotesCollection.insertOne({
      email,
      blogId: new ObjectId(id),
    });
  } else {
    await downvotesCollection.deleteOne(query);
  }

  const updateDoc = isDownvotedObj
    ? { $inc: { downvotes: -1 } }
    : { $inc: { downvotes: 1 } };

  const result = await blogsCollection.updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  res.send(result);
};

const getFeaturedBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const query = { type: "Featured", status: "Accepted" };
  const result = await blogsCollection.find(query).sort({ date: -1 }).toArray();
  res.send(result);
};

const getTrendingBlogs = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const query = { status: "Accepted" };
  const result = await blogsCollection
    .find(query)
    .sort({ upvotes: -1, downvotes: 1 })
    .limit(6)
    .toArray();
  res.send(result);
};

const getBlogById = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogsCollection.findOne(query);
  res.send(result);
};

const updateBlog = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const blog = req?.body;
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = { $set: blog };
  const result = await blogsCollection.updateOne(query, updateDoc, options);
  res.send(result);
};

const deleteBlog = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const id = req?.params?.id;
  const query = { _id: new ObjectId(id) };
  const result = await blogsCollection.deleteOne(query);
  res.send(result);
};

const getBlogsCount = async (req, res) => {
  const blogsCollection = getBlogsCollection();
  const count = await blogsCollection.estimatedDocumentCount();
  res.send({ count });
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
};
