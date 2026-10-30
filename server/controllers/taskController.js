const mongoose = require("mongoose");

const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

const taskStatuses = ["todo", "in-progress", "completed"];
const taskPriorities = ["low", "medium", "high"];

const getWorkspaceId = (req) => req.user.workspace || null;

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const validateTaskDates = (startDate, dueDate) => {
  if (startDate !== undefined && startDate !== null && !isValidDate(startDate)) {
    return "Start date is invalid";
  }

  if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
    return "Due date is invalid";
  }

  if (
    startDate !== undefined &&
    startDate !== null &&
    dueDate !== undefined &&
    dueDate !== null &&
    new Date(startDate) > new Date(dueDate)
  ) {
    return "Due date cannot be before the start date";
  }

  return null;
};

const getProjectInWorkspace = async (projectId, workspaceId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    return null;
  }

  return Project.findOne({ _id: projectId, workspace: workspaceId });
};

const getAssigneeInWorkspace = async (assigneeId, workspaceId) => {
  if (assigneeId === null || assigneeId === undefined || assigneeId === "") {
    return null;
  }

  if (!mongoose.isValidObjectId(assigneeId)) {
    return false;
  }

  return User.findOne({
    _id: assigneeId,
    workspace: workspaceId,
    isActive: true,
  }).select("_id");
};

const populateTask = (query) =>
  query
    .populate("project", "name status")
    .populate("assignee", "name email avatar")
    .populate("createdBy", "name email avatar");

const listTasks = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);

    if (!workspaceId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const filter = { workspace: workspaceId };

    if (req.user.role !== "admin") {
      filter.assignee = req.user.id;
    }

    const tasks = await populateTask(Task.find(filter).sort({ createdAt: -1 }));

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("List tasks error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load tasks",
    });
  }
};

const createTask = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const {
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      project,
      assignee,
    } = req.body;

    if (!workspaceId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    if (status !== undefined && !taskStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Task status is invalid",
      });
    }

    if (priority !== undefined && !taskPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Task priority is invalid",
      });
    }

    const dateError = validateTaskDates(startDate, dueDate);

    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    const projectRecord = await getProjectInWorkspace(project, workspaceId);

    if (!projectRecord) {
      return res.status(400).json({
        success: false,
        message: "Project is invalid or does not belong to your workspace",
      });
    }

    const assigneeRecord = await getAssigneeInWorkspace(assignee, workspaceId);

    if (assignee !== undefined && assignee !== null && assignee !== "" && !assigneeRecord) {
      return res.status(400).json({
        success: false,
        message: "Assignee is invalid or does not belong to your workspace",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      status,
      priority,
      startDate,
      dueDate,
      project: projectRecord._id,
      assignee: assigneeRecord ? assigneeRecord._id : undefined,
      createdBy: req.user.id,
      workspace: workspaceId,
    });

    const populatedTask = await populateTask(Task.findById(task._id));

    return res.status(201).json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create task error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create task",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { id } = req.params;

    if (!workspaceId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Task ID is invalid",
      });
    }

    if (req.user.role !== "admin") {
      const submittedFields = Object.keys(req.body);

      if (submittedFields.some((field) => field !== "status")) {
        return res.status(403).json({
          success: false,
          message: "Members can only update task status",
        });
      }

      if (!taskStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Task status is invalid",
        });
      }

      const task = await Task.findOneAndUpdate(
        { _id: id, workspace: workspaceId, assignee: req.user.id },
        { status: req.body.status },
        { new: true, runValidators: true },
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Assigned task not found in your workspace",
        });
      }

      return res.status(200).json({
        success: true,
        task: await populateTask(Task.findById(task._id)),
      });
    }

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "startDate",
      "dueDate",
      "project",
      "assignee",
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title must be a non-empty string",
        });
      }

      updates.title = updates.title.trim();
    }

    if (updates.status !== undefined && !taskStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: "Task status is invalid",
      });
    }

    if (updates.priority !== undefined && !taskPriorities.includes(updates.priority)) {
      return res.status(400).json({
        success: false,
        message: "Task priority is invalid",
      });
    }

    const dateError = validateTaskDates(updates.startDate, updates.dueDate);

    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    if (updates.project !== undefined) {
      const projectRecord = await getProjectInWorkspace(updates.project, workspaceId);

      if (!projectRecord) {
        return res.status(400).json({
          success: false,
          message: "Project is invalid or does not belong to your workspace",
        });
      }

      updates.project = projectRecord._id;
    }

    if (updates.assignee !== undefined) {
      const assigneeRecord = await getAssigneeInWorkspace(
        updates.assignee,
        workspaceId,
      );

      if (updates.assignee !== null && updates.assignee !== "" && !assigneeRecord) {
        return res.status(400).json({
          success: false,
          message: "Assignee is invalid or does not belong to your workspace",
        });
      }

      updates.assignee = assigneeRecord ? assigneeRecord._id : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one task field is required",
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, workspace: workspaceId },
      updates,
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in your workspace",
      });
    }

    return res.status(200).json({
      success: true,
      task: await populateTask(Task.findById(task._id)),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update task error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update task",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { id } = req.params;

    if (!workspaceId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Task ID is invalid",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      workspace: workspaceId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in your workspace",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
};

module.exports = {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
};
