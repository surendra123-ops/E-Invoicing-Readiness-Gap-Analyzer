


const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema({
  validationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  uploadId: {
    type: String,
    required: true,
    ref: 'Upload',
    index: true
  },
  mappingId: {
    type: String,
    required: true,
    ref: 'FieldMapping',
    index: true
  },
  results: {
    uploadId: String,
    rowsChecked: Number,
    passed: Number,
    failed: Number,
    score: Number,
    issues: [mongoose.Schema.Types.Mixed],
    ruleResults: mongoose.Schema.Types.Mixed
  },
  fieldMappings: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for queries
validationSchema.index({ uploadId: 1 });
validationSchema.index({ createdAt: -1 });
validationSchema.index({ 'results.score': -1 });

module.exports = mongoose.model('Validation', validationSchema);