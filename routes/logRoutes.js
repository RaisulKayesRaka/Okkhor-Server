const express = require("express");
const router = express.Router();
const { getLogs } = require("../controllers/logController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

// Admin only route for logs
router.get("/logs", verifyToken, verifyAdmin, getLogs);

module.exports = router;
