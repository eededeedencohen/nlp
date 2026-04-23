const fs = require("fs");
const path = require("path");

const TESTS_ROOT = path.join(__dirname, "..", "uploads", "testQuestions");
const TESTS_JSON = path.join(__dirname, "..", "uploads", "testQuestions.json");

function weekDir(week) {
  return path.join(TESTS_ROOT, `week${week}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getLastNumberForWeek(week) {
  const dir = weekDir(week);
  ensureDir(dir);
  const files = fs.readdirSync(dir);
  let max = 0;
  for (const name of files) {
    const m = name.match(/^q(\d+)\.png$/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
}

function decodeBase64Image(dataUrl) {
  const match = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  return Buffer.from(match[1], "base64");
}

function readJson() {
  if (!fs.existsSync(TESTS_JSON)) return {};
  try {
    return JSON.parse(fs.readFileSync(TESTS_JSON, "utf8"));
  } catch {
    return {};
  }
}

function writeJson(data) {
  fs.writeFileSync(TESTS_JSON, JSON.stringify(data, null, 2), "utf8");
}

exports.getNextNumber = (req, res) => {
  const week = Number(req.query.week) || 1;
  const next = getLastNumberForWeek(week) + 1;
  res.json({ next, week });
};

exports.saveQuestion = (req, res) => {
  const { image, week = 1, correct = "A" } = req.body;
  if (!["A", "B", "C", "D"].includes(correct)) {
    return res.status(400).json({ error: "correct must be one of A, B, C, D" });
  }
  const buf = decodeBase64Image(image);
  if (!buf) {
    return res.status(400).json({ error: "Image is required as base64 data URL" });
  }

  const w = Number(week);
  const dir = weekDir(w);
  ensureDir(dir);

  const num = getLastNumberForWeek(w) + 1;
  fs.writeFileSync(path.join(dir, `q${num}.png`), buf);

  const data = readJson();
  const wKey = `week${w}`;
  if (!data[wKey]) data[wKey] = {};
  const key = `question${num}`;
  data[wKey][key] = {
    ...(data[wKey][key] || { question: "", answers: {}, hint: "" }),
    correct,
  };
  writeJson(data);

  res.json({ number: num, file: `q${num}.png`, week: w, correct });
};

exports.deleteQuestion = (req, res) => {
  const num = parseInt(req.params.number, 10);
  const week = Number(req.query.week) || 1;
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({ error: "Invalid number" });
  }

  const dir = weekDir(week);
  ensureDir(dir);
  const fp = path.join(dir, `q${num}.png`);
  if (!fs.existsSync(fp)) {
    return res.status(404).json({ error: `No file found for week ${week} number ${num}` });
  }
  fs.unlinkSync(fp);

  const data = readJson();
  const wKey = `week${week}`;
  if (data[wKey]) {
    delete data[wKey][`question${num}`];
    writeJson(data);
  }

  res.json({ number: num, week, deleted: `q${num}.png` });
};

exports.resetAll = (req, res) => {
  const week = req.query.week ? Number(req.query.week) : null;
  const data = readJson();
  let removed = 0;

  const removeWeek = (w) => {
    const dir = weekDir(w);
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const name of files) {
      if (/^q\d+\.png$/i.test(name)) {
        fs.unlinkSync(path.join(dir, name));
        removed++;
      }
    }
    delete data[`week${w}`];
  };

  if (week) {
    removeWeek(week);
  } else {
    if (fs.existsSync(TESTS_ROOT)) {
      for (const entry of fs.readdirSync(TESTS_ROOT)) {
        const m = entry.match(/^week(\d+)$/);
        if (m) removeWeek(parseInt(m[1], 10));
      }
    }
  }
  writeJson(data);

  res.json({ removed, week });
};
