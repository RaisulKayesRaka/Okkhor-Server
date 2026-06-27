const User = require("../models/User");
const Blog = require("../models/Blog");
const Review = require("../models/Review");
const Vote = require("../models/Vote");
const { addLog } = require("./logController");

const createUser = async (req, res) => {
  const user = req.body;
  const existingUser = await User.findOne({ email: user?.email });
  if (existingUser) {
    return res.send({ message: "User already exists", insertedId: null });
  }
  const newUser = new User({
    ...user,
    role: "user",
  });
  const result = await newUser.save();
  res.send({ insertedId: result._id, ...result._doc });
};

const getAllUsers = async (req, res) => {
  const result = await User.find();
  res.send(result);
};

const getUserByEmail = async (req, res) => {
  const email = req?.params?.email;
  const result = await User.findOne({ email });
  res.send(result);
};

const checkEmail = async (req, res) => {
  const email = req?.params?.email;
  const result = await User.findOne({ email });
  res.send({ exists: !!result });
};

const makeModerator = async (req, res) => {
  const id = req?.params?.id;
  const result = await User.updateOne({ _id: id }, { role: "moderator" });
  if (result.modifiedCount > 0) {
    await addLog("Make Moderator", `User ${id} was made moderator`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const makeAdmin = async (req, res) => {
  const id = req?.params?.id;
  const result = await User.updateOne({ _id: id }, { role: "admin" });
  if (result.modifiedCount > 0) {
    await addLog("Make Admin", `User ${id} was made admin`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const makeUser = async (req, res) => {
  const id = req?.params?.id;
  const result = await User.updateOne({ _id: id }, { role: "user" });
  if (result.modifiedCount > 0) {
    await addLog("Make User", `User ${id} was made user`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const updateUser = async (req, res) => {
  const email = req?.params?.email;
  const { name, photoUrl } = req.body;
  
  // Ensure the user can only update their own account
  if (req?.decoded?.email !== email) {
    return res.status(403).send({ message: "Forbidden access" });
  }

  const result = await User.updateOne(
    { email },
    { $set: { name, photoUrl } }
  );
  res.send(result);
};

const deleteUser = async (req, res) => {
  const email = req?.params?.email;
  
  // Ensure the user can only delete their own account
  if (req?.decoded?.email !== email) {
    return res.status(403).send({ message: "Forbidden access" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  const userId = user._id;

  // Cascade Deletes
  await Blog.deleteMany({ ownerId: userId });
  await Review.deleteMany({ reviewerId: userId });
  await Vote.deleteMany({ userId: userId });

  const result = await User.deleteOne({ email });
  await addLog("Delete Account", `User account ${email} was permanently deleted.`, email);

  res.send(result);
};

module.exports = {
  createUser,
  getAllUsers,
  getUserByEmail,
  checkEmail,
  makeModerator,
  makeAdmin,
  makeUser,
  updateUser,
  deleteUser,
};
