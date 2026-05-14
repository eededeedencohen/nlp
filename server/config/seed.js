const User = require("../models/User");

async function dropLegacyIndexes() {
  try {
    const indexes = await User.collection.indexes();
    for (const idx of indexes) {
      if (idx.name === "name_1") {
        await User.collection.dropIndex("name_1");
        console.log("✓ Dropped legacy name index");
      }
    }
  } catch (e) {}
}

async function seedDefaults() {
  await dropLegacyIndexes();

  // Admin
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    await User.create({
      name: "מנהל",
      username: "admin",
      email: "eden95cohen@gmail.com",
      passwordHash: await User.hashPassword("123!@#"),
      role: "admin",
    });
    console.log("✅ Seeded admin user (username: admin)");
  } else if (!admin.username) {
    admin.username = "admin";
    await admin.save();
    console.log("✓ Added username 'admin' to existing admin");
  }
}

module.exports = seedDefaults;
