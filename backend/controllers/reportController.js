const ReportGenerator = require('../utils/reportGenerator');
const Upload = require('../models/upload');
const FieldMapping = require('../models/fieldMapping');
const Validation = require('../models/validation');
const Report = require('../models/report');

class ReportController {
  // Generate and download report
  static async generateReport(req, res) {
    try {
      const { uploadId } = req.params;
      const { format = 'json' } = req.query;

      // Validate format
      const validFormats = ['json', 'csv', 'pdf'];
      if (!validFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid format',
          message: `Format must be one of: ${validFormats.join(', ')}`
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
          message: 'Please complete field mapping before generating report'
        });
      }

      // Get validation results
      const validation = await Validation.findOne({ uploadId })
        .sort({ createdAt: -1 });
      if (!validation) {
        return res.status(400).json({
          error: 'Validation results not found',
          message: 'Please complete validation before generating report'
        });
      }

      // Check if report already exists
      let existingReport = await Report.findOne({ 
        uploadId, 
        format: format.toLowerCase() 
      });

      if (existingReport) {
        // Increment download count
        existingReport.downloadCount += 1;
        await existingReport.save();

        // Set response headers and send existing file
        res.setHeader('Content-Type', ReportController.getContentType(format));
        res.setHeader('Content-Disposition', `attachment; filename="${existingReport.reportData.reportId}_readiness_report.${format}"`);
        
        if (format === 'pdf') {
          const fs = require('fs');
          const fileBuffer = fs.readFileSync(existingReport.filePath);
          res.setHeader('Content-Length', fileBuffer.length);
          res.send(fileBuffer);
        } else {
          const content = format === 'json' ? 
            JSON.stringify(existingReport.reportData, null, 2) : 
            ReportController.generateCSVFromReport(existingReport.reportData);
          res.setHeader('Content-Length', Buffer.byteLength(content));
          res.send(content);
        }
        return;
      }

      // Generate new report
      const reportGenerator = new ReportGenerator();
      let content;
      let filename;

      const reportId = `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      switch (format.toLowerCase()) {
        case 'json':
          content = await reportGenerator.generateJSONReport(upload, fieldMapping, validation.results);
          filename = `${reportId}_readiness_report.json`;
          break;
          
        case 'csv':
          content = await reportGenerator.generateCSVReport(upload, fieldMapping, validation.results);
          filename = `${reportId}_readiness_report.csv`;
          break;
          
        case 'pdf':
          content = await reportGenerator.generatePDFReport(upload, fieldMapping, validation.results);
          filename = `${reportId}_readiness_report.pdf`;
          break;
      }

      // Save report to database
      const reportData = await reportGenerator.generateJSONReport(upload, fieldMapping, validation.results);
      const parsedReportData = JSON.parse(reportData);

      const report = new Report({
        reportId,
        uploadId,
        validationId: validation.validationId,
        reportData: parsedReportData,
        format: format.toLowerCase(),
        filePath: format === 'pdf' ? await ReportController.saveReportFile(reportId, format, content) : null,
        fileSize: Buffer.byteLength(content)
      });

      await report.save();

      // Update upload status
      await Upload.findOneAndUpdate(
        { uploadId },
        { status: 'completed' }
      );

      // Set response headers
      res.setHeader('Content-Type', ReportController.getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', content.length);

      // Send file
      res.send(content);

      // Clean up old reports
      reportGenerator.cleanupOldReports();

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({
        error: 'Failed to generate report',
        message: error.message
      });
    }
  }

  // Get report summary without downloading
  static async getReportSummary(req, res) {
    try {
      const { uploadId } = req.params;

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

      // Get validation results
      const validation = await Validation.findOne({ uploadId })
        .sort({ createdAt: -1 });

      if (!validation) {
        return res.status(400).json({
          error: 'Validation results not found',
          message: 'Please complete validation before viewing report summary'
        });
      }

      // Get existing reports
      const existingReports = await Report.find({ uploadId })
        .select('format downloadCount createdAt');

      const summary = {
        uploadId,
        uploadSummary: {
          rowsParsed: upload.rowsParsed,
          originalFilename: upload.originalFilename,
          uploadedAt: upload.createdAt,
          status: upload.status
        },
        mappingSummary: fieldMapping ? {
          mappingId: fieldMapping.mappingId,
          mappedFields: Object.keys(fieldMapping.mappings).filter(key => fieldMapping.mappings[key]).length,
          totalMappings: Object.keys(fieldMapping.mappings).length
        } : null,
        validationSummary: {
          validationId: validation.validationId,
          rowsChecked: validation.results.rowsChecked,
          passed: validation.results.passed,
          failed: validation.results.failed,
          score: validation.results.score,
          issuesCount: validation.results.issues.length,
          readinessLevel: ReportController.getReadinessLevel(validation.results.score)
        },
        availableFormats: ['json', 'csv', 'pdf'],
        existingReports: existingReports.map(report => ({
          format: report.format,
          downloadCount: report.downloadCount,
          createdAt: report.createdAt
        }))
      };

      res.json(summary);

    } catch (error) {
      console.error('Error getting report summary:', error);
      res.status(500).json({
        error: 'Failed to get report summary',
        message: error.message
      });
    }
  }

  // Get all reports for an upload (for history)
  static async getUploadReports(req, res) {
    try {
      const { uploadId } = req.params;

      const reports = await Report.find({ uploadId })
        .select('reportId format downloadCount createdAt fileSize')
        .sort({ createdAt: -1 });

      res.json({
        uploadId,
        reports: reports.map(report => ({
          reportId: report.reportId,
          format: report.format,
          downloadCount: report.downloadCount,
          createdAt: report.createdAt,
          fileSize: report.fileSize
        }))
      });

    } catch (error) {
      console.error('Error getting upload reports:', error);
      res.status(500).json({
        error: 'Failed to get upload reports',
        message: error.message
      });
    }
  }

  // Delete a specific report
  static async deleteReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findOne({ reportId });
      if (!report) {
        return res.status(404).json({
          error: 'Report not found',
          message: `Report with ID ${reportId} not found`
        });
      }

      // Delete file if it exists
      if (report.filePath) {
        const fs = require('fs');
        try {
          if (fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
          }
        } catch (fileError) {
          console.warn('Could not delete report file:', fileError.message);
        }
      }

      await Report.deleteOne({ reportId });

      res.json({
        success: true,
        message: 'Report deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        error: 'Failed to delete report',
        message: error.message
      });
    }
  }

  // Get report by ID (shareable URL)
  static async getReport(req, res) {
    try {
      const { reportId } = req.params;

      const report = await Report.findOne({ reportId });
      if (!report) {
        return res.status(404).json({
          error: 'Report not found',
          message: `Report with ID ${reportId} not found`
        });
      }

      // Return the full report data
      res.json({
        reportId: report.reportId,
        uploadId: report.uploadId,
        validationId: report.validationId,
        generatedAt: report.createdAt,
        ...report.reportData
      });

    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({
        error: 'Failed to get report',
        message: error.message
      });
    }
  }

  // Static helper methods
  static getContentType(format) {
    const contentTypes = {
      'json': 'application/json',
      'csv': 'text/csv',
      'pdf': 'application/pdf'
    };
    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  static async saveReportFile(reportId, format, content) {
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, '../reports');
    const filename = `${reportId}_report.${format}`;
    const filepath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, content);
    return filepath;
  }

  static generateCSVFromReport(reportData) {
    const { Parser } = require('json2csv');
    const csvData = [];

    // Add summary section
    csvData.push({
      section: 'SUMMARY',
      field: 'Total Rows',
      value: reportData.summary.totalRows,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Passed Rows',
      value: reportData.summary.passedRows,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Failed Rows',
      value: reportData.summary.failedRows,
      details: ''
    });
    csvData.push({
      section: 'SUMMARY',
      field: 'Overall Score',
      value: `${reportData.summary.overallScore}%`,
      details: reportData.summary.readinessLevel
    });

    const parser = new Parser();
    return parser.parse(csvData);
  }

  static getReadinessLevel(score) {
    if (score >= 90) return 'HIGH READINESS';
    if (score >= 70) return 'MEDIUM READINESS';
    if (score >= 50) return 'LOW READINESS';
    return 'NEEDS ATTENTION';
  }
}

module.exports = ReportController;
