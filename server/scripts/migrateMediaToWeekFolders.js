const fs = require("fs");
const path = require("path");

const UPLOADS = path.join(__dirname, "..", "uploads");

function migrate(subdir, regex, metaFile) {
  const root = path.join(UPLOADS, subdir);
  if (!fs.existsSync(root)) return;

  const entries = fs.readdirSync(root);
  const loose = entries.filter((f) => {
    const full = path.join(root, f);
    if (!fs.statSync(full).isFile()) return false;
    return regex.test(f);
  });
  if (loose.length === 0) {
    console.log(`${subdir}: nothing to migrate`);
    return;
  }

  // Read metadata to know which week each file belongs to
  const metaPath = path.join(UPLOADS, metaFile);
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, "utf8"))
    : {};

  for (const f of loose) {
    const week = meta[f]?.week || 1;
    const weekDir = path.join(root, `week${week}`);
    if (!fs.existsSync(weekDir)) fs.mkdirSync(weekDir, { recursive: true });
    fs.renameSync(path.join(root, f), path.join(weekDir, f));
    console.log(`${subdir}: moved ${f} → week${week}/`);
  }
}

migrate("infographics", /\.(png|jpe?g|gif|webp)$/i, "infographics-meta.json");
migrate("presentations", /\.pdf$/i, "presentations-meta.json");
console.log("Media migration done.");
