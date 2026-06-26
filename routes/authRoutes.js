const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Mount at / in index.js for backwards compatibility, or mount at /auth
router.post("/jwt", authController.createToken);
router.get("/logout", authController.logout);

module.exports = router;
