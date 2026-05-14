const express = require("express");
const router = express.Router();
const c = require("../controllers/contentController");

router.get("/weeks", c.listWeeks);
router.get("/cards-data", c.getCardsData);
router.get("/test-questions-data", c.getTestQuestions);
router.get("/card-images", c.listCardImages);
router.get("/cards/:week/:number/:side", c.streamCardImage);
router.get("/test-images", c.listTestImages);
router.get("/test-images/:week/:number", c.streamTestImage);

router.get("/infographics", c.listInfographics);
router.post("/infographics", c.uploadInfographic);
router.get("/infographics/:id/file", c.streamInfographic);
router.delete("/infographics/:id", c.deleteInfographic);

router.get("/presentations", c.listPresentations);
router.post("/presentations", c.uploadPresentation);
router.get("/presentations/:id/file", c.streamPresentation);
router.delete("/presentations/:id", c.deletePresentation);

module.exports = router;
