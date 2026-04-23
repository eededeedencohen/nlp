require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const seedDefaults = require("./config/seed");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => seedDefaults())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
