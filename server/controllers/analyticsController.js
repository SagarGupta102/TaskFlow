const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

const projectStatuses = ["planned", "active", "completed"];
const taskStatuses = ["todo", "in-progress", "completed"];
const priorities = ["high", "medium", "low"];

const getAnalyticsFilters = (req) => {
  const workspaceId = req.user.workspace;

  if (!workspaceId) {
    return null;
  }

  const projectFilter = { workspace: workspaceId };
  const taskFilter = { workspace: workspaceId };

  if (req.user.role !== "admin") {
    projectFilter.members = req.user.id;
    taskFilter.assignee = req.user.id;
  }

  return { workspaceId, projectFilter, taskFilter };
};

const buildBreakdown = (rows, values) => {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return values.map((value) => ({
    name: value,
    count: counts.get(value) || 0,
  }));
};

const getSummary = async (req, res) => {
  try {
    const filters = getAnalyticsFilters(req);

    if (!filters) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const now = new Date();
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      overdueTasks,
      projectStatusRows,
      activeMembers,
      taskStatusRows,
      priorityRows,
    ] = await Promise.all([
      Project.countDocuments(filters.projectFilter),
      Task.countDocuments(filters.taskFilter),
      Task.countDocuments({ ...filters.taskFilter, status: "completed" }),
      Task.countDocuments({ ...filters.taskFilter, status: "in-progress" }),
      Task.countDocuments({ ...filters.taskFilter, status: "todo" }),
      Task.countDocuments({ ...filters.taskFilter, priority: "high" }),
      Task.countDocuments({ ...filters.taskFilter, priority: "medium" }),
      Task.countDocuments({ ...filters.taskFilter, priority: "low" }),
      Task.countDocuments({
        ...filters.taskFilter,
        dueDate: { $lt: now },
        status: { $ne: "completed" },
      }),
      Project.aggregate([
        { $match: filters.projectFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.countDocuments({ workspace: filters.workspaceId, isActive: true }),
      Task.aggregate([
        { $match: filters.taskFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: filters.taskFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    const completionPercentage = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalProjects,
        totalMembers: activeMembers,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        highPriorityTasks,
        mediumPriorityTasks,
        lowPriorityTasks,
        overdueTasks,
        completionPercentage,
        projectStatusBreakdown: buildBreakdown(projectStatusRows, projectStatuses),
        taskStatusBreakdown: buildBreakdown(taskStatusRows, taskStatuses),
        priorityBreakdown: buildBreakdown(priorityRows, priorities),
      },
    });
  } catch (error) {
    console.error("Analytics summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load analytics summary",
    });
  }
};

module.exports = {
  getSummary,
};
