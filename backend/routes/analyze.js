const express = require('express');
const AnalyzeController = require('../controllers/analyzeController');

const router = express.Router();

// POST /analyze - Main analysis endpoint
router.post('/', AnalyzeController.analyze);

module.exports = router;
