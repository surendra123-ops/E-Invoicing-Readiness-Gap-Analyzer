const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UploadController = require('../controllers/uploadController');

// Upload file (multipart)
router.post('/', upload.single('file'), UploadController.uploadFile);

// Upload JSON payload
router.post('/json', UploadController.uploadJsonPayload);

// Get upload history - MUST come before /:uploadId route
router.get('/history', UploadController.getUploadHistory);

// Get upload details - MUST come after specific routes
router.get('/:uploadId', UploadController.getUpload);

module.exports = router;
