import dailyexpanseModel from "../../models/DailyExpanse/dailyexpanseModel.js";
import categoryexpanse from "../../models/CategoryExpanse/categoryexpanse.js";
import { paginateResults } from '../utils/paginateResults.js'
import { buildFilter } from "../utils/filterrecords.js"; // Ensure these functions are correctly imported
import moment from "moment";

//just create category
export const createCategoryExpanse = async (req, res) => {
  try {
    const {
      CategoryExpanse,
    } = req.body;

    const newCategory = new categoryexpanse({
      CategoryExpanse,
    });


    const savedCategory = await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', Category: savedCategory });
  } catch (error) {
    console.error('Error creating Category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Function to get all expanse entries and their summaries (Admin only)
export const getCategoryExpanse = async (req, res) => {
  try {
    const CategoryexpanseRecords = await categoryexpanse.find({}).sort({ _id: -1 });;
    const categoryexpanseCount = CategoryexpanseRecords.length;

    res.status(200).json({
      Total_Category_Expanse: categoryexpanseCount,
      records: CategoryexpanseRecords,
    });
  } catch (error) {
    console.error('Error fetching category expanse records:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Function to get all expanse entries by Expanse_name with summaries (Admin only)
export const getCategoryName = async (req, res) => {
  try {
    const { name } = req.params;

    // Fetch all expenses with the given Expanse_name and status 0 (active)
    const CategoryexpanseRecords = await categoryexpanse.find({ CategoryExpanse: name});

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

// Function to update an expanse entry (Admin only)
// Update sale entry (Admin only)
export const updateCategoryExpanse = async (req, res) => {
  try {
    const { id } = req.params;
    const upCategoryExpanse = await categoryexpanse.findById(id);

    if (!upCategoryExpanse) {
      return res.status(404).json({ message: 'Sale not found' });
    }
const {CategoryExpanse} = req.body;

const existingcategory = await categoryexpanse.findOne({CategoryExpanse})

    if (existingcategory ) {
      return res.status(400).json({ message: 'CategoryExpanse is already register' });
    }

// Update fields from request body
Object.keys(req.body).forEach((field) => {
	upCategoryExpanse[field] = req.body[field] ?? upCategoryExpanse[field];
});


const updatedSale = await upCategoryExpanse.save();
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
    const deleteCategory = await  categoryexpanse.findByIdAndDelete(id);
    if (!deleteCategory) {
      return res.status(404).json({ message: 'deleteCategory not found' });
    }

    res.status(200).json({ message: 'categoryexpanse record marked as inactive' });
  } catch (error) {
    console.error('Error marking expanse as inactive:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Function to create a new expense entry
export const createExpanse = async (req, res) => {
  try {
    const {
      Expanse_name,
      Amount,
      Category,
      Description,
      Remarks,
      Debit,
      Account_Title,
			Account_Number,
      indate, // Date entered manually
    } = req.body;

    // Check if the date is valid
    if (!indate || isNaN(Date.parse(indate))) {
      return res.status(400).json({ message: 'Invalid date format. Please provide a valid date.' });
    }

    // Verify all required fields are present
    if (!Expanse_name || !Amount || !Category || !Account_Title || !indate) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    // Convert Amount to a whole number without decimals
    const integerAmount = Math.floor(parseFloat(Amount)); // Ensures no decimal places

    // Create a new DailyExpanse instance
    const newExpanse = new dailyexpanseModel({
      Expanse_name,
      Amount: integerAmount,
      Category,
      Description,
      Remarks,
      Debit,
      Account_Title,
			Account_Number,
      indate: new Date(indate), // Parse and set the date
      Total_Amount_with_Category: integerAmount,
      Total_Expanse_Amount: integerAmount,
      status: 0, // Active status
    });

    // Save the new expanse entry
    await newExpanse.save();

    // Retrieve and sort all expanse entries in descending order based on date, and by _id to ensure new entries come first for the same date
    const allExpanses = await dailyexpanseModel.find({ status: 0 }).sort({ indate: -1, _id: -1 });

    // Respond with the sorted expanse entries
    res.status(201).json({
      message: 'Expanse entry created successfully',
      expanses: allExpanses,
    });
  } catch (error) {
    console.error('Error creating expanse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch all expanse entries and their summaries (Admin only)
export const getAllExpansewithfilter = async (req, res) => {
  try {
    const { period = "Today", customStart, customEnd } = req.query;
    const today = moment().startOf("day");
    let startDate, endDate;

    // 🟢 **Date Filtering Logic**
    if (period === "Today") {
      startDate = today;
      endDate = today.clone().endOf("day");
    } else if (period === "Yesterday") {
      const yesterday = moment().subtract(1, "day").startOf("day");
      startDate = yesterday;
      endDate = yesterday.clone().endOf("day");
    } else if (period === "Custom") {
      if (!customStart || !customEnd) {
        return res.status(400).json({ message: "Custom start and end dates are required" });
      }

      startDate = moment(customStart, "YYYY-MM-DD").startOf("day");
      endDate = moment(customEnd, "YYYY-MM-DD").endOf("day");

      if (!startDate.isValid() || !endDate.isValid()) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
    } else {
      return res.status(400).json({ message: "Invalid period. Use Today, Yesterday, or Custom." });
    }

    // 🟢 **Fetch Expenses with Filtered Date and Status**
    const expanseRecords = await dailyexpanseModel.find({
      indate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      status: 0, // Only fetch active expenses
    }).sort({ indate: -1, _id: -1 });

    // 🟢 **Format the Expense Records (Remove Decimals)**
    const formattedExpanseRecords = expanseRecords.map((exp) => ({
      ...exp._doc,
      Amount: Math.floor(exp.Amount),
    }));

    // 🟢 **Calculate Totals**
    const expanseCount = formattedExpanseRecords.length;
    const totalAmount = formattedExpanseRecords.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

    // 🟢 **Send Response**
    res.status(200).json({
      startDate: startDate.format("YYYY-MM-DD HH:mm:ss"),
      endDate: endDate.format("YYYY-MM-DD HH:mm:ss"),
      Total_Expanse_name: expanseCount,
      Total_Expanse_Amount: totalAmount,
      records: formattedExpanseRecords,
    });
  } catch (error) {
    console.error("Error fetching expanse records:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllExpanse = async (req, res) => {
  try {
    const allowedFields = [
      "Expanse_name",
      "Amount",
      "Category",
      "Remarks",
      "Debit",
      "Account_Title",
      "Account_Number",
      "indate", // Date entered manually
    ];

    // ✅ Build filter
    let filter = buildFilter(req.query, allowedFields);
    filter.status = 0; // Active records only

    // ✅ Extract pagination params
    let { page = 1, pageSize = 10 } = req.query;

    // ✅ Fetch paginated expenses
    const paginatedResults = await paginateResults(dailyexpanseModel, filter, page, pageSize, { indate: -1, _id: -1 });

    // ✅ Format expenses before sending
    paginatedResults.records = paginatedResults.records.map((exp) => ({
      ...exp._doc,
      Amount: Math.floor(Number(exp.Amount) || 0),
    }));

    // ✅ Calculate total expenses count & amount
    const totalExpanseCount = paginatedResults.totalRecords;
    const totalExpanseAmount = paginatedResults.records.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

    // ✅ Send Response
    res.status(200).json({
      ...paginatedResults, // Includes records, totalPages, totalRecords
      Total_Expanse_name: totalExpanseCount,
      Total_Expanse_Amount: totalExpanseAmount,
    });

  } catch (error) {
    console.error("Error in getAllExpanse:", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch all expanse entries by Category with summaries (Admin only)
export const getExpanseByCategory = async (req, res) => {
  try {
    const { Category } = req.params;
    const expanseRecords = await dailyexpanseModel.find({ Category, status: 0 }).sort({ indate: -1 });

    if (expanseRecords.length === 0) {
      return res.status(404).json({ message: 'No expenses found for this category' });
    }

    const totalAmountWithCategory = expanseRecords.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

    res.status(200).json({
      Category,
      Total_Expanse_name: expanseRecords.length,
      Total_Amount_with_Category: totalAmountWithCategory,
      records: expanseRecords,
    });
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an expanse entry (Admin only)
export const updateExpanse = async (req, res) => {
  try {
    const expanse = await dailyexpanseModel.findById(req.params.id);
    if (!expanse) {
      return res.status(404).json({ message: 'Expanse not found' });
    }


    Object.keys(req.body).forEach((field) => {
      expanse[field] = req.body[field] ?? expanse[field];
    });

    const updatedExpanse = await expanse.save();
    res.status(200).json({ message: 'Expanse entry updated successfully', expanse: updatedExpanse });
  } catch (error) {
    console.error('Error updating expanse:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Soft delete an expanse entry (Admin only)
export const deleteExpanse = async (req, res) => {
  try {
    const expanse = await dailyexpanseModel.findById(req.params.id);
    if (!expanse) {
      return res.status(404).json({ message: 'Expanse not found' });
    }

    expanse.status = 1;
    await expanse.save();

    res.status(200).json({ message: 'Expanse record marked as inactive' });
  } catch (error) {
    console.error('Error marking expanse as inactive:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
