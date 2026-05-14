const TestQuestion = require("../models/TestQuestion");

function decodeBase64Image(dataUrl) {
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1], buf: Buffer.from(m[2], "base64") };
}

async function getLastNumber(week) {
  const last = await TestQuestion.findOne({ week }).sort({ number: -1 }).select("number");
  return last ? last.number : 0;
}

exports.getNextNumber = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const next = (await getLastNumber(week)) + 1;
    res.json({ next, week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.saveQuestion = async (req, res) => {
  try {
    const { image, week = 1, correct = "A" } = req.body;
    if (!["A", "B", "C", "D"].includes(correct)) {
      return res.status(400).json({ error: "correct must be one of A, B, C, D" });
    }
    const img = decodeBase64Image(image);
    if (!img) return res.status(400).json({ error: "Image is required" });

    const w = Number(week);
    const number = (await getLastNumber(w)) + 1;
    const doc = await TestQuestion.create({
      week: w,
      number,
      question: "",
      answers: { A: "", B: "", C: "", D: "" },
      hint: "",
      correct,
      image: { data: img.buf, mimeType: img.mimeType, size: img.buf.length },
    });
    res.json({ number: doc.number, week: doc.week, correct: doc.correct });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    const week = Number(req.query.week) || 1;
    const doc = await TestQuestion.findOneAndDelete({ week, number });
    if (!doc) return res.status(404).json({ error: `No question found for week ${week} number ${number}` });
    res.json({ number, week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.resetAll = async (req, res) => {
  try {
    const week = req.query.week ? Number(req.query.week) : null;
    const query = week ? { week } : {};
    const r = await TestQuestion.deleteMany(query);
    res.json({ removed: r.deletedCount, week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
