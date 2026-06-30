const Review = require("../models/Review");
const User = require("../models/User");

const createReview = async (req, res) => {
  const reviewData = req.body;
  // reviewData might contain reviewerEmail from frontend, convert to reviewerId
  if (reviewData.reviewerEmail) {
    const user = await User.findOne({ email: reviewData.reviewerEmail });
    if (user) {
      reviewData.reviewerId = user._id;
    }
    delete reviewData.reviewerEmail;
    delete reviewData.reviewerName;
    delete reviewData.reviewerImage;
  }
  
  const newReview = new Review(reviewData);
  const result = await newReview.save();
  res.send({ insertedId: result._id, ...result._doc });
};

const getReviewsByBlogId = async (req, res) => {
  const id = req?.params?.id;
  const result = await Review.find({ blogId: id })
    .sort({ createdAt: -1 })
    .populate("reviewerId", "name photoUrl email");
    
  // Map populated data back to what frontend expects if needed, or update frontend to use reviewerId.name
  const formattedResult = result.map(review => ({
    ...review._doc,
    reviewerName: review.reviewerId?.name,
    reviewerImage: review.reviewerId?.photoUrl,
    reviewerEmail: review.reviewerId?.email,
  }));
  
  res.send(formattedResult);
};

const deleteReview = async (req, res) => {
  const id = req?.params?.id;
  const result = await Review.deleteOne({ _id: id });
  res.send(result);
};

const updateReview = async (req, res) => {
  const id = req?.params?.id;
  const review = req.body;
  const result = await Review.updateOne({ _id: id }, { $set: review });
  res.send(result);
};

module.exports = {
  createReview,
  getReviewsByBlogId,
  deleteReview,
  updateReview,
};
