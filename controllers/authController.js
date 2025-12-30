import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { buildFilter } from "./utils/filterrecords.js";
import { paginateResults } from './utils/paginateResults.js'


dotenv.config();
// Register new user
export const registerUser = async (req, res) => {
  const { username, email, Mobile_1, Mobile_2, password, role } = req.body;

  try {
    // Check if a user with the same username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this username or email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      Mobile_1,
      Mobile_2,
      password: hashedPassword,
      role
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: { username, email, role } });
  } catch (error) {
    console.error("Error details:", error); // Log the error details
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate key error: User with this email already exists.' });
    }
    res.status(500).json({ message: 'Server error', error });
  }
};

export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server error. Try again later." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "9h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: ".muxcloudweb.store",
      maxAge: 9 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, username: user.username, role: user.role },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users (admin-only)
export const getUsers = async (req, res) => {
  try {
    const allowedFields = ["username", "email", "Mobile_1", "Mobile_2", "role"];
    let filter = buildFilter(req.query, allowedFields);

    // ✅ Ensure status field filtering

    // ✅ Extract pagination parameters & prevent invalid values
    let page = Math.max(Number(req.query.page) || 1, 1);
    let pageSize = Math.max(Number(req.query.pageSize) || 10, 1);

    // ✅ Fetch paginated user data with sorting
    const paginatedResults = await paginateResults(User, filter, page, pageSize, { createdAt: -1 });

    return res.status(200).json({
      ...paginatedResults, // Includes records, totalPages, totalRecords
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


// Get current logged-in user
export const getCurrentUser = async (req, res) => {
  const {id} = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "the user is get single",
      user,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Example of a protected API request
const getUserData = async () => {
  const token = localStorage.getItem("authToken");

  try {
    const response = await axios.get("http://localhost:8070/api/protected-route", {
      headers: {
        Authorization: `Bearer ${token}`, // Add token here
      },
    });

    console.log("Protected data:", response.data);
  } catch (err) {
    console.error("Error accessing protected route:", err);
  }
};


// Update user
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, Mobile_1, Mobile_2, password, role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.Mobile_1 = Mobile_1 || user.Mobile_1;
    user.Mobile_2 = Mobile_2 || user.Mobile_2;
    user.role = role || user.role;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete user (admin-only)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Logout user
export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
};
