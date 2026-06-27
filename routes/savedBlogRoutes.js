const express = require("express");
const router = express.Router();
const {
  saveBlog,
  unsaveBlog,
  checkSavedStatus,
  getSavedBlogs
} = require("../controllers/savedBlogController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/saved-blogs", verifyToken, saveBlog);
router.delete("/saved-blogs/:blogId", verifyToken, unsaveBlog);
router.get("/saved-blogs/check/:blogId", verifyToken, checkSavedStatus);
router.get("/saved-blogs", verifyToken, getSavedBlogs);

module.exports = router;
