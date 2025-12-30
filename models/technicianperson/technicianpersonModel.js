import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema(
  {
    Technician_Person_name: { type: String },
		Address:{type: String},
    City: { type: String},
		Mobile_1:{type: Number},
		Mobile_2:{type: Number},
    date: { type: String },

  },
  { timestamps: true }
);

export default mongoose.model('Technician Person', technicianSchema);
