const crypto = require('crypto');
const Upload = require('../models/upload');
const FieldMapping = require('../models/fieldMapping');
const Validation = require('../models/validation');
const Report = require('../models/report');
const RuleEngine = require('../utils/ruleEngine');
const ReportGenerator = require('../utils/reportGenerator');
const { calculateDataScore, calculateCoverageScore, calculateRulesScore, calculatePostureScore, calculateOverallScore } = require('../utils/scoring');

class AnalyzeController {
  // Main analyze endpoint - orchestrates the full analysis pipeline
  static async analyze(req, res) {
    try {
      const { uploadId, questionnaire = {} } = req.body;

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
          message: 'Please complete field mapping before running analysis'
        });
      }

      // Run rule validation
      const ruleEngine = new RuleEngine();
      const validationResults = await ruleEngine.runValidation(upload, fieldMapping.mappings);

      // Calculate category scores
      const dataScore = calculateDataScore(upload.rawData);
      const coverageScore = calculateCoverageScore(fieldMapping.mappings);
      const rulesScore = calculateRulesScore(validationResults);
      const postureScore = calculatePostureScore(questionnaire);
      
      const categoryScores = {
        data: dataScore,
        coverage: coverageScore,
        rules: rulesScore,
        posture: postureScore
      };

      const overallScore = calculateOverallScore(categoryScores);

      // Generate coverage analysis
      const coverageAnalysis = AnalyzeController.generateCoverageAnalysis(fieldMapping.mappings);

      // Save validation results
      const validationId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const validation = new Validation({
        validationId,
        uploadId,
        mappingId: fieldMapping.mappingId,
        results: {
          ...validationResults,
          categoryScores,
          overallScore,
          coverageAnalysis
        },
        fieldMappings: fieldMapping.mappings
      });
      await validation.save();

      // Generate report
      const reportId = 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const reportGenerator = new ReportGenerator();
      const reportData = await reportGenerator.generateJSONReport(upload, fieldMapping, {
        ...validationResults,
        categoryScores,
        overallScore,
        coverageAnalysis
      });

      const report = new Report({
        reportId,
        uploadId,
        validationId,
        reportData: JSON.parse(reportData),
        format: 'json'
      });
      await report.save();

      // Update upload status
      await Upload.findOneAndUpdate(
        { uploadId },
        { status: 'completed' }
      );

      // Return comprehensive analysis results
      res.json({
        success: true,
        reportId,
        validationId,
        uploadId,
        analysis: {
          categoryScores,
          overallScore,
          coverageAnalysis,
          validationResults,
          readinessLevel: AnalyzeController.getReadinessLevel(overallScore)
        },
        reportUrl: `/report/${reportId}`,
        message: `Analysis complete. Overall readiness: ${overallScore}%`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message
      });
    }
  }

  // Generate coverage analysis (Matched/Close/Missing)
  static generateCoverageAnalysis(fieldMappings) {
    const getsSchema = require('../../gets_v0_1_schema.json');
    const standardFields = getsSchema.fields;
    
    const matched = [];
    const close = [];
    const missing = [];

    // Analyze mapped fields
    Object.entries(fieldMappings).forEach(([sourceField, targetField]) => {
      if (targetField) {
        const standardField = standardFields.find(f => f.path === targetField);
        if (standardField) {
          matched.push({
            source: sourceField,
            target: targetField,
            required: standardField.required,
            type: standardField.type
          });
        }
      }
    });

    // Find missing required fields
    const mappedTargets = new Set(Object.values(fieldMappings).filter(Boolean));
    standardFields.forEach(field => {
      if (!mappedTargets.has(field.path)) {
        missing.push({
          field: field.path,
          required: field.required,
          type: field.type,
          description: AnalyzeController.getFieldDescription(field.path)
        });
      }
    });

    // Find close matches for unmapped source fields
    const unmappedSources = Object.keys(fieldMappings).filter(key => !fieldMappings[key]);
    unmappedSources.forEach(sourceField => {
      const suggestions = AnalyzeController.findCloseMatches(sourceField, standardFields);
      if (suggestions.length > 0) {
        close.push({
          source: sourceField,
          suggestions: suggestions.slice(0, 3) // Top 3 suggestions
        });
      }
    });

    return {
      matched,
      close,
      missing,
      summary: {
        totalStandardFields: standardFields.length,
        mappedFields: matched.length,
        missingFields: missing.length,
        closeMatches: close.length,
        coveragePercentage: Math.round((matched.length / standardFields.length) * 100)
      }
    };
  }

  // Find close matches for field mapping suggestions
  static findCloseMatches(sourceField, standardFields) {
    const normalizedSource = sourceField.toLowerCase()
      .replace(/[_\s-]/g, '')
      .replace(/id$/, '')
      .replace(/date$/, '');

    return standardFields
      .map(field => {
        const normalizedTarget = field.path.toLowerCase()
          .replace(/[._\[\]]/g, '')
          .replace(/id$/, '')
          .replace(/date$/, '');

        // Calculate similarity score
        let score = 0;
        if (normalizedTarget.includes(normalizedSource) || normalizedSource.includes(normalizedTarget)) {
          score += 50;
        }
        if (normalizedSource.substring(0, 4) === normalizedTarget.substring(0, 4)) {
          score += 30;
        }
        if (normalizedSource.substring(0, 3) === normalizedTarget.substring(0, 3)) {
          score += 20;
        }

        return { field, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        field: item.field.path,
        type: item.field.type,
        required: item.field.required,
        score: item.score
      }));
  }

  // Get human-readable field description
  static getFieldDescription(fieldPath) {
    const descriptions = {
      'invoice.id': 'Unique invoice identifier',
      'invoice.issue_date': 'Date when invoice was issued',
      'invoice.currency': 'Currency code (AED, SAR, MYR, USD)',
      'invoice.total_excl_vat': 'Total amount excluding VAT',
      'invoice.vat_amount': 'VAT amount',
      'invoice.total_incl_vat': 'Total amount including VAT',
      'seller.name': 'Seller company name',
      'seller.trn': 'Seller Tax Registration Number',
      'seller.country': 'Seller country code',
      'seller.city': 'Seller city',
      'buyer.name': 'Buyer company name',
      'buyer.trn': 'Buyer Tax Registration Number',
      'buyer.country': 'Buyer country code',
      'buyer.city': 'Buyer city',
      'lines[].sku': 'Product/service SKU',
      'lines[].description': 'Product/service description',
      'lines[].qty': 'Quantity',
      'lines[].unit_price': 'Unit price',
      'lines[].line_total': 'Line total amount'
    };
    return descriptions[fieldPath] || 'Standard e-invoicing field';
  }

  // Get readiness level based on score
  static getReadinessLevel(score) {
    if (score >= 90) return 'HIGH READINESS';
    if (score >= 70) return 'MEDIUM READINESS';
    if (score >= 50) return 'LOW READINESS';
    return 'NEEDS ATTENTION';
  }
}

module.exports = AnalyzeController;
