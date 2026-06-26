const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Mount at / in index.js
router.post("/reviews", verifyToken, reviewController.createReview);
router.get("/reviews/:id", verifyToken, reviewController.getReviewsByBlogId);
router.delete("/reviews/:id", verifyToken, reviewController.deleteReview);
router.patch("/reviews/:id", verifyToken, reviewController.updateReview);

module.exports = router;
