require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Card = require("../models/Card");
const TestQuestion = require("../models/TestQuestion");
const CardProgress = require("../models/CardProgress");
const TestAttempt = require("../models/TestAttempt");
const Comment = require("../models/Comment");
const User = require("../models/User");

const DATA_DIR = path.join(__dirname, "..", "..", "DATA");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function wipe() {
  console.log("Wiping old content...");
  const r1 = await Card.deleteMany({});
  console.log(`  - ${r1.deletedCount} cards deleted`);
  const r2 = await TestQuestion.deleteMany({});
  console.log(`  - ${r2.deletedCount} test questions deleted`);
  const r3 = await CardProgress.deleteMany({});
  console.log(`  - ${r3.deletedCount} card progress deleted`);
  const r4 = await TestAttempt.deleteMany({});
  console.log(`  - ${r4.deletedCount} test attempts deleted`);
  const r5 = await Comment.deleteMany({});
  console.log(`  - ${r5.deletedCount} comments deleted`);
  const r6 = await User.deleteMany({ role: { $ne: "admin" } });
  console.log(`  - ${r6.deletedCount} non-admin users deleted`);
}

async function importCards() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort();
  let total = 0;
  for (const f of files) {
    const week = parseInt(f.replace(".json", ""), 10);
    const data = readJson(path.join(DATA_DIR, f));
    const cards = data.cards || [];
    for (const c of cards) {
      await Card.create({
        week,
        number: c.id,
        front: c.question || "",
        back: c.answer || "",
      });
      total++;
    }
    console.log(`  cards week ${week}: imported ${cards.length}`);
  }
  console.log(`Cards total: ${total}`);
}

async function importTests() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d+_mc\.json$/.test(f))
    .sort();
  let total = 0;
  for (const f of files) {
    const week = parseInt(f.replace("_mc.json", ""), 10);
    const data = readJson(path.join(DATA_DIR, f));
    const qs = data.questions || [];
    for (const q of qs) {
      const opts = q.options || {};
      await TestQuestion.create({
        week,
        number: q.id,
        question: q.question || "",
        answers: {
          A: opts.A?.text || "",
          B: opts.B?.text || "",
          C: opts.C?.text || "",
          D: opts.D?.text || "",
        },
        explanations: {
          A: opts.A?.explanation || "",
          B: opts.B?.explanation || "",
          C: opts.C?.explanation || "",
          D: opts.D?.explanation || "",
        },
        hint: q.hint || "",
        correct: q.correct_option || "A",
      });
      total++;
    }
    console.log(`  tests week ${week}: imported ${qs.length}`);
  }
  console.log(`Tests total: ${total}`);
}

async function main() {
  await connectDB();
  await wipe();
  console.log("Importing cards from DATA/...");
  await importCards();
  console.log("Importing test questions from DATA/...");
  await importTests();

  // Summary
  const cards = await Card.countDocuments();
  const tests = await TestQuestion.countDocuments();
  console.log(`\n✅ Done. DB now has ${cards} cards and ${tests} test questions.`);

  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
