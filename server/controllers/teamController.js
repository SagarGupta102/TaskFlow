const User = require("../models/User");

const listWorkspaceMembers = async (req, res) => {
  try {
    if (!req.user.workspace) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const members = await User.find({
      workspace: req.user.workspace,
      isActive: true,
    })
      .select("_id name email role")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("List workspace members error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load workspace members",
    });
  }
};

module.exports = {
  listWorkspaceMembers,
};
