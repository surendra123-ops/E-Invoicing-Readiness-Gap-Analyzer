


const mongoose = require('mongoose');

const fieldMappingSchema = new mongoose.Schema({
  mappingId: {
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
  mappings: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  autoSuggest: {
    type: Boolean,
    default: false
  },
  standardFields: [mongoose.Schema.Types.Mixed]
}, {
  timestamps: true
});

// Index for queries
fieldMappingSchema.index({ uploadId: 1 });
fieldMappingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FieldMapping', fieldMappingSchema);