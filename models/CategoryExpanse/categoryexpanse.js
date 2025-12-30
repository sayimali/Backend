import mongoose from "mongoose";

const categoryExpanse = new mongoose.Schema({

CategoryExpanse:{
	type: String,
	required: true,
}
},
{timestamps: true}
)
export default mongoose.model("Category Expanse", categoryExpanse);
