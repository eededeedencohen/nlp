const fs = require("fs");
const path = require("path");
const Infographic = require("../models/Infographic");
const Presentation = require("../models/Presentation");

const UPLOADS = path.join(__dirname, "..", "uploads");

function readJson(file, fallback) {
  const p = path.join(UPLOADS, file);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function getNestedWeek(data, week) {
  if (!data) return {};
  return data[`week${week}`] || {};
}

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

// ===== Cards/Tests text JSON =====
exports.getCardsData = (req, res) => {
  const week = Number(req.query.week) || 1;
  const data = readJson("cards.json", {});
  res.json(getNestedWeek(data, week));
};

exports.getTestQuestions = (req, res) => {
  const week = Number(req.query.week) || 1;
  const data = readJson("testQuestions.json", {});
  res.json(getNestedWeek(data, week));
};

// ===== Infographics (MongoDB) =====
exports.listInfographics = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const docs = await Infographic.find({ week })
      .select("-data")
      .sort({ name: 1 });
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

// ===== Presentations (MongoDB) =====
exports.listPresentations = async (req, res) => {
  try {
    const week = Number(req.query.week) || 1;
    const docs = await Presentation.find({ week })
      .select("-data")
      .sort({ name: 1 });
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

// ===== Cards/Test images (filesystem) =====
exports.listCardImages = (req, res) => {
  const week = Number(req.query.week) || 1;
  const dir = path.join(UPLOADS, "cards", `week${week}`);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir);
  const byNum = {};
  for (const f of files) {
    const m = f.match(/^([fb])_(\d+)\.png$/i);
    if (!m) continue;
    const side = m[1].toLowerCase();
    const num = parseInt(m[2], 10);
    byNum[num] = byNum[num] || {};
    byNum[num][side === "f" ? "front" : "back"] = `/uploads/cards/week${week}/${f}`;
  }
  const result = Object.keys(byNum)
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b)
    .map((n) => ({ number: n, week, ...byNum[n] }));
  res.json(result);
};

exports.listTestImages = (req, res) => {
  const week = Number(req.query.week) || 1;
  const dir = path.join(UPLOADS, "testQuestions", `week${week}`);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^q(\d+)\.png$/i.test(f))
    .map((f) => {
      const n = parseInt(f.match(/\d+/)[0], 10);
      return { number: n, week, url: `/uploads/testQuestions/week${week}/${f}` };
    })
    .sort((a, b) => a.number - b.number);
  res.json(files);
};

// ===== Weeks list =====
exports.listWeeks = async (req, res) => {
  try {
    const cards = readJson("cards.json", {});
    const tests = readJson("testQuestions.json", {});
    const weeks = new Set();

    for (const k of Object.keys(cards)) {
      const m = k.match(/^week(\d+)$/);
      if (m) weeks.add(parseInt(m[1], 10));
    }
    for (const k of Object.keys(tests)) {
      const m = k.match(/^week(\d+)$/);
      if (m) weeks.add(parseInt(m[1], 10));
    }
    for (const sub of ["cards", "testQuestions"]) {
      const root = path.join(UPLOADS, sub);
      if (!fs.existsSync(root)) continue;
      for (const entry of fs.readdirSync(root)) {
        const m = entry.match(/^week(\d+)$/);
        if (m) weeks.add(parseInt(m[1], 10));
      }
    }
    const infoWeeks = await Infographic.distinct("week");
    const presWeeks = await Presentation.distinct("week");
    for (const w of infoWeeks) weeks.add(w);
    for (const w of presWeeks) weeks.add(w);

    if (weeks.size === 0) weeks.add(1);
    res.json([...weeks].sort((a, b) => a - b));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
