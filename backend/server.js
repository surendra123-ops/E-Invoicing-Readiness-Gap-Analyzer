const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');
const fieldsRoutes = require('./routes/fields');

// Import database config
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(morgan('combined'));

// CORS configuration for React frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/health', healthRoutes);
app.use('/upload', uploadRoutes);
app.use('/fields', fieldsRoutes);

// Future API routes (Stage 4+)
// app.use('/analyze', require('./routes/analyze'));
// app.use('/report', require('./routes/reports'));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'E-Invoicing Readiness & Gap Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: '/upload',
      uploadJson: '/upload/json',
      uploadDetails: '/upload/:uploadId',
      fields: '/fields',
      mapFields: '/fields/map',
      fieldMappings: '/fields/mappings/:uploadId',
      analyze: '/analyze (coming in Stage 4)',
      report: '/report/:id (coming in Stage 4)'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 E-Invoicing Analyzer server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`🗂️  Fields endpoint: http://localhost:${PORT}/fields`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
});

module.exports = app;