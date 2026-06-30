const Log = require("../models/Log");
const User = require("../models/User");

const addLog = async (action, details, triggeredByEmail) => {
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
      triggeredBy,
    });
    await log.save();
  } catch (error) {
    console.error("Failed to add log", error);
  }
};

const getLogs = async (req, res) => {
  const result = await Log.find().sort({ createdAt: -1 }).limit(100).populate('triggeredBy', 'name email role');
  res.send(result);
};

module.exports = {
  addLog,
  getLogs,
};
