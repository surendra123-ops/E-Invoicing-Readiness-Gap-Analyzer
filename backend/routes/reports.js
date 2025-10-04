const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');

// Generate and download report
router.get('/:uploadId', ReportController.generateReport);

// Get report summary
router.get('/:uploadId/summary', ReportController.getReportSummary);

// Get all reports for an upload (for history)
router.get('/:uploadId/reports', ReportController.getUploadReports);

// Delete a specific report
router.delete('/:reportId', ReportController.deleteReport);

module.exports = router;
