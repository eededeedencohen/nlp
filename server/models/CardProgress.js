const mongoose = require("mongoose");

const cardProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    week: { type: Number, required: true, default: 1 },
    cardNumber: { type: Number, required: true },
    status: { type: String, enum: ["known", "unknown"], required: true },
  },
  { timestamps: true }
);

cardProgressSchema.index({ userId: 1, week: 1, cardNumber: 1 }, { unique: true });

module.exports = mongoose.model("CardProgress", cardProgressSchema);
