const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionNumber: { type: Number, required: true },
    selected: { type: String, enum: ["A", "B", "C", "D", null], default: null },
    correct: { type: String, enum: ["A", "B", "C", "D"], required: true },
    isCorrect: { type: Boolean, required: true },
    hintUsed: { type: Boolean, default: false },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    week: { type: Number, required: true, default: 1 },
    attemptNumber: { type: Number, required: true },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

testAttemptSchema.index({ userId: 1, week: 1, attemptNumber: -1 });

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
