require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const CardProgress = require("../models/CardProgress");
const TestAttempt = require("../models/TestAttempt");
const Comment = require("../models/Comment");

async function main() {
  await connectDB();
  const toDelete = await User.find({ role: { $ne: "admin" } });
  console.log(`Deleting ${toDelete.length} non-admin users`);
  for (const u of toDelete) {
    await CardProgress.deleteMany({ userId: u._id });
    await TestAttempt.deleteMany({ userId: u._id });
    await Comment.deleteMany({ userId: u._id });
    await User.findByIdAndDelete(u._id);
  }
  const remaining = await User.find().select("name email role");
  console.log("Remaining:", remaining.map((u) => `${u.role}: ${u.name} (${u.email})`));
  await mongoose.connection.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
