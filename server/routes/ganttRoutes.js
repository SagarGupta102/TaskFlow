const express = require("express");

const { getTimeline } = require("../controllers/ganttController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/timeline", requireAuth, getTimeline);

module.exports = router;
