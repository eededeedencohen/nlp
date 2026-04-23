const fs = require("fs");
const path = require("path");

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

function writeJson(file, data) {
  fs.writeFileSync(path.join(UPLOADS, file), JSON.stringify(data, null, 2), "utf8");
}

function getNestedWeek(data, week) {
  if (!data) return {};
  return data[`week${week}`] || {};
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

// ===== Card/test JSON text =====
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

// ===== Infographics =====
exports.listInfographics = (req, res) => {
  const week = Number(req.query.week) || 1;
  const dir = path.join(UPLOADS, "infographics", `week${week}`);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
    .sort((a, b) => {
      const na = parseInt((a.match(/\d+/) || [0])[0], 10);
      const nb = parseInt((b.match(/\d+/) || [0])[0], 10);
      return na - nb;
    })
    .map((f) => ({
      name: f,
      url: `/uploads/infographics/week${week}/${f}`,
      week,
    }));
  res.json(files);
};

exports.uploadInfographic = (req, res) => {
  const { file, filename, week = 1 } = req.body;
  const decoded = decodeBase64(file);
  if (!decoded) return res.status(400).json({ error: "Invalid file (expected data URL)" });
  if (!/^image\//.test(decoded.mime)) {
    return res.status(400).json({ error: "Only image files are allowed" });
  }
  const ext = (decoded.mime.split("/")[1] || "png").toLowerCase();
  const base =
    sanitizeName((filename || "").replace(/\.[^.]+$/, "")) || `infographic_${Date.now()}`;
  const final = `${base}.${ext}`;

  const w = Number(week);
  const dir = path.join(UPLOADS, "infographics", `week${w}`);
  ensureDir(dir);

  let target = path.join(dir, final);
  let counter = 1;
  while (fs.existsSync(target)) {
    target = path.join(dir, `${base}_${counter}.${ext}`);
    counter++;
  }
  fs.writeFileSync(target, decoded.buf);
  const savedName = path.basename(target);
  res.status(201).json({
    name: savedName,
    week: w,
    url: `/uploads/infographics/week${w}/${savedName}`,
  });
};

exports.deleteInfographic = (req, res) => {
  const week = Number(req.query.week) || 1;
  const name = req.params.name;
  const fp = path.join(UPLOADS, "infographics", `week${week}`, name);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(fp);
  res.json({ ok: true, name, week });
};

// ===== Presentations =====
exports.listPresentations = (req, res) => {
  const week = Number(req.query.week) || 1;
  const dir = path.join(UPLOADS, "presentations", `week${week}`);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.pdf$/i.test(f))
    .map((f) => ({
      name: f,
      url: `/uploads/presentations/week${week}/${f}`,
      week,
    }));
  res.json(files);
};

exports.uploadPresentation = (req, res) => {
  const { file, filename, week = 1 } = req.body;
  const decoded = decodeBase64(file);
  if (!decoded) return res.status(400).json({ error: "Invalid file (expected data URL)" });
  if (decoded.mime !== "application/pdf") {
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }
  const base =
    sanitizeName((filename || "").replace(/\.[^.]+$/, "")) || `presentation_${Date.now()}`;
  const final = `${base}.pdf`;

  const w = Number(week);
  const dir = path.join(UPLOADS, "presentations", `week${w}`);
  ensureDir(dir);

  let target = path.join(dir, final);
  let counter = 1;
  while (fs.existsSync(target)) {
    target = path.join(dir, `${base}_${counter}.pdf`);
    counter++;
  }
  fs.writeFileSync(target, decoded.buf);
  const savedName = path.basename(target);
  res.status(201).json({
    name: savedName,
    week: w,
    url: `/uploads/presentations/week${w}/${savedName}`,
  });
};

exports.deletePresentation = (req, res) => {
  const week = Number(req.query.week) || 1;
  const name = req.params.name;
  const fp = path.join(UPLOADS, "presentations", `week${week}`, name);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(fp);
  res.json({ ok: true, name, week });
};

// ===== Card & test images =====
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
exports.listWeeks = (req, res) => {
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
  for (const sub of ["cards", "testQuestions", "infographics", "presentations"]) {
    const root = path.join(UPLOADS, sub);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const m = entry.match(/^week(\d+)$/);
      if (m) weeks.add(parseInt(m[1], 10));
    }
  }

  if (weeks.size === 0) weeks.add(1);
  res.json([...weeks].sort((a, b) => a - b));
};
