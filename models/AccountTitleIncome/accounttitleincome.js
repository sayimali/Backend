import mongoose from "mongoose";

const accountIncome = new mongoose.Schema({

AccountTitleIncome:{
	type: String,
}
},
{timestamps: true}
)
export default mongoose.model("Account Title Income", accountIncome);
