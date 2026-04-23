const fs = require("fs");
const path = require("path");
const { createWorker } = require("tesseract.js");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "cards");
const OUTPUT_FILE = path.join(__dirname, "..", "uploads", "cards.json");

function getAllNumbers() {
  const files = fs.readdirSync(UPLOAD_DIR);
  const nums = new Set();
  for (const name of files) {
    const m = name.match(/^[fb]_(\d+)\.png$/i);
    if (m) nums.add(parseInt(m[1], 10));
  }
  return Array.from(nums).sort((a, b) => a - b);
}

function cleanText(raw) {
  return (raw || "")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const numbers = getAllNumbers();
  console.log(`Found ${numbers.length} card numbers`);

  const worker = await createWorker(["heb", "eng"]);

  const result = {};
  for (const n of numbers) {
    const frontPath = path.join(UPLOAD_DIR, `f_${n}.png`);
    const backPath = path.join(UPLOAD_DIR, `b_${n}.png`);

    const out = { front: "", back: "" };

    if (fs.existsSync(frontPath)) {
      const { data } = await worker.recognize(frontPath);
      out.front = cleanText(data.text);
    }
    if (fs.existsSync(backPath)) {
      const { data } = await worker.recognize(backPath);
      out.back = cleanText(data.text);
    }

    result[`card${n}`] = out;
    console.log(`card${n}: front="${out.front}" | back="${out.back}"`);
  }

  await worker.terminate();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");
  console.log(`\nSaved to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
