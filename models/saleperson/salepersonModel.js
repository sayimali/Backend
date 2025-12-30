import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema(
  {
    Sale_Person_name: { type: String },
		Address:{type: String},
    City: { type: String },
		Deluxe:{type: String},
		Ultimate:{type: String},
		Self:{type:String},
		Mobile_1:{type: Number},
		Mobile_2:{type: Number},
    date: { type: String },

  },
  { timestamps: true }
);

export default mongoose.model('Sale Person', saleSchema);
