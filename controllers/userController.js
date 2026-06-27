const User = require("../models/User");
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

module.exports = {
  createUser,
  getAllUsers,
  getUserByEmail,
  makeModerator,
  makeAdmin,
  makeUser,
};
