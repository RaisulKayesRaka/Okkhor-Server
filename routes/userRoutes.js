const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, verifyAdmin } = require("../middlewares/authMiddleware");

// Mount at / in index.js
router.post("/users", userController.createUser);
router.get("/users", verifyToken, verifyAdmin, userController.getAllUsers);
router.get("/users/:email", verifyToken, userController.getUserByEmail);
router.patch("/users/make-moderator/:id", verifyToken, verifyAdmin, userController.makeModerator);
router.patch("/users/make-admin/:id", verifyToken, verifyAdmin, userController.makeAdmin);
router.patch("/users/make-user/:id", verifyToken, verifyAdmin, userController.makeUser);

module.exports = router;
