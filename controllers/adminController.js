const User = require("../models/User");
const Blog = require("../models/Blog");

const getPlatformAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newBlogsToday = await Blog.countDocuments({ createdAt: { $gte: today } });

    // Growth Data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const userGrowthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const blogGrowthRaw = await Blog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Merge growth data by date
    const dateMap = {};
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = { date: dateStr, users: 0, blogs: 0 };
    }

    userGrowthRaw.forEach(item => {
      if (dateMap[item._id]) dateMap[item._id].users = item.count;
    });
    blogGrowthRaw.forEach(item => {
      if (dateMap[item._id]) dateMap[item._id].blogs = item.count;
    });

    const growthData = Object.values(dateMap);

    // Distribution Data
    const roleDistribution = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const statusDistribution = await Blog.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.send({
      kpis: {
        totalUsers,
        totalBlogs,
        newUsersToday,
        newBlogsToday
      },
      growthData,
      roleDistribution: roleDistribution.map(d => ({ name: d._id || "user", value: d.count })),
      statusDistribution: statusDistribution.map(d => ({ name: d._id || "Pending", value: d.count }))
    });

  } catch (error) {
    console.error("Platform analytics error:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

module.exports = {
  getPlatformAnalytics
};
