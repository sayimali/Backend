import express from 'express';
import connectdb from './config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import incomeRoute from './routes/DailyIncome/incomeRoute.js';
import expanseRoute from './routes/DailyExpanse/expanseRoute.js';
import salepersonRoute from './routes/SalePerson/salepersonRoute.js';
import technicianpersonRoute from './routes/Technicianperson/technicianpersonRoute.js';
import city from './routes/City/city.js';
import adddevice from './routes/Device/adddevice.js';
import packages from './routes/Packagess/packages.js';
import accounttitleincome from './routes/Accounttitleincome/accounttitleincome.js';
import accountexpansetitleNumber from './routes/AccountExpansetitleandnumber/accountexpansetitleNumber.js';
import exportRoutes from './routes/Report/exportRoutes.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Connect to MongoDB
connectdb();

// ✅ Proper CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://frontend.muxcloudweb.store"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


// Middleware
app.use(express.json());
app.use(cookieParser());

// Test route
app.get('/', (req, res) => {
  res.send('The server is running with CI/CD without down container sucessfully');
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoute);
app.use('/api/expanse', expanseRoute);
app.use('/api/saleperson', salepersonRoute);
app.use('/api/technician', technicianpersonRoute);
app.use('/api/city', city);
app.use('/api/package', packages);
app.use('/api/device', adddevice);
app.use('/api/export', exportRoutes);
app.use('/api/accountexpanse', accountexpansetitleNumber);
app.use('/api/accountincome', accounttitleincome);

// Start the server
const PORT = process.env.PORT || 3006;
app.listen(3006, "0.0.0.0", () => {
  console.log("Server running on port 3006");
});

