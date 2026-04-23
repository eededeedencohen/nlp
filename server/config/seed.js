const User = require("../models/User");

async function dropLegacyIndexes() {
  try {
    const indexes = await User.collection.indexes();
    for (const idx of indexes) {
      if (idx.name === "email_1") {
        await User.collection.dropIndex("email_1");
        console.log("✓ Dropped legacy email index");
      }
    }
  } catch (e) {
    // collection might not exist yet
  }
}

async function seedDefaults() {
  await dropLegacyIndexes();
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    await User.create({ name: "מנהל", role: "admin" });
    console.log("✅ Seeded admin user");
  }
  const users = await User.countDocuments({ role: "user" });
  if (users === 0) {
    await User.create({ name: "משתמש ראשון", role: "user" });
    console.log("✅ Seeded default user");
  }
}

module.exports = seedDefaults;
