import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  City: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("City", citySchema);
