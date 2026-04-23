const fs = require("fs");
const path = require("path");

const UPLOADS = path.join(__dirname, "..", "uploads");
const CARDS_DIR = path.join(UPLOADS, "cards");
const TEST_DIR = path.join(UPLOADS, "testQuestions");
const CARDS_JSON = path.join(UPLOADS, "cards.json");
const TEST_JSON = path.join(UPLOADS, "testQuestions.json");

function migrateCards() {
  const files = fs.readdirSync(CARDS_DIR);
  const imageFiles = files.filter((f) => /^[fb]_\d+\.png$/i.test(f));
  if (imageFiles.length === 0) {
    console.log("cards: no flat files to migrate");
    return;
  }

  const week1Dir = path.join(CARDS_DIR, "week1");
  if (!fs.existsSync(week1Dir)) fs.mkdirSync(week1Dir, { recursive: true });

  for (const f of imageFiles) {
    const src = path.join(CARDS_DIR, f);
    const dst = path.join(week1Dir, f);
    fs.renameSync(src, dst);
  }
  console.log(`cards: moved ${imageFiles.length} files into cards/week1/`);
}

function migrateCardsJson() {
  if (!fs.existsSync(CARDS_JSON)) return;
  const data = JSON.parse(fs.readFileSync(CARDS_JSON, "utf8"));
  // Already nested by week?
  const keys = Object.keys(data);
  if (keys.every((k) => /^week\d+$/.test(k))) {
    console.log("cards.json: already nested by week");
    return;
  }

  const nested = {};
  for (const [key, val] of Object.entries(data)) {
    const w = val.week || 1;
    const wKey = `week${w}`;
    if (!nested[wKey]) nested[wKey] = {};
    nested[wKey][key] = { ...val };
    delete nested[wKey][key].week;
  }
  fs.writeFileSync(CARDS_JSON, JSON.stringify(nested, null, 2), "utf8");
  console.log(`cards.json: nested by week (${Object.keys(nested).length} weeks)`);
}

function migrateTests() {
  if (!fs.existsSync(TEST_DIR)) return;
  const files = fs.readdirSync(TEST_DIR);
  const imageFiles = files.filter((f) => /^q\d+\.png$/i.test(f));
  if (imageFiles.length === 0) {
    console.log("tests: no flat files to migrate");
    return;
  }

  const week1Dir = path.join(TEST_DIR, "week1");
  if (!fs.existsSync(week1Dir)) fs.mkdirSync(week1Dir, { recursive: true });

  for (const f of imageFiles) {
    const src = path.join(TEST_DIR, f);
    const dst = path.join(week1Dir, f);
    fs.renameSync(src, dst);
  }
  console.log(`tests: moved ${imageFiles.length} files into testQuestions/week1/`);
}

function migrateTestJson() {
  if (!fs.existsSync(TEST_JSON)) return;
  const data = JSON.parse(fs.readFileSync(TEST_JSON, "utf8"));
  const keys = Object.keys(data);
  if (keys.every((k) => /^week\d+$/.test(k))) {
    console.log("testQuestions.json: already nested by week");
    return;
  }

  const nested = {};
  for (const [key, val] of Object.entries(data)) {
    const w = val.week || 1;
    const wKey = `week${w}`;
    if (!nested[wKey]) nested[wKey] = {};
    nested[wKey][key] = { ...val };
    delete nested[wKey][key].week;
  }
  fs.writeFileSync(TEST_JSON, JSON.stringify(nested, null, 2), "utf8");
  console.log(`testQuestions.json: nested by week (${Object.keys(nested).length} weeks)`);
}

migrateCards();
migrateCardsJson();
migrateTests();
migrateTestJson();
console.log("Migration done.");
