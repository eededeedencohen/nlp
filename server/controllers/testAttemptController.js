const TestAttempt = require("../models/TestAttempt");

exports.startAttempt = async (req, res) => {
  try {
    const { userId } = req.params;
    const week = Number(req.query.week || req.body?.week || 1);
    const last = await TestAttempt.findOne({ userId, week }).sort({ attemptNumber: -1 });
    const attemptNumber = last ? last.attemptNumber + 1 : 1;
    const attempt = await TestAttempt.create({
      userId,
      week,
      attemptNumber,
      answers: [],
    });
    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ message: "answers must be array" });

    const attempt = await TestAttempt.findByIdAndUpdate(
      attemptId,
      { answers },
      { new: true }
    );
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ message: "answers must be array" });

    const score = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;

    const attempt = await TestAttempt.findByIdAndUpdate(
      attemptId,
      { answers, score, total, completedAt: new Date() },
      { new: true }
    );
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;
    const week = req.query.week ? Number(req.query.week) : null;
    const query = { userId };
    if (week) query.week = week;
    const attempts = await TestAttempt.find(query).sort({ attemptNumber: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAttempts = async (req, res) => {
  try {
    const attempts = await TestAttempt.find()
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { userId } = req.body;
    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (userId && String(attempt.userId) !== String(userId)) {
      return res.status(403).json({ message: "Cannot delete another user's attempt" });
    }
    await TestAttempt.findByIdAndDelete(attemptId);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;
    const week = req.query.week ? Number(req.query.week) : null;
    const query = { userId };
    if (week) query.week = week;
    const result = await TestAttempt.deleteMany(query);
    res.json({ ok: true, deleted: result.deletedCount, week });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
