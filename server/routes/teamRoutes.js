const express = require("express");

const { listWorkspaceMembers } = require("../controllers/teamController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, listWorkspaceMembers);

module.exports = router;
