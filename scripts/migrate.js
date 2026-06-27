require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Blog = require("../models/Blog");
const Vote = require("../models/Vote");
const Review = require("../models/Review");

const migrate = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/OkkhorDB";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB for migration");
    const db = mongoose.connection.db;

    // We don't migrate Users because they are mostly okay, just need to make sure they match Schema (they probably do, or Mongoose will enforce it on next save).
    // Let's migrate Blogs: replace ownerEmail with ownerId, map blogTags to array of strings
    const blogsCollection = db.collection("blogs");
    const blogs = await blogsCollection.find({}).toArray();

    console.log(`Migrating ${blogs.length} blogs...`);
    for (const blogData of blogs) {
      if (blogData.ownerEmail && !blogData.ownerId) {
        const user = await User.findOne({ email: blogData.ownerEmail });
        if (user) {
          blogData.ownerId = user._id;
        } else {
          console.warn(`User not found for email ${blogData.ownerEmail}, skipping blog ${blogData._id}`);
        }
      }
      
      if (blogData.blogTags && Array.isArray(blogData.blogTags) && blogData.blogTags.length > 0 && typeof blogData.blogTags[0] === 'object') {
        blogData.blogTags = blogData.blogTags.map(tag => tag.text || tag.id);
      }

      await blogsCollection.updateOne(
        { _id: blogData._id },
        { $set: { ownerId: blogData.ownerId, blogTags: blogData.blogTags } }
      );
    }

    // Migrate Reviews: map reviewerEmail to reviewerId
    const reviewsCollection = db.collection("reviews");
    const reviews = await reviewsCollection.find({}).toArray();
    
    console.log(`Migrating ${reviews.length} reviews...`);
    for (const reviewData of reviews) {
      if (reviewData.reviewerEmail && !reviewData.reviewerId) {
        const user = await User.findOne({ email: reviewData.reviewerEmail });
        if (user) {
          reviewData.reviewerId = user._id;
          await reviewsCollection.updateOne(
            { _id: reviewData._id },
            { $set: { reviewerId: user._id } }
          );
        }
      }
    }

    // Migrate Upvotes
    const upvotesCollection = db.collection("upvotes");
    const upvotes = await upvotesCollection.find({}).toArray();
    console.log(`Migrating ${upvotes.length} upvotes...`);
    for (const upvote of upvotes) {
      const user = await User.findOne({ email: upvote.email });
      if (user) {
        try {
          await Vote.updateOne(
            { blogId: upvote.blogId, userId: user._id },
            { $set: { type: "upvote" } },
            { upsert: true }
          );
        } catch (e) {
          console.warn("Could not insert upvote", e.message);
        }
      }
    }

    // Migrate Downvotes
    const downvotesCollection = db.collection("downvotes");
    const downvotes = await downvotesCollection.find({}).toArray();
    console.log(`Migrating ${downvotes.length} downvotes...`);
    for (const downvote of downvotes) {
      const user = await User.findOne({ email: downvote.email });
      if (user) {
        try {
          // If they already upvoted, we overwrite it with downvote (to enforce our single vote logic if they had both)
          await Vote.updateOne(
            { blogId: downvote.blogId, userId: user._id },
            { $set: { type: "downvote" } },
            { upsert: true }
          );
        } catch (e) {
          console.warn("Could not insert downvote", e.message);
        }
      }
    }

    // Clean up old collections
    try {
      await db.dropCollection("upvotes");
      await db.dropCollection("downvotes");
      console.log("Dropped old upvotes and downvotes collections");
    } catch (e) {
      console.log("Collections already dropped or don't exist");
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
