const express = require("express");

const {
  listComments,
  createComment,
} = require("../controllers/commentController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:taskId/comments", requireAuth, listComments);
router.post("/:taskId/comments", requireAuth, createComment);

module.exports = router;
