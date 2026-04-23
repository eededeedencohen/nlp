const express = require("express");
const router = express.Router();
const {
  listForItem,
  addComment,
  deleteComment,
} = require("../controllers/commentController");

router.get("/:type/:number", listForItem);
router.post("/:type/:number", addComment);
router.delete("/:id", deleteComment);

module.exports = router;
