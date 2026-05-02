require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const CardProgress = require("../models/CardProgress");
const TestAttempt = require("../models/TestAttempt");
const Comment = require("../models/Comment");

async function main() {
  await connectDB();

  // Remove users that have no name OR no role
  const orphans = await User.collection
    .find({
      $or: [{ name: { $exists: false } }, { name: null }, { name: "" }],
    })
    .toArray();
  console.log(`found ${orphans.length} orphan user docs`);

  for (const u of orphans) {
    await CardProgress.deleteMany({ userId: u._id });
    await TestAttempt.deleteMany({ userId: u._id });
    await Comment.deleteMany({ userId: u._id });
    await User.collection.deleteOne({ _id: u._id });
  }
  console.log("removed orphans");

  const remaining = await User.find().select("name email role");
  console.log("remaining users:");
  for (const u of remaining) {
    console.log(`  · ${u.role}: ${u.name} (${u.email})`);
  }

  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
