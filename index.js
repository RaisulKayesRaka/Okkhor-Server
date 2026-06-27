require("dotenv").config();
const express = require("express");
require("express-async-errors");
const app = express();
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
const { connectDB } = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const blogRoutes = require("./routes/blogRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const logRoutes = require("./routes/logRoutes");

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Okkhor");
});

async function run() {
  try {
    await connectDB();

    // Mount Routes
    app.use("/", authRoutes);
    app.use("/", userRoutes);
    app.use("/", blogRoutes);
    app.use("/", reviewRoutes);
    app.use("/", logRoutes);

  } catch (error) {
    console.error("Database connection failed", error);
  }
}

run().catch(console.dir);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ 
    message: "Internal Server Error", 
    error: err.message 
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
