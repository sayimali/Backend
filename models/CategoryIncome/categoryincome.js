import mongoose from "mongoose";

const categoryIncome = new mongoose.Schema({

CategoryIncome:{
	type: String,
	required: true,
}
},
{timestamps: true}
)

export default mongoose.model("Category Income", categoryIncome);
