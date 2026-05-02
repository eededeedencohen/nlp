const mongoose = require("mongoose");

const infographicSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

infographicSchema.index({ week: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Infographic", infographicSchema);
