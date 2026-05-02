const User = require("../models/User");

async function dropLegacyIndexes() {
  try {
    const indexes = await User.collection.indexes();
    for (const idx of indexes) {
      // Old unique index on name (we now use email as unique)
      if (idx.name === "name_1") {
        await User.collection.dropIndex("name_1");
        console.log("✓ Dropped legacy name index");
      }
    }
  } catch (e) {
    // ignore
  }
}

async function seedDefaults() {
  await dropLegacyIndexes();

  // Admin
  const adminEmail = "eden95cohen@gmail.com";
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    await User.create({
      name: "מנהל",
      email: adminEmail,
      passwordHash: await User.hashPassword("123!@#"),
      role: "admin",
    });
    console.log("✅ Seeded admin user (" + adminEmail + ")");
  }

  // Default user (only if no regular users exist)
  const userCount = await User.countDocuments({ role: "user" });
  if (userCount === 0) {
    await User.create({
      name: "משתמש ראשון",
      email: "user@nlp.local",
      passwordHash: await User.hashPassword("changeme"),
      role: "user",
    });
    console.log("✅ Seeded default user");
  }
}

module.exports = seedDefaults;
