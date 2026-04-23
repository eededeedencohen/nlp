require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const CardProgress = require("../models/CardProgress");
const Comment = require("../models/Comment");

async function main() {
  await connectDB();

  const p = await CardProgress.updateMany(
    { week: { $exists: false } },
    { $set: { week: 1 } }
  );
  console.log("CardProgress updated:", p.modifiedCount);

  const c = await Comment.updateMany(
    { week: { $exists: false } },
    { $set: { week: 1 } }
  );
  console.log("Comment updated:", c.modifiedCount);

  // Drop old index if exists
  try {
    await CardProgress.collection.dropIndex("userId_1_cardNumber_1");
    console.log("dropped old CardProgress index");
  } catch (e) {
    // ignore if not exists
  }

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
