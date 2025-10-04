const crypto = require('crypto');
const getsSchema = require('../../gets_v0_1_schema.json');
const FieldMapping = require('../models/fieldMapping');
const Upload = require('../models/upload');

class FieldsController {
  // Get standard GETS fields
  static getStandardFields(req, res) {
    try {
      const fields = getsSchema.fields.map(field => ({
        path: field.path,
        type: field.type,
        required: field.required,
        format: field.format,
        enum: field.enum,
        pattern: field.pattern
      }));

      res.json({
        schema: getsSchema,
        fields: fields,
        categories: {
          invoice: fields.filter(f => f.path.startsWith('invoice.')),
          seller: fields.filter(f => f.path.startsWith('seller.')),
          buyer: fields.filter(f => f.path.startsWith('buyer.')),
          lines: fields.filter(f => f.path.startsWith('lines['))
        }
      });
    } catch (error) {
      console.error('Error getting standard fields:', error);
      res.status(500).json({
        error: 'Failed to get standard fields',
        message: error.message
      });
    }
  }

  // Map uploaded fields to standard fields
  static async mapFields(req, res) {
    try {
      const { uploadId, mappings, autoSuggest = false } = req.body;

      if (!uploadId) {
        return res.status(400).json({
          error: 'Missing uploadId',
          message: 'Upload ID is required'
        });
      }

      if (!mappings || typeof mappings !== 'object') {
        return res.status(400).json({
          error: 'Invalid mappings',
          message: 'Mappings must be an object'
        });
      }

      // Check if upload exists
      const upload = await Upload.findOne({ uploadId });
      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `Upload with ID ${uploadId} not found`
        });
      }

      // Validate mappings against standard fields
      const standardFields = getsSchema.fields.map(f => f.path);
      const invalidMappings = [];

      for (const [sourceField, targetField] of Object.entries(mappings)) {
        if (targetField && !standardFields.includes(targetField)) {
          invalidMappings.push(targetField);
        }
      }

      if (invalidMappings.length > 0) {
        return res.status(400).json({
          error: 'Invalid field mappings',
          message: `The following target fields are not valid: ${invalidMappings.join(', ')}`,
          invalidFields: invalidMappings
        });
      }

      // Generate mapping ID
      const mappingId = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Save mapping to database
      const fieldMapping = new FieldMapping({
        mappingId,
        uploadId,
        mappings,
        autoSuggest,
        standardFields: getsSchema.fields
      });

      await fieldMapping.save();

      // Update upload status
      await Upload.findOneAndUpdate(
        { uploadId },
        { status: 'mapped' }
      );

      res.json({
        success: true,
        mappingId,
        uploadId,
        mappings,
        message: 'Field mappings saved successfully',
        mappedFields: Object.keys(mappings).filter(key => mappings[key]).length,
        totalStandardFields: standardFields.length
      });

    } catch (error) {
      console.error('Error mapping fields:', error);
      res.status(500).json({
        error: 'Failed to map fields',
        message: error.message
      });
    }
  }

  // Get field mappings for an upload
  static async getFieldMappings(req, res) {
    try {
      const { uploadId } = req.params;

      const mapping = await FieldMapping.findOne({ uploadId });

      if (!mapping) {
        return res.status(404).json({
          error: 'Mapping not found',
          message: `No field mapping found for upload ID: ${uploadId}`
        });
      }

      res.json({
        mappingId: mapping.mappingId,
        uploadId: mapping.uploadId,
        mappings: mapping.mappings,
        autoSuggest: mapping.autoSuggest,
        standardFields: mapping.standardFields,
        createdAt: mapping.createdAt
      });

    } catch (error) {
      console.error('Error getting field mappings:', error);
      res.status(500).json({
        error: 'Failed to get field mappings',
        message: error.message
      });
    }
  }

  // Helper method to suggest field mappings
  static suggestMappings(uploadedColumns, standardFields) {
    const suggestions = {};
    const usedTargets = new Set();

    // First pass: exact matches
    uploadedColumns.forEach(uploadedCol => {
      const normalizedUploaded = uploadedCol.toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/id$/, '')
        .replace(/date$/, '');

      const exactMatch = standardFields.find(stdField => {
        const normalizedStd = stdField.path.toLowerCase()
          .replace(/[._\[\]]/g, '')
          .replace(/id$/, '')
          .replace(/date$/, '');
        
        return normalizedStd.includes(normalizedUploaded) || 
               normalizedUploaded.includes(normalizedStd);
      });

      if (exactMatch && !usedTargets.has(exactMatch.path)) {
        suggestions[uploadedCol] = exactMatch.path;
        usedTargets.add(exactMatch.path);
      }
    });

    // Second pass: partial matches
    uploadedColumns.forEach(uploadedCol => {
      if (!suggestions[uploadedCol]) {
        const normalizedUploaded = uploadedCol.toLowerCase()
          .replace(/[_\s-]/g, '');

        const partialMatch = standardFields.find(stdField => {
          const normalizedStd = stdField.path.toLowerCase()
            .replace(/[._\[\]]/g, '');
          
          return normalizedStd.includes(normalizedUploaded.substring(0, 4)) ||
                 normalizedUploaded.includes(normalizedStd.substring(0, 4));
        });

        if (partialMatch && !usedTargets.has(partialMatch.path)) {
          suggestions[uploadedCol] = partialMatch.path;
          usedTargets.add(partialMatch.path);
        }
      }
    });

    return suggestions;
  }
}

module.exports = FieldsController;
