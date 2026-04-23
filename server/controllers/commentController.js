const Comment = require("../models/Comment");

exports.listForItem = async (req, res) => {
  try {
    const { type, number } = req.params;
    const week = Number(req.query.week) || 1;
    const comments = await Comment.find({
      itemType: type,
      week,
      itemNumber: Number(number),
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { type, number } = req.params;
    const { userId, text, week = 1 } = req.body;
    if (!userId || !text?.trim()) {
      return res.status(400).json({ message: "userId and text required" });
    }
    const c = await Comment.create({
      userId,
      itemType: type,
      week: Number(week),
      itemNumber: Number(number),
      text: text.trim(),
    });
    const populated = await c.populate("userId", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const c = await Comment.findById(id);
    if (!c) return res.status(404).json({ message: "Not found" });
    if (String(c.userId) !== String(userId)) {
      return res.status(403).json({ message: "Cannot delete another user's comment" });
    }
    await Comment.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
