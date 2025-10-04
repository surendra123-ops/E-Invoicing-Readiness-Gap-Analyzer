// Future: Upload model for MongoDB
// Will store uploaded file metadata and parsed data
// Stage 2 implementation

const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'json'],
    required: true
  },
  rowsParsed: {
    type: Number,
    required: true
  },
  preview: {
    data: [mongoose.Schema.Types.Mixed],
    columnTypes: mongoose.Schema.Types.Mixed
  },
  rawData: [mongoose.Schema.Types.Mixed],
  country: {
    type: String,
    default: null
  },
  erp: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['uploaded', 'mapped', 'validated', 'completed'],
    default: 'uploaded'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true
});

// Index for cleanup and queries
uploadSchema.index({ createdAt: -1 });
uploadSchema.index({ uploadId: 1, status: 1 });

module.exports = mongoose.model('Upload', uploadSchema);