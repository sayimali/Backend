// controllers/technicianController.js
import technicianpersonModel from '../../models/technicianperson/technicianpersonModel.js';
import { paginateResults } from '../utils/paginateResults.js'
import { buildFilter } from "../utils/filterrecords.js"; // Ensure these functions are correctly imported

// Create a new technician entry
export const createTechnician = async (req, res) => {
  try {
    const {
      Technician_Person_name,
      Address,
			City,
			Mobile_1,
			Mobile_2,
      date,
    } = req.body;
        
    const existingTechnicianPersonname = await technicianpersonModel.findOne({ Technician_Person_name }); // fix: use object
    
        if (existingTechnicianPersonname) {
          return res.status(409).json({ message: 'TechnicianPersonname already exists' }); // return early
        }

    const newTechnician = new technicianpersonModel({
      Technician_Person_name,
			Address,
			City,
			Mobile_1,
			Mobile_2,
      date,
    });

    await newTechnician.save();
    res.status(201).json({ message: 'Technician registered successfully', newTechnician });
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Retrieve all active technician entries in descending order

export const getAllTechnicians = async (req, res) => {
  try {
    const allowedFields = ["Technician_Person_name", "Address", "City", "Mobile_1", "Mobile_2", "date"];

    // ✅ Build filter (case-insensitive search)
    let filter = buildFilter(req.query, allowedFields);

    // ✅ Fetch all data (no pagination)
    const records = await technicianpersonModel.find(filter).sort({ createdAt: -1 });

    // ✅ Send Response
    res.status(200).json({
      records,
      totalRecords: records.length,
    });

  } catch (error) {
    console.error("Error in getAllTechnicians:", { error: error.message, stack: error.stack });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all technicians by Technician_Person_name with aggregated summary
export const getTechniciansByName = async (req, res) => {
  try {
    const { name } = req.params; // Technician name as URL parameter

    // Fetch all technician documents with the matching name and active status
    const technicians = await technicianpersonModel.find({
      Technician_Person_name: name,
    });

    // Structure the response
    const response = {
      Technician_Person_name: name,
      technician_data: technicians,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching technicians by name:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Update technician details
export const updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await technicianpersonModel.findById(id);

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    const { Technician_Person_name } = req.body;

    if (!Technician_Person_name) {
      return res.status(400).json({ message: 'Technician name is required' });
    }

    // Update fields from request body
    Object.keys(req.body).forEach((field) => {
      technician[field] = req.body[field] ?? technician[field];
    });

    const updatedTechnician = await technician.save();

    res.status(200).json({
      message: 'Technician updated successfully',
      updatedTechnician,
    });
  } catch (error) {
    console.error('Error updating technician:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Update technician status instead of deleting
export const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const technician = await technicianpersonModel.findByIdAndDelete(id);

    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }
    res.status(200).json({ message: 'Technician record delete' });
  } catch (error) {
    console.error('Error marking technician delete:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
