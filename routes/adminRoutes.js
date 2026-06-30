const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/admin/analytics", verifyToken, verifyAdmin, adminController.getPlatformAnalytics);

module.exports = router;
