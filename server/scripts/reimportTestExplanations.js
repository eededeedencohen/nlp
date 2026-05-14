require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const TestQuestion = require("../models/TestQuestion");

const DATA_DIR = path.join(__dirname, "..", "..", "DATA");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function main() {
  await connectDB();
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d+_mc\.json$/.test(f))
    .sort();

  let updated = 0;
  for (const f of files) {
    const week = parseInt(f.replace("_mc.json", ""), 10);
    const data = readJson(path.join(DATA_DIR, f));
    const qs = data.questions || [];
    for (const q of qs) {
      const opts = q.options || {};
      const r = await TestQuestion.updateOne(
        { week, number: q.id },
        {
          $set: {
            explanations: {
              A: opts.A?.explanation || "",
              B: opts.B?.explanation || "",
              C: opts.C?.explanation || "",
              D: opts.D?.explanation || "",
            },
          },
        }
      );
      if (r.matchedCount) updated++;
    }
    console.log(`  tests week ${week}: updated ${qs.length}`);
  }
  console.log(`Total updated: ${updated}`);

  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
