const { ObjectId } = require("mongodb");
const { getReviewsCollection } = require("../config/db");

const createReview = async (req, res) => {
  const reviewsCollection = getReviewsCollection();
  const review = req.body;
  const result = await reviewsCollection.insertOne(review);
  res.send(result);
};

const getReviewsByBlogId = async (req, res) => {
  const reviewsCollection = getReviewsCollection();
  const id = req?.params?.id;
  const query = { blogId: id };
  const result = await reviewsCollection
    .find(query)
    .sort({ reviewDate: -1 })
    .toArray();
  res.send(result);
};

const deleteReview = async (req, res) => {
  const reviewsCollection = getReviewsCollection();
  const id = req?.params?.id;
  const query = { _id: new ObjectId(id) };
  const result = await reviewsCollection.deleteOne(query);
  res.send(result);
};

const updateReview = async (req, res) => {
  const reviewsCollection = getReviewsCollection();
  const id = req?.params?.id;
  const review = req.body;
  const query = { _id: new ObjectId(id) };
  const updateDoc = { $set: review };
  const result = await reviewsCollection.updateOne(query, updateDoc);
  res.send(result);
};

module.exports = {
  createReview,
  getReviewsByBlogId,
  deleteReview,
  updateReview,
};
