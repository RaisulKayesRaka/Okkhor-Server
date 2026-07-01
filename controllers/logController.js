const Log = require("../models/Log");
const User = require("../models/User");

const addLog = async (action, details, triggeredByEmail, type = 'system') => {
  try {
    let triggeredBy = null;
    if (triggeredByEmail && triggeredByEmail !== "Unknown") {
      const user = await User.findOne({ email: triggeredByEmail });
      if (user) {
        triggeredBy = user._id;
      }
    }
    
    const log = new Log({
      action,
      details,
      type,
      triggeredBy,
    });
    await log.save();
  } catch (error) {
    console.error("Failed to add log", error);
  }
};

const getLogs = async (req, res) => {
  const result = await Log.find({ type: 'system' }).sort({ createdAt: -1 }).limit(100).populate('triggeredBy', 'name email role');
  res.send(result);
};

const getUserLogs = async (req, res) => {
  const email = req?.params?.email;
  const user = await User.findOne({ email });
  if (!user) {
    return res.send([]);
  }
  const result = await Log.find({ type: 'user', triggeredBy: user._id }).sort({ createdAt: -1 }).limit(50);
  res.send(result);
};

module.exports = {
  addLog,
  getLogs,
  getUserLogs,
};
