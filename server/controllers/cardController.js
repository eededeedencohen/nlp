const fs = require("fs");
const path = require("path");

const CARDS_ROOT = path.join(__dirname, "..", "uploads", "cards");
const CARDS_JSON = path.join(__dirname, "..", "uploads", "cards.json");

function weekDir(week) {
  return path.join(CARDS_ROOT, `week${week}`);
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
    const m = name.match(/^[fb]_(\d+)\.png$/i);
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

function readCardsJson() {
  if (!fs.existsSync(CARDS_JSON)) return {};
  try {
    return JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  } catch {
    return {};
  }
}

function writeCardsJson(data) {
  fs.writeFileSync(CARDS_JSON, JSON.stringify(data, null, 2), "utf8");
}

exports.getNextNumber = (req, res) => {
  const week = Number(req.query.week) || 1;
  const next = getLastNumberForWeek(week) + 1;
  res.json({ next, week });
};

exports.saveCards = (req, res) => {
  const { front, back, week = 1 } = req.body;
  const frontBuf = decodeBase64Image(front);
  const backBuf = decodeBase64Image(back);

  if (!frontBuf || !backBuf) {
    return res
      .status(400)
      .json({ error: "Both front and back images are required as base64 data URLs" });
  }

  const w = Number(week);
  const dir = weekDir(w);
  ensureDir(dir);

  const num = getLastNumberForWeek(w) + 1;
  fs.writeFileSync(path.join(dir, `f_${num}.png`), frontBuf);
  fs.writeFileSync(path.join(dir, `b_${num}.png`), backBuf);

  // Stub entry in JSON so metadata exists
  const data = readCardsJson();
  const wKey = `week${w}`;
  if (!data[wKey]) data[wKey] = {};
  const cardKey = `card${num}`;
  data[wKey][cardKey] = { ...(data[wKey][cardKey] || { front: "", back: "" }) };
  writeCardsJson(data);

  res.json({
    number: num,
    week: w,
    front: `f_${num}.png`,
    back: `b_${num}.png`,
  });
};

exports.deleteCard = (req, res) => {
  const num = parseInt(req.params.number, 10);
  const week = Number(req.query.week) || 1;
  if (!Number.isInteger(num) || num <= 0) {
    return res.status(400).json({ error: "Invalid number" });
  }

  const dir = weekDir(week);
  ensureDir(dir);
  const deleted = [];
  for (const prefix of ["f", "b"]) {
    const fp = path.join(dir, `${prefix}_${num}.png`);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      deleted.push(`${prefix}_${num}.png`);
    }
  }
  if (deleted.length === 0) {
    return res.status(404).json({ error: `No files found for week ${week} number ${num}` });
  }

  // Remove from JSON
  const data = readCardsJson();
  const wKey = `week${week}`;
  if (data[wKey]) {
    delete data[wKey][`card${num}`];
    writeCardsJson(data);
  }

  res.json({ number: num, week, deleted });
};

exports.resetAll = (req, res) => {
  const week = req.query.week ? Number(req.query.week) : null;

  const data = readCardsJson();
  let removed = 0;

  const removeWeek = (w) => {
    const dir = weekDir(w);
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const name of files) {
      if (/^[fb]_\d+\.png$/i.test(name)) {
        fs.unlinkSync(path.join(dir, name));
        removed++;
      }
    }
    delete data[`week${w}`];
  };

  if (week) {
    removeWeek(week);
  } else {
    // Reset all weeks
    if (fs.existsSync(CARDS_ROOT)) {
      for (const entry of fs.readdirSync(CARDS_ROOT)) {
        const m = entry.match(/^week(\d+)$/);
        if (m) removeWeek(parseInt(m[1], 10));
      }
    }
  }
  writeCardsJson(data);

  res.json({ removed, week });
};
