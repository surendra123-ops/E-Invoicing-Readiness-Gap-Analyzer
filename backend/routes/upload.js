const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const UploadController = require('../controllers/uploadController');

// Upload file (multipart)
router.post('/', upload.single('file'), UploadController.uploadFile);

// Upload JSON payload
router.post('/json', UploadController.uploadJsonPayload);

// Get upload details
router.get('/:uploadId', UploadController.getUpload);

module.exports = router;
