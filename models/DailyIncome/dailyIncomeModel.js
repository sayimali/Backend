// Import required libraries
import mongoose from 'mongoose';

// Define the income schema
const incomeSchema = new mongoose.Schema({
  // Salesperson data
  Sale_Person_name: { type: String },
  Vehicle: { type: String },
  PartyName: { type: String },
  Category: { type: String, },
  Device: { type: String },
  Package: { type: String, },
  Subscription_Amount: { type: Number, },
  Amount_Received: { type: Number, },
  Saleperson_FixedPrice: { type: Number,  },
  Excess_Amount: { type: Number }, // Auto-generate it is - amouont
  Pending_Payment: { type: Number }, // Auto-generate it is + amouont
  Pending_Recovery: {type: String},
  Inofcsaleperson: {type: String},
  City: { type: String },
  Account_Title_SalePerson: { type: String },
	Account_Title_Number: { type: String },
  Sale_Person_Remarks: { type: String },

  // Technician data
  Technician_Person_name: { type: String, },
  Technicianperson_Price: { type: Number,  },
  Travelling_Expense_Technician: { type: Number, },
  Technician_Expanse: { type: Number },
  Account_Title_TechnicianPerson: { type: String },
  Technician_Person_Remarks: { type: String },
  Techniciancost: { type: String  },
  Technicianfuel: { type: String },
  
  Total_Amount: { type: Number },

  // Date field: Manually entered and required
  indate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !isNaN(Date.parse(value)); // Check if the value is a valid date
      },
      message: props => `${props.value} is not a valid date!`
    }
  },

  // Status field: 0 for active, 1 for soft deleted
  status: { type: Number, default: 0 },

  // For report
  Total_Sale_Person: { type: Number },
  Total_Vehicle: { type: Number },
  Total_Amount_Received: { type: Number },
  Total_Saleperson_FixedPrice: { type: Number },
  Total_Technician_Person: { type: Number },
  Total_Technician_Expanse: { type: Number },
  Total_Remaining_Amount: { type: Number },
  Total_Amount_with_Category: { type: Number },
  Total_Amount: { type: Number }
}, { timestamps: true });

// Export the model
const DailyIncome = mongoose.model('DailyIncome', incomeSchema);
export default DailyIncome;
