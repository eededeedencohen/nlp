const mongoose = require("mongoose");

const imageSubschema = new mongoose.Schema(
  {
    data: { type: Buffer },
    mimeType: { type: String, default: "image/png" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const cardSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true, index: true },
    number: { type: Number, required: true },
    front: { type: String, default: "" },
    back: { type: String, default: "" },
    frontImage: { type: imageSubschema, default: () => ({}) },
    backImage: { type: imageSubschema, default: () => ({}) },
  },
  { timestamps: true }
);

cardSchema.index({ week: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Card", cardSchema);
