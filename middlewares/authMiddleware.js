const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
  const email = req?.decoded?.email;
  const user = await User.findOne({ email });
  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "Forbidden" });
  }
  next();
};

const verifyModerator = async (req, res, next) => {
  const email = req?.decoded?.email;
  const user = await User.findOne({ email });
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
