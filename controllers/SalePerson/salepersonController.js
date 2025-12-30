import salepersonModel from '../../models/saleperson/salepersonModel.js';
import { paginateResults } from '../utils/paginateResults.js'
import { buildFilter } from "../utils/filterrecords.js"; // Ensure these functions are correctly imported
// Create a new sale entry (Admin or Salesperson)
export const createSale = async (req, res) => {
  try {
    const {
      Sale_Person_name,
			Address,
			City,
			Deluxe,
			Ultimate,
			Self,
			Mobile_1,
			Mobile_2,
      date,
    } = req.body;

        const existingSalePersonname = await salepersonModel.findOne({ Sale_Person_name }); // fix: use object
    
        if (existingSalePersonname) {
          return res.status(409).json({ message: 'SalePersonname already exists' }); // return early
        }
  
    const newSale = new salepersonModel({
      Sale_Person_name,
			Address,
			City,
			Deluxe,
			Ultimate,
			Self,
			Mobile_1,
			Mobile_2,
      date,
      Total_SalePerson: 1,
    });

    const savedSale = await newSale.save();
    res.status(201).json({ message: 'Sale entry created successfully', sale: savedSale });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all sale entries and their count
export const getAllSales = async (req, res) => {
  try {
    const allowedFields = [
      "Sale_Person_name",
      "Address",
      "City",
      "Deluxe",
      "Ultimate",
      "Self",
      "Mobile_1",
      "Mobile_2",
      "date"
    ];

    // ✅ Build filter
    let filter = buildFilter(req.query, allowedFields);

    // ✅ Fetch all salespersons without pagination
    const records = await salepersonModel.find(filter).sort({ createdAt: -1 });

    // ✅ Send response
    res.status(200).json({
      records,
      totalRecords: records.length,
      Total_SalePerson: records.length
    });

  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Get all sales by Sale_Person_name with aggregated summary
export const getSalesByNameAndPackage = async (req, res) => {
  try {
    const { name, packageName } = req.query; // Accept parameters from query string

    // Validate inputs
    if (!name || !packageName) {
      return res.status(400).json({ message: "Salesperson name and package name are required." });
    }

    // Fetch the data from the database based on the salesperson name and package name
    const sales = await salepersonModel.find({
      Sale_Person_name: name,
      Package: packageName, // Ensure the field matches your database schema
    });

    // Handle case where no sales are found
    if (!sales || sales.length === 0) {
      return res.status(404).json({ message: "No sales found for the given name and package." });
    }

    res.status(200).json({
      Sale_Person_name: name,
      Package: packageName,
      sales_data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales by name and package:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Update sale entry (Admin only)
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await salepersonModel.findById(id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
		const {
      Sale_Person_name,
    } = req.body;

    if (!Sale_Person_name ) {
      return res.status(400).json({ message: 'Sale_Person_name is already register' });
    }

// Update fields from request body
Object.keys(req.body).forEach((field) => {
	sale[field] = req.body[field] ?? sale[field];
});


const updatedSale = await sale.save();
    res.status(200).json({ message: 'Sale entry updated successfully', sale: updatedSale });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Function to update sale status instead of deleting (Admin only)
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await salepersonModel.findByIdAndDelete(id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json({ message: 'Sale record marked is delete' });
  } catch (error) {
    console.error('Error marking sale as delete:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
