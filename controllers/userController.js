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

const getPublicUserById = async (req, res) => {
  const id = req?.params?.id;
  const viewerEmail = req?.query?.viewerEmail;
  try {
    const result = await User.findById(id).select("name email photoUrl createdAt followers following");
    if (!result) return res.status(404).send({ message: "User not found" });

    let isFollowing = false;
    if (viewerEmail) {
      const viewer = await User.findOne({ email: viewerEmail });
      if (viewer && result.followers && result.followers.includes(viewer._id)) {
        isFollowing = true;
      }
    }

    res.send({
      _id: result._id,
      name: result.name,
      email: result.email,
      photoUrl: result.photoUrl,
      createdAt: result.createdAt,
      followersCount: result.followers?.length || 0,
      followingCount: result.following?.length || 0,
      isFollowing
    });
  } catch (err) {
    res.status(400).send({ message: "Invalid ID" });
  }
};

const toggleFollow = async (req, res) => {
  const targetId = req?.params?.id;
  const followerEmail = req?.decoded?.email;
  
  if (!followerEmail) return res.status(401).send({ message: "Unauthorized" });

  try {
    const follower = await User.findOne({ email: followerEmail });
    if (!follower) return res.status(404).send({ message: "Follower not found" });

    if (follower._id.toString() === targetId) {
      return res.status(400).send({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).send({ message: "Target user not found" });

    const isFollowing = targetUser.followers && targetUser.followers.includes(follower._id);

    if (isFollowing) {
      // Unfollow
      await User.updateOne({ _id: targetId }, { $pull: { followers: follower._id } });
      await User.updateOne({ _id: follower._id }, { $pull: { following: targetId } });
      res.send({ message: "Unfollowed successfully", isFollowing: false });
    } else {
      // Follow
      await User.updateOne({ _id: targetId }, { $addToSet: { followers: follower._id } });
      await User.updateOne({ _id: follower._id }, { $addToSet: { following: targetId } });
      res.send({ message: "Followed successfully", isFollowing: true });
    }
  } catch (error) {
    res.status(500).send({ message: "Error toggling follow status", error: error.message });
  }
};

const getFollowers = async (req, res) => {
  const id = req?.params?.id;
  const viewerEmail = req?.query?.viewerEmail;

  try {
    const user = await User.findById(id).populate("followers", "name email photoUrl");
    if (!user) return res.status(404).send({ message: "User not found" });

    let viewer = null;
    if (viewerEmail) {
      viewer = await User.findOne({ email: viewerEmail });
    }

    const followers = user.followers.map(follower => {
      let isFollowing = false;
      if (viewer && viewer.following && viewer.following.includes(follower._id)) {
        isFollowing = true;
      }
      return {
        _id: follower._id,
        name: follower.name,
        email: follower.email,
        photoUrl: follower.photoUrl,
        isFollowing
      };
    });

    res.send(followers);
  } catch (err) {
    res.status(400).send({ message: "Invalid ID", error: err.message });
  }
};

const getFollowing = async (req, res) => {
  const id = req?.params?.id;
  const viewerEmail = req?.query?.viewerEmail;

  try {
    const user = await User.findById(id).populate("following", "name email photoUrl");
    if (!user) return res.status(404).send({ message: "User not found" });

    let viewer = null;
    if (viewerEmail) {
      viewer = await User.findOne({ email: viewerEmail });
    }

    const followingList = user.following.map(followee => {
      let isFollowing = false;
      if (viewer && viewer.following && viewer.following.includes(followee._id)) {
        isFollowing = true;
      }
      return {
        _id: followee._id,
        name: followee.name,
        email: followee.email,
        photoUrl: followee.photoUrl,
        isFollowing
      };
    });

    res.send(followingList);
  } catch (err) {
    res.status(400).send({ message: "Invalid ID", error: err.message });
  }
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
  getPublicUserById,
  makeModerator,
  makeAdmin,
  makeUser,
  updateUser,
  deleteUser,
  toggleFollow,
  getFollowers,
  getFollowing,
};
