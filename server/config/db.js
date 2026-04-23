const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.DATABASE) {
      throw new Error(
        "Missing DATABASE env var (expected MongoDB connection string)"
      );
    }
    let DB = process.env.DATABASE;
    if (DB.includes("<PASSWORD>")) {
      if (!process.env.DATABASE_PASSWORD) {
        throw new Error(
          "DATABASE contains <PASSWORD> placeholder but DATABASE_PASSWORD env var is missing"
        );
      }
      DB = DB.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
    }
    await mongoose.connect(DB);
    console.log("✅ DB connection successful");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
