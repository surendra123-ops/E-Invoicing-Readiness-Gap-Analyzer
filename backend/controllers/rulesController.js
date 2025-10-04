const crypto = require('crypto');
const RuleEngine = require('../utils/ruleEngine');
const Upload = require('../models/upload');
const FieldMapping = require('../models/fieldMapping');
const Validation = require('../models/validation');

class RulesController {
  // Run rule validation on uploaded data
  static async checkRules(req, res) {
    try {
      const { uploadId } = req.body;

      if (!uploadId) {
        return res.status(400).json({
          error: 'Missing uploadId',
          message: 'Upload ID is required'
        });
      }

      // Get upload data
      const upload = await Upload.findOne({ uploadId });
      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `Upload with ID ${uploadId} not found`
        });
      }

      // Get field mappings
      const fieldMapping = await FieldMapping.findOne({ uploadId });
      if (!fieldMapping) {
        return res.status(400).json({
          error: 'Field mappings not found',
          message: 'Please complete field mapping before running validation'
        });
      }

      // Initialize rule engine
      const ruleEngine = new RuleEngine();

      // Run validation
      const validationResults = await ruleEngine.runValidation(upload, fieldMapping.mappings);

      // Generate validation ID
      const validationId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Save validation results to database
      const validation = new Validation({
        validationId,
        uploadId,
        mappingId: fieldMapping.mappingId,
        results: validationResults,
        fieldMappings: fieldMapping.mappings
      });

      await validation.save();

      // Update upload status
      await Upload.findOneAndUpdate(
        { uploadId },
        { status: 'validated' }
      );

      // Return results
      res.json({
        success: true,
        validationId,
        uploadId,
        ...validationResults,
        message: `Validation complete. ${validationResults.passed} rows passed, ${validationResults.failed} rows failed.`
      });

    } catch (error) {
      console.error('Error checking rules:', error);
      res.status(500).json({
        error: 'Failed to check rules',
        message: error.message
      });
    }
  }

  // Get validation results
  static async getValidationResults(req, res) {
    try {
      const { validationId } = req.params;

      const validation = await Validation.findOne({ validationId });

      if (!validation) {
        return res.status(404).json({
          error: 'Validation not found',
          message: `Validation with ID ${validationId} not found`
        });
      }

      res.json({
        validationId: validation.validationId,
        uploadId: validation.uploadId,
        mappingId: validation.mappingId,
        results: validation.results,
        fieldMappings: validation.fieldMappings,
        createdAt: validation.createdAt
      });

    } catch (error) {
      console.error('Error getting validation results:', error);
      res.status(500).json({
        error: 'Failed to get validation results',
        message: error.message
      });
    }
  }

  // Get validation results by upload ID
  static async getValidationByUploadId(req, res) {
    try {
      const { uploadId } = req.params;

      const validation = await Validation.findOne({ uploadId })
        .sort({ createdAt: -1 }); // Get most recent validation

      if (!validation) {
        return res.status(404).json({
          error: 'Validation not found',
          message: `No validation found for upload ID: ${uploadId}`
        });
      }

      res.json({
        validationId: validation.validationId,
        uploadId: validation.uploadId,
        mappingId: validation.mappingId,
        results: validation.results,
        fieldMappings: validation.fieldMappings,
        createdAt: validation.createdAt
      });

    } catch (error) {
      console.error('Error getting validation by upload ID:', error);
      res.status(500).json({
        error: 'Failed to get validation results',
        message: error.message
      });
    }
  }

  // Get rule definitions
  static getRuleDefinitions(req, res) {
    try {
      const ruleDefinitions = {
        REQUIRED_FIELD: {
          name: 'Required Field Validation',
          description: 'Ensures all required fields are present and not empty',
          category: 'Data Completeness'
        },
        DATE_FORMAT: {
          name: 'Date Format Validation',
          description: 'Validates date fields are in YYYY-MM-DD format',
          category: 'Data Format'
        },
        CURRENCY_VALID: {
          name: 'Currency Validation',
          description: 'Ensures currency codes are valid ISO codes',
          category: 'Data Format'
        },
        VAT_CALCULATION: {
          name: 'VAT Calculation Validation',
          description: 'Validates VAT calculations: total_incl_vat = total_excl_vat + vat_amount',
          category: 'Business Logic'
        },
        LINE_MATH: {
          name: 'Line Item Math Validation',
          description: 'Validates line totals: line_total = qty * unit_price',
          category: 'Business Logic'
        },
        TRN_PRESENT: {
          name: 'TRN Presence Validation',
          description: 'Ensures TRN numbers are present for buyer and seller',
          category: 'Data Completeness'
        },
        DATA_TYPE: {
          name: 'Data Type Validation',
          description: 'Validates data types and patterns match schema requirements',
          category: 'Data Format'
        }
      };

      res.json({
        rules: ruleDefinitions,
        totalRules: Object.keys(ruleDefinitions).length
      });

    } catch (error) {
      console.error('Error getting rule definitions:', error);
      res.status(500).json({
        error: 'Failed to get rule definitions',
        message: error.message
      });
    }
  }
}

module.exports = RulesController;
