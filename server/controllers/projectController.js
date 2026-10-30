const mongoose = require("mongoose");

const Project = require("../models/Project");
const User = require("../models/User");

const projectStatuses = ["planned", "active", "completed"];

const getWorkspaceId = (req) => req.user.workspace || null;

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const validateDateFields = ({ startDate, dueDate }) => {
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

const validateMembers = async (members, workspaceId) => {
  if (members === undefined) {
    return { ids: undefined };
  }

  if (!Array.isArray(members)) {
    return { error: "Members must be an array" };
  }

  const uniqueIds = [...new Set(members.map(String))];

  if (uniqueIds.some((memberId) => !mongoose.isValidObjectId(memberId))) {
    return { error: "One or more member IDs are invalid" };
  }

  const count = await User.countDocuments({
    _id: { $in: uniqueIds },
    workspace: workspaceId,
    isActive: true,
  });

  if (count !== uniqueIds.length) {
    return { error: "All project members must belong to the workspace" };
  }

  return { ids: uniqueIds };
};

const listProjects = async (req, res) => {
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
      filter.members = req.user.id;
    }

    const projects = await Project.find(filter)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("List projects error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load projects",
    });
  }
};

const createProject = async (req, res) => {
  try {
    const workspaceId = getWorkspaceId(req);
    const { name, description, status, startDate, dueDate, members } = req.body;

    if (!workspaceId) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    if (status !== undefined && !projectStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Project status is invalid",
      });
    }

    const dateError = validateDateFields({ startDate, dueDate });

    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    const memberResult = await validateMembers(members, workspaceId);

    if (memberResult.error) {
      return res.status(400).json({
        success: false,
        message: memberResult.error,
      });
    }

    const project = await Project.create({
      name: name.trim(),
      description,
      status,
      startDate,
      dueDate,
      createdBy: req.user.id,
      workspace: workspaceId,
      members: memberResult.ids || [],
    });

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    return res.status(201).json({
      success: true,
      project: populatedProject,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create project error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
};

const updateProject = async (req, res) => {
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
        message: "Project ID is invalid",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "startDate",
      "dueDate",
      "members",
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Project name must be a non-empty string",
        });
      }

      updates.name = updates.name.trim();
    }

    if (updates.status !== undefined && !projectStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        message: "Project status is invalid",
      });
    }

    const dateError = validateDateFields(updates);

    if (dateError) {
      return res.status(400).json({ success: false, message: dateError });
    }

    const memberResult = await validateMembers(updates.members, workspaceId);

    if (memberResult.error) {
      return res.status(400).json({
        success: false,
        message: memberResult.error,
      });
    }

    if (memberResult.ids !== undefined) {
      updates.members = memberResult.ids;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one project field is required",
      });
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, workspace: workspaceId },
      updates,
      { new: true, runValidators: true },
    )
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found in your workspace",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update project error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
};

const deleteProject = async (req, res) => {
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
        message: "Project ID is invalid",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: id,
      workspace: workspaceId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found in your workspace",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete project",
    });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
};
