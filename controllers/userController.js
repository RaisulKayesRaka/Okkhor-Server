const { ObjectId } = require("mongodb");
const { getUsersCollection } = require("../config/db");
const { addLog } = require("./logController");

const createUser = async (req, res) => {
  const usersCollection = getUsersCollection();
  const user = req.body;
  const query = { email: user?.email };
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "User already exists", insertedId: null });
  }
  const result = await usersCollection.insertOne({
    ...user,
    role: "user",
  });
  res.send(result);
};

const getAllUsers = async (req, res) => {
  const usersCollection = getUsersCollection();
  const result = await usersCollection.find().toArray();
  res.send(result);
};

const getUserByEmail = async (req, res) => {
  const usersCollection = getUsersCollection();
  const email = req?.params?.email;
  const query = { email: email };
  const result = await usersCollection.findOne(query);
  res.send(result);
};

const makeModerator = async (req, res) => {
  const usersCollection = getUsersCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { role: "moderator" } };
  const result = await usersCollection.updateOne(filter, updateDoc);
  if (result.modifiedCount > 0) {
    await addLog("Make Moderator", `User ${id} was made moderator`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const makeAdmin = async (req, res) => {
  const usersCollection = getUsersCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { role: "admin" } };
  const result = await usersCollection.updateOne(filter, updateDoc);
  if (result.modifiedCount > 0) {
    await addLog("Make Admin", `User ${id} was made admin`, req?.decoded?.email || "Unknown");
  }
  res.send(result);
};

const makeUser = async (req, res) => {
  const usersCollection = getUsersCollection();
  const id = req?.params?.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = { $set: { role: "user" } };
  const result = await usersCollection.updateOne(filter, updateDoc);
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
