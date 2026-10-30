const express = require("express");

const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, listTasks);
router.post("/", requireAuth, authorizeRoles("admin"), createTask);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, authorizeRoles("admin"), deleteTask);

module.exports = router;
