const express = require("express");
const router = express.Router();
const c = require("../controllers/contentController");

router.get("/weeks", c.listWeeks);
router.get("/cards-data", c.getCardsData);
router.get("/test-questions-data", c.getTestQuestions);
router.get("/card-images", c.listCardImages);
router.get("/test-images", c.listTestImages);

router.get("/infographics", c.listInfographics);
router.post("/infographics", c.uploadInfographic);
router.delete("/infographics/:name", c.deleteInfographic);

router.get("/presentations", c.listPresentations);
router.post("/presentations", c.uploadPresentation);
router.delete("/presentations/:name", c.deletePresentation);

module.exports = router;
