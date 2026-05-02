const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/cards", require("./routes/cardRoutes"));
app.use("/api/test-questions", require("./routes/testQuestionRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/attempts", require("./routes/testAttemptRoutes"));
app.use("/api/content", require("./routes/contentRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

// Serve built client (SPA). Falls back to index.html for any non-API route.
// Prefer server/dist (local deploy workflow); fall back to client/dist (CI build).
const candidates = [
  path.join(__dirname, "dist"),
  path.join(__dirname, "..", "client", "dist"),
];
const clientDist = candidates.find((p) => fs.existsSync(p));
if (clientDist) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  console.log(`Serving client from: ${clientDist}`);
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Shekel API is running (no built client found)" });
  });
}

module.exports = app;
