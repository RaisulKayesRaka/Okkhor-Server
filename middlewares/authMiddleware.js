const jwt = require("jsonwebtoken");
const { getUsersCollection } = require("../config/db");

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

const verifyAdmin = async (req, res, next) => {
  const usersCollection = getUsersCollection();
  const email = req?.decoded?.email;
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();
};

const verifyModerator = async (req, res, next) => {
  const usersCollection = getUsersCollection();
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

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyModerator,
};
