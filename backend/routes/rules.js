const express = require('express');
const router = express.Router();
const RulesController = require('../controllers/rulesController');

// Run rule validation
router.post('/check', RulesController.checkRules);

// Get validation results
router.get('/results/:validationId', RulesController.getValidationResults);

// Get validation results by upload ID
router.get('/upload/:uploadId', RulesController.getValidationByUploadId);

// Get rule definitions
router.get('/definitions', RulesController.getRuleDefinitions);

module.exports = router;
