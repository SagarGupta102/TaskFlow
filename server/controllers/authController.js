const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Workspace = require("../models/Workspace");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const getSafeUser = (user) => {
  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
  };

  if (user.workspace && typeof user.workspace === "object" && user.workspace.name) {
    safeUser.workspace = {
      id: user.workspace._id,
      name: user.workspace.name,
      description: user.workspace.description,
    };
  } else {
    safeUser.workspace = user.workspace || null;
  }

  return safeUser;
};

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: "1d" },
  );

const validateCredentials = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "Name, email, and password are required";
  }

  if (!emailPattern.test(email)) {
    return "Please provide a valid email address";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  return null;
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const validationError = validateCredentials({ name, email, password });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const admin = await User.findOne({
      role: "admin",
      isActive: true,
    }).select("_id");
    const workspace = admin
      ? await Workspace.findOne({ owner: admin._id })
      : null;

    if (!workspace) {
      return res.status(503).json({
        success: false,
        message: "Registration is not available until the workspace is ready",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        [user] = await User.create(
          [
            {
              name: name.trim(),
              email: normalizedEmail,
              password: passwordHash,
              role: "member",
              workspace: workspace._id,
            },
          ],
          { session },
        );

        const updatedWorkspace = await Workspace.findByIdAndUpdate(
          workspace._id,
          { $addToSet: { members: user._id } },
          { new: true, session },
        );

        if (!updatedWorkspace) {
          throw new Error("Workspace was not found during registration");
        }
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to register account",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).populate(
      "workspace",
      "name description",
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(200).json({
      success: true,
      token: createToken(user),
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "workspace",
      "name description",
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user no longer exists or is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Current user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load current user",
    });
  }
};

const setupAdmin = async (req, res) => {
  try {
    const { name, email, password, workspaceName, setupSecret } = req.body;

    if (!name || !email || !password || !workspaceName || !setupSecret) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, workspace name, and setup secret are required",
      });
    }

    if (!process.env.ADMIN_SETUP_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin setup is not configured",
      });
    }

    if (setupSecret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Invalid setup secret",
      });
    }

    const validationError = validateCredentials({ name, email, password });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    getJwtSecret();

    const adminExists = await User.exists({ role: "admin" });

    if (adminExists) {
      return res.status(409).json({
        success: false,
        message: "The initial admin account has already been created",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();
    let admin;
    let workspace;

    try {
      await session.withTransaction(async () => {
        [admin] = await User.create(
          [
            {
              name: name.trim(),
              email: normalizedEmail,
              password: passwordHash,
              role: "admin",
            },
          ],
          { session },
        );

        [workspace] = await Workspace.create(
          [
            {
              name: workspaceName.trim(),
              owner: admin._id,
              members: [admin._id],
            },
          ],
          { session },
        );

        admin.workspace = workspace._id;
        await admin.save({ session });
      });
    } finally {
      await session.endSession();
    }

    admin.workspace = workspace;

    return res.status(201).json({
      success: true,
      token: createToken(admin),
      user: getSafeUser(admin),
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.role) {
        return res.status(409).json({
          success: false,
          message: "The initial admin account has already been created",
        });
      }

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Admin setup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create initial admin account",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  setupAdmin,
};
