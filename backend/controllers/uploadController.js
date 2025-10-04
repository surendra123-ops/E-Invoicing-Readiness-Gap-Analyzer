const crypto = require('crypto');
const FileParser = require('../utils/fileParser');
const Upload = require('../models/upload');

class UploadController {
  // Handle multipart file upload
  static async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please upload a CSV or JSON file'
        });
      }

      const { country, erp } = req.body;
      
      // Parse the uploaded file
      const parsedData = await FileParser.parseFile(req.file.buffer, req.file.originalname);
      
      if (!parsedData || parsedData.length === 0) {
        return res.status(400).json({
          error: 'Empty file',
          message: 'The uploaded file contains no data'
        });
      }

      // Detect column types
      const columnTypes = FileParser.detectColumnTypes(parsedData);
      
      // Generate preview (first 20 rows)
      const preview = FileParser.generatePreview(parsedData);
      
      // Generate unique upload ID
      const uploadId = 'u_' + crypto.randomBytes(8).toString('hex');
      
      // Save to database
      const upload = new Upload({
        uploadId,
        originalFilename: req.file.originalname,
        fileType: req.file.originalname.toLowerCase().split('.').pop(),
        rowsParsed: parsedData.length,
        preview: {
          data: preview,
          columnTypes
        },
        rawData: parsedData,
        country: country || null,
        erp: erp || null,
        status: 'uploaded'
      });
      
      await upload.save();
      
      res.json({
        uploadId,
        rowsParsed: parsedData.length,
        preview: preview.map(row => {
          const typedRow = {};
          Object.keys(row).forEach(key => {
            const value = row[key];
            const type = columnTypes[key];
            
            // Convert values based on detected type
            if (type === 'number') {
              typedRow[key] = isNaN(Number(value)) ? value : Number(value);
            } else if (type === 'date') {
              typedRow[key] = value;
            } else {
              typedRow[key] = value;
            }
          });
          return typedRow;
        })
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  }

  // Handle JSON payload upload
  static async uploadJsonPayload(req, res) {
    try {
      const { text, country, erp } = req.body;
      
      if (!text) {
        return res.status(400).json({
          error: 'No text data provided',
          message: 'Please provide CSV or JSON text data'
        });
      }

      // Try to parse as JSON first, then CSV
      let parsedData;
      try {
        parsedData = await FileParser.parseJSON(Buffer.from(text));
      } catch (jsonError) {
        // Try CSV parsing
        parsedData = await FileParser.parseCSV(Buffer.from(text));
      }
      
      if (!parsedData || parsedData.length === 0) {
        return res.status(400).json({
          error: 'Empty data',
          message: 'The provided data contains no valid records'
        });
      }

      // Detect column types
      const columnTypes = FileParser.detectColumnTypes(parsedData);
      
      // Generate preview (first 20 rows)
      const preview = FileParser.generatePreview(parsedData);
      
      // Generate unique upload ID
      const uploadId = 'u_' + crypto.randomBytes(8).toString('hex');
      
      // Save to database
      const upload = new Upload({
        uploadId,
        originalFilename: 'uploaded_data',
        fileType: 'json', // Default to JSON for text payloads
        rowsParsed: parsedData.length,
        preview: {
          data: preview,
          columnTypes
        },
        rawData: parsedData,
        country: country || null,
        erp: erp || null,
        status: 'uploaded'
      });
      
      await upload.save();
      
      res.json({
        uploadId,
        rowsParsed: parsedData.length,
        preview: preview.map(row => {
          const typedRow = {};
          Object.keys(row).forEach(key => {
            const value = row[key];
            const type = columnTypes[key];
            
            // Convert values based on detected type
            if (type === 'number') {
              typedRow[key] = isNaN(Number(value)) ? value : Number(value);
            } else if (type === 'date') {
              typedRow[key] = value;
            } else {
              typedRow[key] = value;
            }
          });
          return typedRow;
        })
      });
      
    } catch (error) {
      console.error('JSON upload error:', error);
      res.status(400).json({
        error: 'Upload failed',
        message: error.message
      });
    }
  }

  // Get upload details
  static async getUpload(req, res) {
    try {
      const { uploadId } = req.params;
      
      const upload = await Upload.findOne({ uploadId });
      
      if (!upload) {
        return res.status(404).json({
          error: 'Upload not found',
          message: 'The requested upload does not exist or has expired'
        });
      }
      
      res.json({
        uploadId: upload.uploadId,
        rowsParsed: upload.rowsParsed,
        preview: upload.preview.data,
        columnTypes: upload.preview.columnTypes,
        country: upload.country,
        erp: upload.erp,
        status: upload.status,
        createdAt: upload.createdAt
      });
      
    } catch (error) {
      console.error('Get upload error:', error);
      res.status(500).json({
        error: 'Failed to retrieve upload',
        message: error.message
      });
    }
  }

  // Get upload history
  static async getUploadHistory(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const uploads = await Upload.find({})
        .select('uploadId originalFilename rowsParsed status createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      // Get validation scores for each upload
      const uploadsWithScores = await Promise.all(
        uploads.map(async (upload) => {
          const Validation = require('../models/validation');
          const validation = await Validation.findOne({ uploadId: upload.uploadId })
            .select('results.score createdAt')
            .sort({ createdAt: -1 });

          return {
            uploadId: upload.uploadId,
            fileName: upload.originalFilename,
            rowsParsed: upload.rowsParsed,
            status: upload.status,
            score: validation?.results?.score || null,
            createdAt: upload.createdAt,
            validatedAt: validation?.createdAt || null
          };
        })
      );

      const totalCount = await Upload.countDocuments();

      res.json({
        uploads: uploadsWithScores,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalCount > parseInt(offset) + parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get upload history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve upload history',
        message: error.message
      });
    }
  }
}

module.exports = UploadController;
