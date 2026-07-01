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
  if (req?.decoded?.email) {
    const { addLog } = require("./logController");
    await addLog("Comment", `You commented on a blog`, req.decoded.email, 'user');
  }
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
  
  const review = await Review.findById(id);
  if (!review) {
    return res.send({ deletedCount: 0 });
  }

  // Get all reviews for this blog to efficiently find all nested descendants in memory
  const allReviews = await Review.find({ blogId: review.blogId });
  const idsToDelete = [id];
  
  const findChildren = (parentId) => {
    const children = allReviews.filter(r => r.parentId?.toString() === parentId.toString());
    children.forEach(child => {
      idsToDelete.push(child._id.toString());
      findChildren(child._id);
    });
  };
  
  findChildren(id);
  
  const result = await Review.deleteMany({ _id: { $in: idsToDelete } });
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
