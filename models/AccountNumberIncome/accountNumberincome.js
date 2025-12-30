import mongoose from "mongoose";

const accountIncomeNum = new mongoose.Schema({

AccountIncomeNumber:{
	type: String,
}
},
{timestamps: true}
)
export default mongoose.model("Account Number Income", accountIncomeNum);
