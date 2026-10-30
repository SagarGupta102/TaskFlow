const express = require("express");

const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { requireAuth, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, listProjects);
router.post("/", requireAuth, authorizeRoles("admin"), createProject);
router.put("/:id", requireAuth, authorizeRoles("admin"), updateProject);
router.delete("/:id", requireAuth, authorizeRoles("admin"), deleteProject);

module.exports = router;
