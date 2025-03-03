import mongoose from "mongoose";

// Existing Sheet Schema
const SheetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    data: {
      type: Object, // Store sheet data (e.g., cell values)
      default: {},
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel", // Link to User model
      required: true,
    },
  },
  { timestamps: true }
);

// Create Sheet model
const Sheet = mongoose.model("Sheet", SheetSchema);
export { Sheet };
