const express = require("express");
const router = express.Router();
const { getLogs, getUserLogs } = require("../controllers/logController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/logs", verifyToken, verifyAdmin, getLogs);
router.get("/logs/user/:email", verifyToken, getUserLogs);

module.exports = router;
