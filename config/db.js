const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let usersCollection;
let blogsCollection;
let reviewsCollection;
let upvotesCollection;
let downvotesCollection;
let logsCollection;

async function connectDB() {
  // await client.connect();
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
  db = client.db("OkkhorDB");
  usersCollection = db.collection("users");
  blogsCollection = db.collection("blogs");
  reviewsCollection = db.collection("reviews");
  upvotesCollection = db.collection("upvotes");
  downvotesCollection = db.collection("downvotes");
  logsCollection = db.collection("logs");
}

module.exports = {
  connectDB,
  client,
  getUsersCollection: () => usersCollection,
  getBlogsCollection: () => blogsCollection,
  getReviewsCollection: () => reviewsCollection,
  getUpvotesCollection: () => upvotesCollection,
  getDownvotesCollection: () => downvotesCollection,
  getLogsCollection: () => logsCollection,
};
