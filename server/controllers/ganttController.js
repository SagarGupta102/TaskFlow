const Project = require("../models/Project");
const Task = require("../models/Task");

const getTimeline = async (req, res) => {
  try {
    if (!req.user.workspace) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const projectFilter = { workspace: req.user.workspace };
    const taskFilter = { workspace: req.user.workspace };

    if (req.user.role !== "admin") {
      projectFilter.members = req.user.id;
      taskFilter.assignee = req.user.id;
    }

    const [projects, tasks] = await Promise.all([
      Project.find(projectFilter)
        .select("name status startDate dueDate")
        .sort({ startDate: 1, createdAt: 1 })
        .lean(),
      Task.find(taskFilter)
        .select("title status priority startDate dueDate project assignee")
        .populate("project", "name startDate dueDate")
        .populate("assignee", "name")
        .sort({ startDate: 1, createdAt: 1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      timeline: {
        projects,
        tasks,
      },
    });
  } catch (error) {
    console.error("Gantt timeline error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load Gantt timeline",
    });
  }
};

module.exports = {
  getTimeline,
};
