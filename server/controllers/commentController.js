const mongoose = require("mongoose");

const Comment = require("../models/Comment");
const Task = require("../models/Task");

const getAuthorizedTask = (req, taskId) => {
  const filter = {
    _id: taskId,
    workspace: req.user.workspace,
  };

  if (req.user.role !== "admin") {
    filter.assignee = req.user.id;
  }

  return Task.findOne(filter).select("_id");
};

const toSafeComment = (comment) => ({
  id: comment._id,
  content: comment.content,
  createdAt: comment.createdAt,
  author: {
    id: comment.author._id,
    name: comment.author.name,
  },
});

const listComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Task ID is invalid",
      });
    }

    if (!req.user.workspace) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const task = await getAuthorizedTask(req, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or unavailable",
      });
    }

    const comments = await Comment.find({ task: task._id })
      .populate("author", "name")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      comments: comments.map(toSafeComment),
    });
  } catch (error) {
    console.error("List comments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load comments",
    });
  }
};

const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Task ID is invalid",
      });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    if (!req.user.workspace) {
      return res.status(403).json({
        success: false,
        message: "User is not assigned to a workspace",
      });
    }

    const task = await getAuthorizedTask(req, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or unavailable",
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      task: task._id,
      author: req.user.id,
    });

    const savedComment = await Comment.findById(comment._id)
      .populate("author", "name")
      .lean();

    return res.status(201).json({
      success: true,
      comment: toSafeComment(savedComment),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create comment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create comment",
    });
  }
};

module.exports = {
  listComments,
  createComment,
};
