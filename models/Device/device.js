import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  Device: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model("Device", deviceSchema);
