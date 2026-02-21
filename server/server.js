import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import connectDB from './config/database.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import tripRoutes from './routes/trips.js';
import maintenanceRoutes from './routes/maintenance.js';
import fuelRoutes from './routes/fuel.js';
import expenseRoutes from './routes/expenses.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();

app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  origin: '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FleetFlow API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((req,res,next)=>{
    console.log("===============")
    console.log("Request Api  :  ", req.protocol + '://' + req.get('host') + req.originalUrl)
    console.log("Request Body :  ", req.body)
    console.log("===============")
    next()
})

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
