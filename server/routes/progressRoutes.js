const express = require("express");
const router = express.Router();
const {
  getMyCardProgress,
  setCardStatus,
  resetMyCardProgress,
  getAllProgressSummary,
} = require("../controllers/progressController");

router.get("/summary", getAllProgressSummary);
router.get("/:userId", getMyCardProgress);
router.post("/:userId", setCardStatus);
router.delete("/:userId", resetMyCardProgress);

module.exports = router;
