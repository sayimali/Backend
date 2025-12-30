import dailyIncomeModel from '../../models/DailyIncome/dailyIncomeModel.js';
import categoryincome from '../../models/CategoryIncome/categoryincome.js';
import salepersonModel from '../../models/saleperson/salepersonModel.js';
import { calculateIncomeSummary } from '../utils/incomeUtils.js';
import { calculateIncomeTotalsByCategory } from '../utils/incomeUtils.js';
import { calculateIncomeTotalsSaleperson } from '../utils/incomeUtils.js';
import { calculateTotalstechnician} from '../utils/incomeUtils.js';
import {generateTechnicianSummary} from '../utils/incomeUtils.js';
import {generateSalespersonSummary} from '../utils/incomeUtils.js';
import { paginateResults } from '../utils/paginateResults.js'
import { buildFilter } from "../utils/filterrecords.js"; // Ensure these functions are correctly imported

import mongoose from 'mongoose';
import moment from 'moment';

//just create category
export const createCategoryIncome = async (req, res) => {
  try {
    const {
      CategoryIncome,
    } = req.body;

    const newCategory = new categoryincome({
      CategoryIncome,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', Category: savedCategory });
  } catch (error) {
    console.error('Error creating Category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get all expanse entries and their summaries (Admin only)
export const getCategoryIncome = async (req, res) => {
  try {
    const CategoryexpanseRecords = await categoryincome.find({}).sort({ _id: -1 }); // ✅ Sorting in descending order
    const categoryexpanseCount = CategoryexpanseRecords.length;

    res.status(200).json({
      Total_Category_Expanse: categoryexpanseCount,
      records: CategoryexpanseRecords,
    });
  } catch (error) {
    console.error("Error fetching category expanse records:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Function to get all expanse entries by Expanse_name with summaries (Admin only)
export const getCategoryName = async (req, res) => {
  try {
    const { name } = req.params;
    // Fetch all expenses with the given Expanse_name and status 0 (active)
    const CategoryexpanseRecords = await categoryincome.find({ CategoryIncome: name});

    if (CategoryexpanseRecords.length === 0) {
      return res.status(404).json({ message: 'No expenses found for this Category' });
    }
    res.status(200).json({
			CategoryName: name,
      records: CategoryexpanseRecords,
    });
  } catch (error) {
    console.error('Error fetching expenses by name:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSingleVehicle = async (req, res) => {
  try {
    const { Vehicle } = req.params; // Get the vehicle number from the URL params
    if (!Vehicle) {
      return res.status(400).json({ error: "Vehicle parameter is required" });
    }

    // Query the database with the vehicle number
    const vehicleData = await dailyIncomeModel.findOne({ Vehicle });

    // If no data is found, return an error
    if (!vehicleData) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Return the vehicle data as JSON
    res.json(vehicleData);
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to update an expanse entry (Admin only)
// Update sale entry (Admin only)
export const updateCategoryIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const upCategoryIncome = await categoryincome.findById(id);

    if (!upCategoryIncome) {
      return res.status(404).json({ message: 'Sale not found' });
    }
		const {
      CategoryIncome,
    } = req.body;

const existingcategory = await categoryincome.findOne({CategoryIncome})

    if (existingcategory ) {
      return res.status(400).json({ message: 'CategoryIncome is already register' });
    }


    if (!CategoryIncome ) {
      return res.status(400).json({ message: 'category is already register' });
    }

// Update fields from request body
Object.keys(req.body).forEach((field) => {
	upCategoryIncome[field] = req.body[field] ?? upCategoryIncome[field];
});


const updatedSale = await upCategoryIncome.save();
    res.status(200).json({ message: 'Sale entry updated successfully', sale: updatedSale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Function to soft delete an expanse entry (Admin only)
export const deleteCategory = async (req, res) => {
  try {

		const { id } = req.params;
    const deleteCategory = await  categoryincome.findByIdAndDelete(id);
    if (!deleteCategory) {
      return res.status(404).json({ message: 'deleteCategory not found' });
    }

    res.status(200).json({ message: 'categoryexpanse record marked as inactive' });
  } catch (error) {
    console.error('Error marking expanse as inactive:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export const createIncome = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let {
      Sale_Person_name, Vehicle, PartyName, Category, Device, Package, Subscription_Amount,
      Amount_Received, Saleperson_FixedPrice, Pending_Recovery, Inofcsaleperson, City, 
      Account_Title_SalePerson, Account_Title_Number, Sale_Person_Remarks, Technician_Person_name, 
      Technicianperson_Price, Travelling_Expense_Technician, Account_Title_TechnicianPerson, 
      Technician_Person_Remarks, Techniciancost, Technicianfuel, indate
    } = req.body;

    if (!indate || !/^\d{4}-\d{2}-\d{2}$/.test(indate)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const parseNumber = (value) => (value ? Number(value) || 0 : 0);

    let technicianPrice = parseNumber(Technicianperson_Price);
    let travellingExpense = parseNumber(Travelling_Expense_Technician);
    let amountReceived = parseNumber(Amount_Received);
    let fixedPrice = parseNumber(Saleperson_FixedPrice);
    let adjustedFixedPrice = 0; // ✅ Declare early so it's accessible globally

    let subscriptionAmount = parseNumber(Subscription_Amount);
    let pendingRecovery = parseNumber(Pending_Recovery);

    let Technician_Expanse = technicianPrice + travellingExpense;

    const existingInstallation = await dailyIncomeModel.findOne({ Vehicle, Category: "New Installation" }).session(session);

    let Pending_Payment = 0;
    let Excess_Amount = 0;
    let Total_Amount = 0;

    switch (Category) {
      case "New Installation":
        adjustedFixedPrice = fixedPrice; // ✅ Just assign, no 'let'
      
        if (Technicianfuel === "Saleperson") {
          adjustedFixedPrice += travellingExpense; // ✅ fuel gets added here
        }
      
        Pending_Payment = (Inofcsaleperson === "Yes")
          ? Math.max(subscriptionAmount - amountReceived, 0)
          : Math.max(adjustedFixedPrice - amountReceived, 0);
      
        Excess_Amount = (Inofcsaleperson !== "Yes")
          ? Math.max(amountReceived - adjustedFixedPrice, 0)
          : 0;
        break;
      
        case "AMC":
          adjustedFixedPrice = fixedPrice; // ✅ Set it here
        
          if (amountReceived > adjustedFixedPrice) {
            Excess_Amount = amountReceived - adjustedFixedPrice;
            Pending_Payment = 0;
          } else {
            Excess_Amount = 0;
            Pending_Payment = adjustedFixedPrice - amountReceived;
          }
          break;

        case "Redo":
/*        if (Techniciancost === "Company") amountReceived = Math.max(amountReceived - Technician_Expanse, 0); */
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = subscriptionAmount - amountReceived  ;
        } 

        if (existingInstallation) {
          await dailyIncomeModel.updateOne(
            { _id: existingInstallation._id },
            { Device, Package },
            { session }
          );
        }
        break;

case "Recovery":
  
  break;
  
      case "Removal":
      case "Removal Transfer":
      case "Transfer":
/*        if (Techniciancost === "Company") amountReceived = Math.max(amountReceived - Technician_Expanse, 0); */
/*        Total_Amount = amountReceived; */
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = subscriptionAmount - amountReceived  ;
        } 
      
        break; 
      case "OwnerShipChange":
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = subscriptionAmount - amountReceived  ;
        } 

      if (existingInstallation) {
          await dailyIncomeModel.updateOne(
            { _id: existingInstallation._id },
            { PartyName },
            { session }
          );
        }
        Total_Amount = amountReceived;
        break;

      default:
        return res.status(400).json({ message: "Invalid category provided." });
    }

    Total_Amount = Number(Total_Amount.toFixed(2));
    Pending_Payment = Number(Pending_Payment.toFixed(2));
    Excess_Amount = Number(Excess_Amount.toFixed(2));

    const newIncome = new dailyIncomeModel({
      Inofcsaleperson,
      Sale_Person_name,
      Vehicle,
      PartyName,
      Category,
      Device,
      Package,
      Subscription_Amount,
      Amount_Received: amountReceived,
      Saleperson_FixedPrice: adjustedFixedPrice, // ✅ fix here
      Pending_Recovery,
      Pending_Payment,
      Excess_Amount,
      City,
      Account_Title_SalePerson,
      Account_Title_Number,
      Sale_Person_Remarks,
      Technician_Person_name,
      Technicianperson_Price: technicianPrice,
      Travelling_Expense_Technician: travellingExpense,
      Technician_Expanse,
      Account_Title_TechnicianPerson,
      Techniciancost,
      Technicianfuel,
      Technician_Person_Remarks,
      Total_Amount,
      indate: new Date(indate),
    });

    await newIncome.save({ session });
    await session.commitTransaction();

    res.status(201).json(newIncome);
  } catch (error) {
    console.error("Error creating income:", error);
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error });
  } finally {
    session.endSession();
  }
};
// it is for 1 time update data of income

export const createHistory = async(req, res) => 

await VehicleHistory.create({
  vehicleNumber: req.body.vehicleNumber,
  actionType: "CREATE",
  performedBy: req.user?.name || "System",
  newData: req.body,
});


export const updateExistingIncomes = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const allRecords = await dailyIncomeModel.find().session(session);

    for (let record of allRecords) {
      let {
        _id, Sale_Person_name, Vehicle, PartyName, Category, Device, Package, Subscription_Amount,
        Amount_Received, Saleperson_FixedPrice, Pending_Recovery, Inofcsaleperson, City, 
        Account_Title_SalePerson, Account_Title_Number, Sale_Person_Remarks, Technician_Person_name, 
        Technicianperson_Price, Travelling_Expense_Technician, Account_Title_TechnicianPerson, 
        Technician_Person_Remarks, Techniciancost, Technicianfuel, indate
      } = record;

      const parseNumber = (value) => (value ? Number(value) || 0 : 0);

      let technicianPrice = parseNumber(Technicianperson_Price);
      let travellingExpense = parseNumber(Travelling_Expense_Technician);
      let amountReceived = parseNumber(Amount_Received);
      let fixedPrice = parseNumber(Saleperson_FixedPrice);
      let subscriptionAmount = parseNumber(Subscription_Amount);
      let pendingRecovery = parseNumber(Pending_Recovery);

      let Technician_Expanse = technicianPrice + travellingExpense;

      let existingInstallation = await dailyIncomeModel.findOne({ Vehicle, Category: "New Installation" }).session(session);

      let Pending_Payment = 0;
      let Excess_Amount = 0;
      let Total_Amount = 0;

      switch (Category) {
        case "New Installation":
          Pending_Payment = (Inofcsaleperson === "Yes")
            ? Math.max(subscriptionAmount - amountReceived, 0)
            : Math.max(fixedPrice - amountReceived, 0);

          if (Technicianfuel === "Saleperson") {
              fixedPrice = Math.max(fixedPrice + travellingExpense, 0);
          }

          Excess_Amount = (Inofcsaleperson !== "Yes")
            ? Math.max(amountReceived - fixedPrice, 0)
            : 0;  
          break;

        case "AMC":
          if (amountReceived > fixedPrice) {
            Excess_Amount = amountReceived - fixedPrice;
            Pending_Payment = 0;
          } else {
            Excess_Amount = 0;
            Pending_Payment = fixedPrice - amountReceived;
          }
          break;

        case "Redo":
          if (subscriptionAmount > amountReceived) {
            Excess_Amount = 0;
            Pending_Payment = subscriptionAmount - amountReceived  ;
          }

          if (existingInstallation) {
            await dailyIncomeModel.updateOne(
              { _id: existingInstallation._id },
              { Device, Package },
              { session }
            );
          }
          break;

        case "Recovery":
        /*  if (existingInstallation && existingInstallation.Pending_Payment > 0) {
            const newPendingPayment = Math.max(existingInstallation.Pending_Payment - pendingRecovery, 0);
            const newExcessAmount = pendingRecovery > existingInstallation.Pending_Payment
              ? pendingRecovery - existingInstallation.Pending_Payment
              : 0;

            await dailyIncomeModel.updateOne(
              { _id: existingInstallation._id },
              { Pending_Payment: newPendingPayment, Excess_Amount: newExcessAmount },
              { session }
            );

            Pending_Payment = newPendingPayment;
            Excess_Amount = newExcessAmount;
          } else {
            Pending_Payment = Math.max(Pending_Payment - pendingRecovery, 0);
            Excess_Amount = pendingRecovery > Pending_Payment ? (pendingRecovery - Pending_Payment) : 0;
          }

          Total_Amount = pendingRecovery;
          break;
*/
        case "Removal":
        case "Removal Transfer":
        case "Transfer":
          if (subscriptionAmount > amountReceived) {
            Excess_Amount = 0;
            Pending_Payment = subscriptionAmount - amountReceived  ;
          }
          break;

        case "OwnerShipChange":
          if (subscriptionAmount > amountReceived) {
            Excess_Amount = 0;
            Pending_Payment = subscriptionAmount - amountReceived  ;
          }

          if (existingInstallation) {
            await dailyIncomeModel.updateOne(
              { _id: existingInstallation._id },
              { PartyName },
              { session }
            );
          }
          Total_Amount = amountReceived;
          break;

        default:
          continue; // Invalid category, skip this record
      }

      Total_Amount = Number(Total_Amount.toFixed(2));
      Pending_Payment = Number(Pending_Payment.toFixed(2));
      Excess_Amount = Number(Excess_Amount.toFixed(2));

      await dailyIncomeModel.updateOne(
        { _id: _id },
        {
          Pending_Payment,
          Excess_Amount,
          Total_Amount,
        },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json({ message: "All records updated successfully" });
  } catch (error) {
    console.error("Error updating incomes:", error);
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error });
  } finally {
    session.endSession();
  }
};

export const getAllIncomewithfilter = async (req, res) => {
  try {
    const { period = "Today", customStart, customEnd, ...restQuery } = req.query;

    // ✅ Set date range based on "period"
    const today = moment().startOf('day');
    let startDate, endDate;

    if (period === 'Today') {
      startDate = today;
      endDate = today.clone().endOf('day');
    } else if (period === 'Yesterday') {
      const yesterday = moment().subtract(1, 'days').startOf('day');
      startDate = yesterday;
      endDate = yesterday.clone().endOf('day');
    } else if (period === 'Custom' && customStart && customEnd) {
      startDate = moment(customStart).startOf('day');
      endDate = moment(customEnd).endOf('day');
      if (!startDate.isValid() || !endDate.isValid()) {
        startDate = today;
        endDate = today.clone().endOf('day');
      }
    } else {
      startDate = today;
      endDate = today.clone().endOf('day');
    }

    // ✅ Base date + status filter
    const baseFilter = {
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      status: 0,
    };

    // ✅ Additional query filters
    const allowedFields = [
      "Sale_Person_name",
      "Technician_Person_name",
      "Vehicle",
      "Device",
      "Category",
      "Amount_Received_gte",
      "Amount_Received_lte",
      "Saleperson_FixedPrice_gte",
      "Saleperson_FixedPrice_lte",
      "Pending_Payment_gte",
      "Pending_Payment_lte",
      "Category_like",
      "Vehicle_like",
      "Sale_Person_name_like",
      "Technician_Person_name_like",
      // Add more allowed fields as needed
    ];

    const dynamicFilters = buildFilter(restQuery, allowedFields);
    const filterCondition = { ...baseFilter, ...dynamicFilters };

    // ✅ Fetch and sort records
    const incomeRecords = await dailyIncomeModel
      .find(filterCondition)
      .sort({ indate: -1, _id: -1 });

    // ✅ Optional: Summary calculation
    let summary = {};
    try {
      summary = calculateIncomeSummary(incomeRecords);
    } catch (summaryError) {
      console.error("Error calculating summary:", summaryError);
      summary = { message: "Summary calculation failed" };
    }

    // ✅ Send response
    res.status(200).json({
      startDate: startDate.format("YYYY-MM-DD HH:mm:ss"),
      endDate: endDate.format("YYYY-MM-DD HH:mm:ss"),
      ...summary,
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income records:", error.message, { stack: error.stack });
    res.status(500).json({ message: "Server error" });
  }
};


export const getAllIncome = async (req, res) => {
  try {
    const allowedFields = [
      "Sale_Person_name", "Vehicle", "PartyName", "Category", "Device", "Package", "Subscription_Amount", "Amount_Received",
      "Saleperson_FixedPrice","Excess_Amount","Pending_Payment", "Pending_Recovery", "Inofcsaleperson", "City",
      "Account_Title_SalePerson", "Account_Title_Number", "Sale_Person_Remarks", "Technician_Person_name", 
      "Technicianperson_Price", "Travelling_Expense_Technician","Technician_Expanse","Account_Title_TechnicianPerson",
      "Technician_Person_Remarks", "Techniciancost","Technicianfuel","Total_Amount","indate",
    ];

    let filter = buildFilter(req.query, allowedFields);
    filter.status = 0;

    const { page = 1, pageSize = 1000 } = req.query;

    // ✅ 1. Paginated Data
    const paginatedResults = await paginateResults(
      dailyIncomeModel,
      filter,
      page,
      pageSize,
      { indate: -1, _id: -1 }
    );

    // ✅ 2. Full Filtered Records for Summary (not paginated)
    const fullFilteredRecords = await dailyIncomeModel.find(filter);

    // ✅ 3. Calculate summary on full filtered dataset
    let summary = {};
    try {
      summary = calculateIncomeSummary(fullFilteredRecords);
    } catch (summaryError) {
      console.error("Error calculating summary:", summaryError);
      summary = { message: "Summary calculation failed" };
    }

    res.status(200).json({
      ...summary,
      ...paginatedResults,
    });

  } catch (error) {
    console.error("Error fetching income records:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const getOverAllcategory = async (req, res) => {
  try {
    const filter = { status: 0 };

    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });
    if (!incomeRecords.length) {
      return res.status(404).json({ message: "No records found for the given category." });
    }

    // Use the utility function
    const totals = calculateIncomeTotalsByCategory(incomeRecords);

    res.status(200).json({
      totals,
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Category:", error);
    res.status(500).json({ message: "Server error while fetching income by category.", error: error.message });
  }
};


// Function to get income entries by Category
export const getIncomeByCategory = async (req, res) => {
  try {
    const { Category } = req.params;
    const filter = { status: 0 };
    if (Category) {
      filter.Category = Category;
    }

    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });
    if (!incomeRecords.length) {
      return res.status(404).json({ message: "No records found for the given category." });
    }

    // Use the utility function
    const totals = calculateIncomeTotalsByCategory(incomeRecords);

    res.status(200).json({
      totals,
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Category:", error);
    res.status(500).json({ message: "Server error while fetching income by category.", error: error.message });
  }
};

export const getIncomeBySalePersonName = async (req, res) => {
  try {
    const { name } = req.params;
    const filter = { status: 0 };
    if (name) {
      filter.Sale_Person_name = name;
    }

    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });

    const totals = calculateIncomeTotalsSaleperson(incomeRecords);

    res.status(200).json({
      totals,
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Sale Person Name:", error);
    res.status(500).json({ message: "Server error while fetching income by Sale Person Name.", error: error.message });
  }
};

export const getAllSaleperson = async (req, res) => {
  try {

    const filter = { status: 0 };
    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });

    const totals = generateSalespersonSummary(incomeRecords);

    res.status(200).json({
      totals,
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Sale Person Name:", error);
    res.status(500).json({ message: "Server error while fetching income by Sale Person Name.", error: error.message });
  }
};

export const getAllTechnician = async (req, res) => {
  try {

    const filter = { status: 0 };
    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });

    res.status(200).json({
      totals: generateTechnicianSummary(incomeRecords),
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Technician Person Name:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getIncomeByTechnicianPersonName = async (req, res) => {
  try {
    const { name } = req.params;
    const filter = { status: 0 };
    if (name) filter.Technician_Person_name = name;

    const incomeRecords = await dailyIncomeModel.find(filter).sort({ indate: -1, _id: -1 });

    res.status(200).json({
      totals: calculateTotalstechnician(incomeRecords),
      records: incomeRecords,
    });
  } catch (error) {
    console.error("Error fetching income by Technician Person Name:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get fixed price based on salesperson name and package name
export const getFixedPricebysalepersonName = async (req, res) => {
  try {
    const { name, packageName } = req.params;

    if (!name || !packageName) {
      return res.status(400).json({ message: "Sale_Person_name and packageName are required." });
    }

    const validPackages = ["Deluxe", "Ultimate", "Self"];
    if (!validPackages.includes(packageName)) {
      return res.status(400).json({ message: "Invalid package name. Choose from Deluxe, Ultimate, or Self." });
    }

    const salesperson = await salepersonModel.findOne({ Sale_Person_name: name });

    if (!salesperson) {
      return res.status(404).json({ message: "Salesperson not found." });
    }

    // Extract price or "As Deal" (string value)
    const packagePrices = {
      Deluxe: salesperson.Deluxe,
      Ultimate: salesperson.Ultimate,
      Self: salesperson.Self,
    };

    const fixedPrice = packagePrices[packageName];

    if (!fixedPrice) {
      return res.status(404).json({ message: `Package ${packageName} price not available for this salesperson.` });
    }

    const response = {
      Sale_Person_name: name,
      Package_Name: packageName,
      Fixed_Package_Amount: fixedPrice, // Can be a number or "As Deal"
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching fixed package price by salesperson name:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateIncome = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const existingIncome = await dailyIncomeModel.findById(id).session(session);

    if (!existingIncome) {
      return res.status(404).json({ message: "Income record not found." });
    }

    const {
      Sale_Person_name, Vehicle, PartyName, Category, Device, Package, Subscription_Amount,
      Amount_Received, Saleperson_FixedPrice, Pending_Recovery, Inofcsaleperson, City, 
      Account_Title_SalePerson, Account_Title_Number, Sale_Person_Remarks, Technician_Person_name, 
      Technicianperson_Price, Travelling_Expense_Technician, Account_Title_TechnicianPerson, 
      Technician_Person_Remarks, Techniciancost, Technicianfuel, indate
    } = req.body;

    if (!indate || !/\d{4}-\d{2}-\d{2}/.test(indate)) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    const parseNumber = (value) => (value ? Number(value) || 0 : 0);

    let technicianPrice = parseNumber(Technicianperson_Price);
    let travellingExpense = parseNumber(Travelling_Expense_Technician);
    let amountReceived = parseNumber(Amount_Received);
    let fixedPrice = parseNumber(Saleperson_FixedPrice);
    let adjustedFixedPrice = 0;
    let subscriptionAmount = parseNumber(Subscription_Amount);
    let pendingRecovery = parseNumber(Pending_Recovery);

    let Technician_Expanse = technicianPrice + travellingExpense;
    let Pending_Payment = 0;
    let Excess_Amount = 0;
    let Total_Amount = 0;
    let existingInstallation = null;

    if (["Redo", "Recovery", "OwnerShipChange"].includes(Category)) {
      existingInstallation = await dailyIncomeModel.findOne({
        Vehicle,
        Category: "New Installation",
        status: 0
      }).session(session);
    }
    
    switch (Category) {
      case "New Installation":
        adjustedFixedPrice = fixedPrice; // ✅ Just assign, no 'let'
      
        if (Technicianfuel === "Saleperson") {
          adjustedFixedPrice += travellingExpense; // ✅ fuel gets added here
        }
      
        Pending_Payment = (Inofcsaleperson === "Yes")
          ? Math.max(subscriptionAmount - amountReceived, 0)
          : Math.max(adjustedFixedPrice - amountReceived, 0);
      
        Excess_Amount = (Inofcsaleperson !== "Yes")
          ? Math.max(amountReceived - adjustedFixedPrice, 0)
          : 0;
        break;
      
        case "AMC":      
        if (amountReceived > fixedPrice) {
          Excess_Amount = amountReceived - fixedPrice;
          Pending_Payment = 0;
        } else {
          Excess_Amount = 0;
          Pending_Payment = fixedPrice - amountReceived;
        }        
          break;

        case "Redo":
/*        if (Techniciancost === "Company") amountReceived = Math.max(amountReceived - Technician_Expanse, 0); */
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = amountReceived - subscriptionAmount;
        } 

        if (existingInstallation) {
          await dailyIncomeModel.updateOne(
            { _id: existingInstallation._id },
            { Device, Package },
            { session }
          );
        }
        break;

case "Recovery": 
  if (existingInstallation && existingInstallation.Pending_Payment > 0) {
    const newPendingPayment = Math.max(existingInstallation.Pending_Payment - pendingRecovery, 0);
    const newExcessAmount = pendingRecovery > existingInstallation.Pending_Payment 
      ? pendingRecovery - existingInstallation.Pending_Payment 
      : 0;

    await dailyIncomeModel.updateOne(
      { _id: existingInstallation._id },
      {
        Pending_Payment: newPendingPayment,
        Excess_Amount: newExcessAmount,
      },
      { session }
    );

    Pending_Payment = newPendingPayment;
    Excess_Amount = newExcessAmount;
  } else {
    Pending_Payment = Math.max(Pending_Payment - pendingRecovery, 0);
    Excess_Amount = pendingRecovery > Pending_Payment ? (pendingRecovery - Pending_Payment) : 0;
  }

  Total_Amount = pendingRecovery;
  break;

      case "Removal":
      case "Removal Transfer":
      case "Transfer":
/*        if (Techniciancost === "Company") amountReceived = Math.max(amountReceived - Technician_Expanse, 0); */
/*        Total_Amount = amountReceived; */
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = amountReceived - subscriptionAmount;
        } 
        break;

      case "OwnerShipChange":
          if (subscriptionAmount > amountReceived ) {
          Excess_Amount = 0;
          Pending_Payment = amountReceived - subscriptionAmount;
        } 

      if (existingInstallation) {
          await dailyIncomeModel.updateOne(
            { _id: existingInstallation._id },
            { PartyName },
            { session }
          );
        }
        Total_Amount = amountReceived;
        break;

      default:
        return res.status(400).json({ message: "Invalid category provided." });
    }

    Total_Amount = Number(Total_Amount.toFixed(2));
    Pending_Payment = Number(Pending_Payment.toFixed(2));
    Excess_Amount = Number(Excess_Amount.toFixed(2));

    const updatedIncome = await dailyIncomeModel.findByIdAndUpdate(id, {
      Sale_Person_name,
      Vehicle,
      PartyName,
      Category,
      Device,
      Package,
      Subscription_Amount,
      Amount_Received: amountReceived,
      Saleperson_FixedPrice: adjustedFixedPrice,
      Pending_Payment,
      Excess_Amount,
      City,
      Account_Title_SalePerson,
      Account_Title_Number,
      Sale_Person_Remarks,
      Technician_Person_name,
      Technicianperson_Price: technicianPrice,
      Travelling_Expense_Technician: travellingExpense,
      Technician_Expanse,
      Account_Title_TechnicianPerson,
      Techniciancost,
      Technicianfuel,
      Technician_Person_Remarks,
      Total_Amount,
      indate: new Date(indate),
    }, { new: true, session });

    await session.commitTransaction();
    res.status(200).json(updatedIncome);
  } catch (error) {
    console.error("Error updating income:", error);
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error });
  } finally {
    session.endSession();
  }
};

// Function to soft delete an income entry (Admin only)
export const deleteIncome = async (req, res) => {
  try {
    // Find the income record by ID
    const income = await dailyIncomeModel.findById(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    // Soft delete the income record by updating the status
    income.status = 1; // Set status to 1 for soft deletion
    await income.save();

    // Send success response
    res.status(200).json({ message: 'Income record deleted successfully' });
  } catch (error) {
    // Log the error and send a server error response
    console.error('Error deleting income:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



