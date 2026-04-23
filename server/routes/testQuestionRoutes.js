const express = require("express");
const router = express.Router();
const {
  saveQuestion,
  getNextNumber,
  deleteQuestion,
  resetAll,
} = require("../controllers/testQuestionController");

router.get("/next", getNextNumber);
router.post("/", saveQuestion);
router.delete("/reset", resetAll);
router.delete("/:number", deleteQuestion);

module.exports = router;
