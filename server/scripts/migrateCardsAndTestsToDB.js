require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Card = require("../models/Card");
const TestQuestion = require("../models/TestQuestion");

const UPLOADS = path.join(__dirname, "..", "uploads");

function readImage(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return { data: fs.readFileSync(filePath), mimeType: "image/png", size: fs.statSync(filePath).size };
}

async function migrateCards() {
  const jsonPath = path.join(UPLOADS, "cards.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("cards.json not found — skipping cards");
    return;
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let total = 0, created = 0, updated = 0;

  for (const [weekKey, weekData] of Object.entries(data)) {
    const wMatch = weekKey.match(/^week(\d+)$/);
    if (!wMatch) continue;
    const week = parseInt(wMatch[1], 10);
    const weekDir = path.join(UPLOADS, "cards", weekKey);

    for (const [cardKey, cardVal] of Object.entries(weekData)) {
      const cMatch = cardKey.match(/^card(\d+)$/);
      if (!cMatch) continue;
      const number = parseInt(cMatch[1], 10);

      const frontImage = readImage(path.join(weekDir, `f_${number}.png`));
      const backImage = readImage(path.join(weekDir, `b_${number}.png`));

      const doc = {
        week,
        number,
        front: cardVal.front || "",
        back: cardVal.back || "",
        frontImage: frontImage || {},
        backImage: backImage || {},
      };

      const existing = await Card.findOne({ week, number });
      if (existing) {
        await Card.updateOne({ _id: existing._id }, doc);
        updated++;
      } else {
        await Card.create(doc);
        created++;
      }
      total++;
    }
  }
  console.log(`cards: total ${total}, created ${created}, updated ${updated}`);
}

async function migrateTestQuestions() {
  const jsonPath = path.join(UPLOADS, "testQuestions.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("testQuestions.json not found — skipping tests");
    return;
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  let total = 0, created = 0, updated = 0;

  for (const [weekKey, weekData] of Object.entries(data)) {
    const wMatch = weekKey.match(/^week(\d+)$/);
    if (!wMatch) continue;
    const week = parseInt(wMatch[1], 10);
    const weekDir = path.join(UPLOADS, "testQuestions", weekKey);

    for (const [qKey, qVal] of Object.entries(weekData)) {
      const qMatch = qKey.match(/^question(\d+)$/);
      if (!qMatch) continue;
      const number = parseInt(qMatch[1], 10);

      const image = readImage(path.join(weekDir, `q${number}.png`));

      const doc = {
        week,
        number,
        question: qVal.question || "",
        answers: qVal.answers || {},
        hint: qVal.hint || "",
        correct: qVal.correct || "A",
        image: image || {},
      };

      const existing = await TestQuestion.findOne({ week, number });
      if (existing) {
        await TestQuestion.updateOne({ _id: existing._id }, doc);
        updated++;
      } else {
        await TestQuestion.create(doc);
        created++;
      }
      total++;
    }
  }
  console.log(`tests: total ${total}, created ${created}, updated ${updated}`);
}

async function main() {
  await connectDB();
  console.log("Migrating cards...");
  await migrateCards();
  console.log("Migrating test questions...");
  await migrateTestQuestions();
  await mongoose.connection.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
