const mongoose = require("mongoose");

const explanationsSubschema = new mongoose.Schema(
  {
    A: { type: String, default: "" },
    B: { type: String, default: "" },
    C: { type: String, default: "" },
    D: { type: String, default: "" },
  },
  { _id: false }
);

const answersSubschema = new mongoose.Schema(
  {
    A: { type: String, default: "" },
    B: { type: String, default: "" },
    C: { type: String, default: "" },
    D: { type: String, default: "" },
  },
  { _id: false }
);

const imageSubschema = new mongoose.Schema(
  {
    data: { type: Buffer },
    mimeType: { type: String, default: "image/png" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const testQuestionSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true, index: true },
    number: { type: Number, required: true },
    question: { type: String, default: "" },
    answers: { type: answersSubschema, default: () => ({}) },
    explanations: { type: explanationsSubschema, default: () => ({}) },
    hint: { type: String, default: "" },
    correct: { type: String, enum: ["A", "B", "C", "D"], default: "A" },
    image: { type: imageSubschema, default: () => ({}) },
  },
  { timestamps: true }
);

testQuestionSchema.index({ week: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("TestQuestion", testQuestionSchema);
