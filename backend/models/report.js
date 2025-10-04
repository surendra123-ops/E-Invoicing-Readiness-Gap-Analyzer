// Future: Report model for MongoDB
// Will store analysis results and scores
// Stage 4 implementation

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
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
  validationId: {
    type: String,
    required: true,
    ref: 'Validation',
    index: true
  },
  reportData: {
    reportId: String,
    generatedAt: String,
    metadata: mongoose.Schema.Types.Mixed,
    summary: mongoose.Schema.Types.Mixed,
    fieldMapping: mongoose.Schema.Types.Mixed,
    validationResults: mongoose.Schema.Types.Mixed,
    issues: [mongoose.Schema.Types.Mixed],
    ruleBreakdown: mongoose.Schema.Types.Mixed,
    recommendations: [String]
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf'],
    required: true
  },
  filePath: String,
  fileSize: Number,
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for queries
reportSchema.index({ uploadId: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ format: 1 });

module.exports = mongoose.model('Report', reportSchema);