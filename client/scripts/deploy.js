import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "..", "dist");
const dst = path.join(__dirname, "..", "..", "server", "dist");

if (!fs.existsSync(src)) {
  console.error("✗ client/dist not found — did the build fail?");
  process.exit(1);
}

if (fs.existsSync(dst)) {
  fs.rmSync(dst, { recursive: true, force: true });
}
fs.mkdirSync(dst, { recursive: true });
fs.cpSync(src, dst, { recursive: true });
console.log(`✓ Deployed client/dist → ${path.relative(process.cwd(), dst)}`);
