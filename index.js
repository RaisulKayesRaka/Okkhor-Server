require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const port = process.env.PORT || 5000;
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Okkhor");
});
async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
    const database = client.db("OkkhorDB");
    const usersCollection = database.collection("users");
    const blogsCollection = database.collection("blogs");
    const reviewsCollection = database.collection("reviews");
    const upvotesCollection = database.collection("upvotes");
    const downvotesCollection = database.collection("downvotes");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // verify jwt
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden" });
      }
      next();
    };

    // verify moderator
    const verifyModerator = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isModerator = user?.role === "moderator";
      const isAdmin = user?.role === "admin";
      if (!isModerator && !isAdmin) {
        return res.status(403).send({ message: "Forbidden" });
      }
      next();
    };

    app.get("/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/users", async (req, res) => {
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
    });

    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:email", verifyToken, async (req, res) => {
      const email = req?.params?.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.patch(
      "/users/make-moderator/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { role: "moderator" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch(
      "/users/make-admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { role: "admin" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch(
      "/users/make-user/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { role: "user" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.post("/blogs", verifyToken, async (req, res) => {
      const blog = req.body;
      const result = await blogsCollection.insertOne(blog);
      res.send(result);
    });

    app.get("/all-blogs", verifyToken, async (req, res) => {
      const email = req?.query?.email;

      let query = {};

      if (email) {
        query = { ...query, ownerEmail: email };
      }

      const result = await blogsCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/queued-blogs", verifyToken, verifyModerator, async (req, res) => {
      const result = await blogsCollection
        .aggregate([
          {
            $addFields: {
              statusOrder: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$status", "Pending"] }, then: 0 },
                    { case: { $eq: ["$status", "Accepted"] }, then: 1 },
                    { case: { $eq: ["$status", "Rejected"] }, then: 2 },
                  ],
                  default: 3,
                },
              },
            },
          },
          { $sort: { statusOrder: 1, date: -1 } },
          { $project: { statusOrder: 0 } },
        ])
        .toArray();
      res.send(result);
    });

    app.get("/accepted-blogs", async (req, res) => {
      const email = req?.query?.email;
      const page = parseInt(req?.query?.page);
      const size = parseInt(req?.query?.size);
      const search = req?.query?.search;
      const sort = req?.query?.sort;

      let query = { status: "Accepted" };

      if (search) {
        query.blogTags = {
          $elemMatch: {
            text: { $regex: search, $options: "i" },
          },
        };
      }

      if (email) {
        query = { ...query, ownerEmail: email };
      }

      let result = [];

      if (sort === "newest") {
        result = await blogsCollection
          .find(query)
          .sort({ date: -1 })
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        result = await blogsCollection
          .find(query)
          .sort({ date: 1 })
          .skip(page * size)
          .limit(size)
          .toArray();
      }
      res.send(result);
    });

    app.get(
      "/reported-blogs",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        let query = { isReported: true };

        const result = await blogsCollection
          .find(query)
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      },
    );

    app.patch(
      "/blogs/dismiss-report/:id",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { isReported: false } };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch("/blogs/make-reported/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { isReported: true } };
      const result = await blogsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch(
      "/blogs/make-featured/:id",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { type: "Featured", status: "Accepted" } };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch(
      "/blogs/remove-featured/:id",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { type: "Normal" } };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch(
      "/blogs/make-accepted/:id",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status: "Accepted" } };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.patch(
      "/blogs/make-rejected/:id",
      verifyToken,
      verifyModerator,
      async (req, res) => {
        const id = req?.params?.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status: "Rejected", type: "Normal" } };
        const result = await blogsCollection.updateOne(filter, updateDoc);
        res.send(result);
      },
    );

    app.get("/blogs/is-upvoted/:id", async (req, res) => {
      const id = req?.params?.id;
      const email = req?.query?.email;
      const query = { blogId: new ObjectId(id), email: email };
      const result = await upvotesCollection.findOne(query);
      res.send(result?._id ? true : false);
    });

    app.put("/blogs/upvote/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const email = req?.query?.email;
      const query = { blogId: new ObjectId(id), email };

      const isUpvoted = await upvotesCollection.findOne(query);

      if (!isUpvoted) {
        await upvotesCollection.insertOne({
          email,
          blogId: new ObjectId(id),
        });
      } else {
        await upvotesCollection.deleteOne(query);
      }

      const updateDoc = isUpvoted
        ? { $inc: { upvotes: -1 } }
        : { $inc: { upvotes: 1 } };

      const result = await blogsCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
      );

      res.send(result);
    });

    app.get("/blogs/is-downvoted/:id", async (req, res) => {
      const id = req?.params?.id;
      const email = req?.query?.email;
      const query = { blogId: new ObjectId(id), email: email };
      const result = await downvotesCollection.findOne(query);
      res.send(result?._id ? true : false);
    });

    app.put("/blogs/downvote/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const email = req?.query?.email;
      const query = { blogId: new ObjectId(id), email };

      const isDownvoted = await downvotesCollection.findOne(query);

      if (!isDownvoted) {
        await downvotesCollection.insertOne({
          email,
          blogId: new ObjectId(id),
        });
      } else {
        await downvotesCollection.deleteOne(query);
      }

      const updateDoc = isDownvoted
        ? { $inc: { downvotes: -1 } }
        : { $inc: { downvotes: 1 } };

      const result = await blogsCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc,
      );

      res.send(result);
    });

    app.get("/featured-blogs", async (req, res) => {
      const query = { type: "Featured", status: "Accepted" };
      const result = await blogsCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/trending-blogs", async (req, res) => {
      const query = { status: "Accepted" };
      const result = await blogsCollection
        .find(query)
        .sort({ upvotes: -1, downvotes: 1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/blogs/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    app.put("/blogs/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const blog = req?.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: blog };
      const result = await blogsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.delete("/blogs/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/reviews", verifyToken, async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const query = { blogId: id };
      const result = await reviewsCollection
        .find(query)
        .sort({ reviewDate: -1 })
        .toArray();
      res.send(result);
    });

    app.delete("/reviews/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/reviews/:id", verifyToken, async (req, res) => {
      const id = req?.params?.id;
      const review = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: review };
      const result = await reviewsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.get("/blogs-count", async (req, res) => {
      const count = await blogsCollection.estimatedDocumentCount();
      res.send({ count });
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
