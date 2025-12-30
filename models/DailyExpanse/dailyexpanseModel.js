import mongoose from 'mongoose';

const expanseSchema = new mongoose.Schema(
  {
    Expanse_name: { type: String, required: true },
    Amount: { type: Number, required: true },
    Category: { type: String, required: true },
    Remarks: { type: String },
    Debit: { type: String },
    Account_Title: { type: String, required: true },
	 	Account_Number:{ type: String, required: true },
  
    // Date field: Manually entered and required
		indate: {
			type: Date,
			required: true,
			validate: {
				validator: function(value) {
					return !isNaN(Date.parse(value)); // Check if the value is a valid date
				},
				message: props => `${props.value} is not a valid date!`
			}
		},

    // New status field: 0 for active, 1 for soft deleted
    status: { type: Number, default: 0 },

    // For report
    Total_Expanse_name: { type: Number },
    Total_Amount_with_Category: { type: Number },
    Total_Amount: { type: Number },

  },
  { timestamps: false }  // Disable automatic timestamp fields created_at and updated_at
);


const DailyExpanse = mongoose.model('DailyExpanse', expanseSchema);
export default DailyExpanse;
