import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Unique email constraint
  Mobile_1: { type: Number, required: true },
  Mobile_2: { type: Number, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' } // Role can be user or admin
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;
