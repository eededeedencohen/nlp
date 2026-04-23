require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const TestAttempt = require("../models/TestAttempt");

async function main() {
  await connectDB();
  const r = await TestAttempt.updateMany(
    { week: { $exists: false } },
    { $set: { week: 1 } }
  );
  console.log("TestAttempt updated with week=1:", r.modifiedCount);
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
