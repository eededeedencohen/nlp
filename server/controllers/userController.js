const User = require("../models/User");

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");

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

// Admin creates a user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "שם הוא שדה חובה" });
    if (!isValidEmail(email)) return res.status(400).json({ message: "כתובת אימייל לא תקינה" });
    if (!password || password.length < 4) {
      return res.status(400).json({ message: "סיסמה חייבת להכיל לפחות 4 תווים" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "כתובת אימייל זו כבר רשומה" });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
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
    const { name, email, role, password } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (email) {
      if (!isValidEmail(email)) return res.status(400).json({ message: "אימייל לא תקין" });
      update.email = email.toLowerCase().trim();
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "אימייל וסיסמה נדרשים" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "אימייל או סיסמה שגויים" });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ message: "אימייל או סיסמה שגויים" });
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
