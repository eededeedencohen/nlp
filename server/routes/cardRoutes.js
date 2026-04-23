const express = require("express");
const router = express.Router();
const {
  saveCards,
  getNextNumber,
  deleteCard,
  resetAll,
} = require("../controllers/cardController");

router.get("/next", getNextNumber);
router.post("/", saveCards);
router.delete("/reset", resetAll);
router.delete("/:number", deleteCard);

module.exports = router;
