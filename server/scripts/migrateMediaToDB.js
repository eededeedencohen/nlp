require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Infographic = require("../models/Infographic");
const Presentation = require("../models/Presentation");

const UPLOADS = path.join(__dirname, "..", "uploads");

function mimeFromExt(ext) {
  const e = ext.toLowerCase().replace(".", "");
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "png") return "image/png";
  if (e === "gif") return "image/gif";
  if (e === "webp") return "image/webp";
  if (e === "pdf") return "application/pdf";
  return "application/octet-stream";
}

async function migrate(subdir, Model, allowedRegex) {
  const root = path.join(UPLOADS, subdir);
  if (!fs.existsSync(root)) {
    console.log(`${subdir}: no folder`);
    return;
  }
  for (const entry of fs.readdirSync(root)) {
    const m = entry.match(/^week(\d+)$/);
    if (!m) continue;
    const week = parseInt(m[1], 10);
    const weekDir = path.join(root, entry);
    const files = fs.readdirSync(weekDir).filter((f) => allowedRegex.test(f));
    for (const f of files) {
      const exists = await Model.findOne({ week, name: f });
      if (exists) {
        console.log(`  ✓ ${subdir} week${week}/${f} already in DB`);
        continue;
      }
      const fp = path.join(weekDir, f);
      const data = fs.readFileSync(fp);
      const ext = path.extname(f);
      await Model.create({
        week,
        name: f,
        mimeType: mimeFromExt(ext),
        size: data.length,
        data,
      });
      console.log(`  + imported ${subdir} week${week}/${f} (${(data.length / 1024).toFixed(1)} KB)`);
    }
  }
}

async function main() {
  await connectDB();
  console.log("Migrating infographics...");
  await migrate("infographics", Infographic, /\.(png|jpe?g|gif|webp)$/i);
  console.log("Migrating presentations...");
  await migrate("presentations", Presentation, /\.pdf$/i);
  await mongoose.connection.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
