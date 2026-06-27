const { getLogsCollection } = require("../config/db");

const addLog = async (action, details, triggeredBy) => {
  try {
    const logsCollection = getLogsCollection();
    const log = {
      action,
      details,
      triggeredBy,
      timestamp: new Date(),
    };
    await logsCollection.insertOne(log);
  } catch (error) {
    console.error("Failed to add log", error);
  }
};

const getLogs = async (req, res) => {
  const logsCollection = getLogsCollection();
  const result = await logsCollection.find().sort({ timestamp: -1 }).limit(100).toArray();
  res.send(result);
};

module.exports = {
  addLog,
  getLogs,
};
