const mongoose = require("mongoose");

const presentationSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true, index: true },
    name: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

presentationSchema.index({ week: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Presentation", presentationSchema);
