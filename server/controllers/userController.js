const User = require("../models/User");

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
const isValidUsername = (u) => /^[a-zA-Z0-9._-]{2,30}$/.test(u || "");

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, username, email, password, role = "user" } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "שם הוא שדה חובה" });
    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: "שם משתמש חייב להכיל 2-30 תווים (אותיות אנגליות, ספרות, נקודה, מקף, קו תחתון)",
      });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "כתובת אימייל לא תקינה" });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ message: "סיסמה חייבת להכיל לפחות 4 תווים" });
    }

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(400).json({ message: "שם משתמש זה כבר תפוס" });
    if (email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) return res.status(400).json({ message: "אימייל זה כבר רשום" });
    }

    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      passwordHash: await User.hashPassword(password),
      role,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, username, email, role, password } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (username) {
      if (!isValidUsername(username)) {
        return res.status(400).json({ message: "שם משתמש לא תקין" });
      }
      update.username = username.toLowerCase().trim();
    }
    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ message: "אימייל לא תקין" });
      }
      update.email = email ? email.toLowerCase().trim() : undefined;
    }
    if (role) update.role = role;
    if (password) update.passwordHash = await User.hashPassword(password);

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    // Accept either { identifier, password } or legacy { email, password }
    const identifier = (req.body.identifier || req.body.email || req.body.username || "")
      .toLowerCase()
      .trim();
    const password = req.body.password;
    if (!identifier || !password) {
      return res.status(400).json({ message: "נא להזין שם משתמש/אימייל וסיסמה" });
    }
    const query = identifier.includes("@")
      ? { email: identifier }
      : { username: identifier };
    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ message: "סיסמה חדשה חייבת להכיל לפחות 4 תווים" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "המשתמש לא נמצא" });
    const ok = await user.verifyPassword(currentPassword || "");
    if (!ok) return res.status(401).json({ message: "סיסמה נוכחית שגויה" });
    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  login,
  changePassword,
};
