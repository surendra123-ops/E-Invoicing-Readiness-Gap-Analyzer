const express = require('express');
const router = express.Router();
const FieldsController = require('../controllers/fieldsController');

// Get standard GETS fields
router.get('/', FieldsController.getStandardFields);

// Map uploaded fields to standard fields
router.post('/map', FieldsController.mapFields);

// Get field mappings for an upload
router.get('/mappings/:uploadId', FieldsController.getFieldMappings);

module.exports = router;
