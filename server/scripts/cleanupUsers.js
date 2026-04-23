require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const CardProgress = require("../models/CardProgress");
const TestAttempt = require("../models/TestAttempt");
const Comment = require("../models/Comment");

async function main() {
  await connectDB();
  const all = await User.find().sort({ createdAt: -1 });
  console.log(`Found ${all.length} users`);

  // Keep the 2 newest; delete the rest
  const keep = all.slice(0, 2);
  const remove = all.slice(2);

  console.log(
    "Keeping:",
    keep.map((u) => `${u.name} (${u.role}) — ${u.createdAt.toISOString()}`)
  );
  console.log(`Deleting ${remove.length} users`);

  for (const u of remove) {
    await CardProgress.deleteMany({ userId: u._id });
    await TestAttempt.deleteMany({ userId: u._id });
    await Comment.deleteMany({ userId: u._id });
    await User.findByIdAndDelete(u._id);
    console.log("  × removed", u.name);
  }

  await mongoose.connection.close();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
