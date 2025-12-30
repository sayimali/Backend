import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
  Package: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("Package", packageSchema);
