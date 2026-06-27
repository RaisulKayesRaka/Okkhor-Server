const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { verifyToken, verifyModerator } = require("../middlewares/authMiddleware");

// Mount at / in index.js
router.post("/blogs", verifyToken, blogController.createBlog);
router.get("/all-blogs", verifyToken, blogController.getAllBlogs);
router.get("/queued-blogs", verifyToken, verifyModerator, blogController.getQueuedBlogs);
router.get("/accepted-blogs", blogController.getAcceptedBlogs);
router.get("/reported-blogs", verifyToken, verifyModerator, blogController.getReportedBlogs);
router.patch("/blogs/dismiss-report/:id", verifyToken, verifyModerator, blogController.dismissReport);
router.patch("/blogs/make-reported/:id", verifyToken, blogController.makeReported);
router.patch("/blogs/make-featured/:id", verifyToken, verifyModerator, blogController.makeFeatured);
router.patch("/blogs/remove-featured/:id", verifyToken, verifyModerator, blogController.removeFeatured);
router.patch("/blogs/make-accepted/:id", verifyToken, verifyModerator, blogController.makeAccepted);
router.patch("/blogs/make-rejected/:id", verifyToken, verifyModerator, blogController.makeRejected);
router.patch("/blogs/view/:id", blogController.viewBlog);

router.get("/blogs/is-upvoted/:id", blogController.isUpvoted);
router.put("/blogs/upvote/:id", verifyToken, blogController.upvote);
router.get("/blogs/is-downvoted/:id", blogController.isDownvoted);
router.put("/blogs/downvote/:id", verifyToken, blogController.downvote);

router.get("/featured-blogs", blogController.getFeaturedBlogs);
router.get("/trending-blogs", blogController.getTrendingBlogs);
router.get("/blogs-count", blogController.getBlogsCount);
router.get("/blogs/analytics/:email", verifyToken, blogController.getAuthorAnalytics);

router.get("/blogs/:id", blogController.getBlogById);
router.put("/blogs/:id", verifyToken, blogController.updateBlog);
router.delete("/blogs/:id", verifyToken, blogController.deleteBlog);

module.exports = router;
