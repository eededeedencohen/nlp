const CardProgress = require("../models/CardProgress");

exports.getMyCardProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const week = req.query.week ? Number(req.query.week) : null;
    const query = { userId };
    if (week) query.week = week;
    const entries = await CardProgress.find(query);
    // Map key format: if week query → return just cardNumber → status; else return full list
    if (week) {
      const map = {};
      for (const e of entries) map[e.cardNumber] = e.status;
      return res.json(map);
    }
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setCardStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cardNumber, status, week = 1 } = req.body;
    if (!cardNumber || !["known", "unknown"].includes(status)) {
      return res.status(400).json({ message: "Invalid payload" });
    }
    const entry = await CardProgress.findOneAndUpdate(
      { userId, week: Number(week), cardNumber },
      { status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetMyCardProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const week = req.query.week ? Number(req.query.week) : null;
    const query = { userId };
    if (week) query.week = week;
    await CardProgress.deleteMany(query);
    res.json({ ok: true, week });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllProgressSummary = async (req, res) => {
  try {
    const agg = await CardProgress.aggregate([
      {
        $group: {
          _id: { userId: "$userId", week: "$week", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(agg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
