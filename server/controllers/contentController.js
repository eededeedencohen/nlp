const Infographic = require("../models/Infographic");
const Presentation = require("../models/Presentation");
const Card = require("../models/Card");
const TestQuestion = require("../models/TestQuestion");

function decodeBase64(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

function sanitizeName(name) {
  return String(name || "")
    .replace(/[^\w.\-֐-׿]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

// ===== Cards (text data) =====
exports.getCardsData = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const cards = await Card.find({ week })
      .sort({ number: 1 })
      .select("number front back");
    const out = {};
    for (const c of cards) {
      out[`card${c.number}`] = { front: c.front, back: c.back };
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ===== Test questions (text data) =====
exports.getTestQuestions = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const qs = await TestQuestion.find({ week })
      .sort({ number: 1 })
      .select("number question answers explanations hint correct");
    const out = {};
    for (const q of qs) {
      out[`question${q.number}`] = {
        question: q.question,
        answers: q.answers,
        explanations: q.explanations,
        hint: q.hint,
        correct: q.correct,
      };
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ===== Card images (stream from DB) =====
exports.listCardImages = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const cards = await Card.find({ week })
      .sort({ number: 1 })
      .select("number");
    const result = cards.map((c) => ({
      number: c.number,
      week,
      front: `/api/content/cards/${week}/${c.number}/front`,
      back: `/api/content/cards/${week}/${c.number}/back`,
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.streamCardImage = async (req, res) => {
  try {
    const week = Number(req.params.week);
    const number = Number(req.params.number);
    const side = req.params.side === "back" ? "backImage" : "frontImage";
    const card = await Card.findOne({ week, number });
    const img = card && card[side];
    if (!img || !img.data) return res.status(404).end();
    res.setHeader("Content-Type", img.mimeType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(img.data);
  } catch (e) {
    res.status(500).end();
  }
};

// ===== Test images (stream from DB) =====
exports.listTestImages = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const qs = await TestQuestion.find({ week })
      .sort({ number: 1 })
      .select("number");
    const result = qs.map((q) => ({
      number: q.number,
      week,
      url: `/api/content/test-images/${week}/${q.number}`,
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.streamTestImage = async (req, res) => {
  try {
    const week = Number(req.params.week);
    const number = Number(req.params.number);
    const q = await TestQuestion.findOne({ week, number });
    if (!q || !q.image || !q.image.data) return res.status(404).end();
    res.setHeader("Content-Type", q.image.mimeType || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(q.image.data);
  } catch (e) {
    res.status(500).end();
  }
};

// ===== Infographics =====
exports.listInfographics = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const docs = await Infographic.find({ week }).select("-data").sort({ name: 1 });
    res.json(
      docs.map((d) => ({
        id: d._id,
        name: d.name,
        week: d.week,
        url: `/api/content/infographics/${d._id}/file`,
        mimeType: d.mimeType,
        size: d.size,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.streamInfographic = async (req, res) => {
  try {
    const doc = await Infographic.findById(req.params.id);
    if (!doc) return res.status(404).end();
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(doc.data);
  } catch (error) {
    res.status(500).end();
  }
};

exports.uploadInfographic = async (req, res) => {
  try {
    const { file, filename, week = 1 } = req.body;
    const decoded = decodeBase64(file);
    if (!decoded) return res.status(400).json({ error: "Invalid file (expected data URL)" });
    if (!/^image\//.test(decoded.mime)) {
      return res.status(400).json({ error: "Only image files are allowed" });
    }
    const ext = (decoded.mime.split("/")[1] || "png").toLowerCase();
    const base =
      sanitizeName((filename || "").replace(/\.[^.]+$/, "")) ||
      `infographic_${Date.now()}`;
    let final = `${base}.${ext}`;
    let counter = 1;
    while (await Infographic.findOne({ week: Number(week), name: final })) {
      final = `${base}_${counter}.${ext}`;
      counter++;
    }
    const doc = await Infographic.create({
      week: Number(week),
      name: final,
      mimeType: decoded.mime,
      size: decoded.buf.length,
      data: decoded.buf,
    });
    res.status(201).json({
      id: doc._id,
      name: doc.name,
      week: doc.week,
      url: `/api/content/infographics/${doc._id}/file`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInfographic = async (req, res) => {
  try {
    const doc = await Infographic.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== Presentations =====
exports.listPresentations = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const docs = await Presentation.find({ week }).select("-data").sort({ name: 1 });
    res.json(
      docs.map((d) => ({
        id: d._id,
        name: d.name,
        week: d.week,
        url: `/api/content/presentations/${d._id}/file`,
        mimeType: d.mimeType,
        size: d.size,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.streamPresentation = async (req, res) => {
  try {
    const doc = await Presentation.findById(req.params.id);
    if (!doc) return res.status(404).end();
    res.setHeader("Content-Type", doc.mimeType || "application/pdf");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.name)}"`
    );
    res.send(doc.data);
  } catch (error) {
    res.status(500).end();
  }
};

exports.uploadPresentation = async (req, res) => {
  try {
    const { file, filename, week = 1 } = req.body;
    const decoded = decodeBase64(file);
    if (!decoded) return res.status(400).json({ error: "Invalid file (expected data URL)" });
    if (decoded.mime !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }
    const base =
      sanitizeName((filename || "").replace(/\.[^.]+$/, "")) ||
      `presentation_${Date.now()}`;
    let final = `${base}.pdf`;
    let counter = 1;
    while (await Presentation.findOne({ week: Number(week), name: final })) {
      final = `${base}_${counter}.pdf`;
      counter++;
    }
    const doc = await Presentation.create({
      week: Number(week),
      name: final,
      mimeType: "application/pdf",
      size: decoded.buf.length,
      data: decoded.buf,
    });
    res.status(201).json({
      id: doc._id,
      name: doc.name,
      week: doc.week,
      url: `/api/content/presentations/${doc._id}/file`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePresentation = async (req, res) => {
  try {
    const doc = await Presentation.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== Weeks list =====
exports.listWeeks = async (req, res) => {
  try {
    const weeks = new Set();
    const cardWeeks = await Card.distinct("week");
    const testWeeks = await TestQuestion.distinct("week");
    const infoWeeks = await Infographic.distinct("week");
    const presWeeks = await Presentation.distinct("week");
    for (const w of [...cardWeeks, ...testWeeks, ...infoWeeks, ...presWeeks]) weeks.add(w);
    if (weeks.size === 0) weeks.add(1);
    res.json([...weeks].sort((a, b) => a - b));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
