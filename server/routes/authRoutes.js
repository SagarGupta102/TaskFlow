const express = require("express");

const {
  register,
  login,
  getCurrentUser,
  setupAdmin,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const authRouter = express.Router();
const setupRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, getCurrentUser);

setupRouter.post("/admin", setupAdmin);

module.exports = {
  authRouter,
  setupRouter,
};
