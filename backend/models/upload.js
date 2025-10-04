// Future: Upload model for MongoDB
// Will store uploaded file metadata and parsed data
// Stage 2 implementation

const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    unique: true
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
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  country: {
    type: String,
    default: null
  },
  erp: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for cleanup
uploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Upload', uploadSchema);