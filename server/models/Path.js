const mongoose = require('mongoose');

const PathSchema = new mongoose.Schema({
  startBuilding: {
    type: String,
    ref: 'Building',
    required: true
  },
  endBuilding: {
    type: String,
    ref: 'Building',
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  isAccessible: {
    type: Boolean,
    default: true
  },
  pathType: {
    type: String,
    enum: ['walking', 'cycling', 'shuttle'],
    default: 'walking'
  }
});

// Compound index to ensure unique paths
PathSchema.index({ startBuilding: 1, endBuilding: 1 }, { unique: true });

module.exports = mongoose.model('Path', PathSchema);
