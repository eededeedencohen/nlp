require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
  await connectDB();

  // Drop old indexes that might conflict
  try {
    const indexes = await User.collection.indexes();
    for (const idx of indexes) {
      if (idx.name === "name_1") {
        await User.collection.dropIndex("name_1");
        console.log("dropped name_1 index");
      }
    }
  } catch (e) {}

  const all = await User.collection.find({}).toArray();
  console.log("found", all.length, "users");

  for (const u of all) {
    const updates = {};
    let changed = false;

    if (!u.email) {
      // Default email scheme
      const slug = (u.name || "user")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20) || "user";
      updates.email =
        u.role === "admin" ? "eden95cohen@gmail.com" : `${slug}_${String(u._id).slice(-4)}@nlp.local`;
      changed = true;
    }
    if (!u.passwordHash) {
      const defaultPw = u.role === "admin" ? "123!@#" : "changeme";
      updates.passwordHash = await User.hashPassword(defaultPw);
      changed = true;
    }
    if (!u.role) {
      updates.role = "user";
      changed = true;
    }

    if (changed) {
      await User.collection.updateOne({ _id: u._id }, { $set: updates });
      console.log(`✓ updated ${u.name || u._id}: ${JSON.stringify({ email: updates.email })}`);
    }
  }

  await mongoose.connection.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
