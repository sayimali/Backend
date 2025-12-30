import mongoose from "mongoose";

const accountExpanseNumber = new mongoose.Schema({

AccountExpanseNumber:{
	type: String,
}
},
{timestamps: true}
)
export default mongoose.model("Account Expanse Number", accountExpanseNumber);
