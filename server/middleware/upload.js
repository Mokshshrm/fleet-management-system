import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory structure if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
const fuelDir = path.join(uploadDir, 'fuel');
const expenseDir = path.join(uploadDir, 'expenses');

[uploadDir, fuelDir, expenseDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for fuel receipts
const fuelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fuelDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const companyId = req.companyId || 'unknown';
    cb(null, `fuel-${companyId}-${uniqueSuffix}${ext}`);
  }
});

// Configure storage for expense documents
const expenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, expenseDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const companyId = req.companyId || 'unknown';
    cb(null, `expense-${companyId}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) and PDF documents are allowed!'));
  }
};

// Create multer instances
export const uploadFuelReceipt = multer({
  storage: fuelStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('receipt');

export const uploadExpenseDocuments = multer({
  storage: expenseStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
}).array('documents', 5); // Allow up to 5 documents

export const uploadExpenseReceipt = multer({
  storage: expenseStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('receipt');

// Middleware to handle multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File size is too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum is 5 files'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
  next();
};

// Helper function to delete uploaded file
export const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '../uploads', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};
