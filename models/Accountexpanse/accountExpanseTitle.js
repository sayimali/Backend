import mongoose from "mongoose";

const accountExpanse = new mongoose.Schema({

AccountExpanseTitle:{
	type: String,
}
},
{timestamps: true}
)
export default mongoose.model("Account Expanse Title", accountExpanse);
