const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "uploads", "cards.json");

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

function clean(s) {
  return (s || "")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const out = {};
for (const [key, val] of Object.entries(data)) {
  out[key] = { front: clean(val.front), back: clean(val.back) };
}

fs.writeFileSync(FILE, JSON.stringify(out, null, 2), "utf8");
console.log(`Cleaned ${Object.keys(out).length} entries`);
