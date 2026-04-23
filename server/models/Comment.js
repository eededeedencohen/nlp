const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType: { type: String, enum: ["card", "question"], required: true },
    week: { type: Number, required: true, default: 1 },
    itemNumber: { type: Number, required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

commentSchema.index({ itemType: 1, week: 1, itemNumber: 1 });

module.exports = mongoose.model("Comment", commentSchema);
