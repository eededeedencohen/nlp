const Card = require("../models/Card");

function decodeBase64Image(dataUrl) {
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1], buf: Buffer.from(m[2], "base64") };
}

async function getLastNumber(week) {
  const last = await Card.findOne({ week }).sort({ number: -1 }).select("number");
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

exports.saveCards = async (req, res) => {
  try {
    const { front, back, week = 1 } = req.body;
    const frontImg = decodeBase64Image(front);
    const backImg = decodeBase64Image(back);
    if (!frontImg || !backImg) {
      return res.status(400).json({ error: "Both front and back images are required" });
    }
    const w = Number(week);
    const number = (await getLastNumber(w)) + 1;
    const doc = await Card.create({
      week: w,
      number,
      front: "",
      back: "",
      frontImage: { data: frontImg.buf, mimeType: frontImg.mimeType, size: frontImg.buf.length },
      backImage: { data: backImg.buf, mimeType: backImg.mimeType, size: backImg.buf.length },
    });
    res.json({ number: doc.number, week: doc.week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    const week = Number(req.query.week) || 1;
    const doc = await Card.findOneAndDelete({ week, number });
    if (!doc) return res.status(404).json({ error: `No card found for week ${week} number ${number}` });
    res.json({ number, week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.resetAll = async (req, res) => {
  try {
    const week = req.query.week ? Number(req.query.week) : null;
    const query = week ? { week } : {};
    const r = await Card.deleteMany(query);
    res.json({ removed: r.deletedCount, week });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
