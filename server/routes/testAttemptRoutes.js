const express = require("express");
const router = express.Router();
const {
  startAttempt,
  completeAttempt,
  saveProgress,
  getUserAttempts,
  getAllAttempts,
  deleteAttempt,
  resetUserAttempts,
} = require("../controllers/testAttemptController");

router.get("/all", getAllAttempts);
router.post("/:userId/start", startAttempt);
router.put("/save/:attemptId", saveProgress);
router.put("/complete/:attemptId", completeAttempt);
router.delete("/:attemptId", deleteAttempt);
router.delete("/user/:userId/reset", resetUserAttempts);
router.get("/:userId", getUserAttempts);

module.exports = router;
