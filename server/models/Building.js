const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  buildingId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  floors: Number,
  facilities: [String],
  openingHours: String
});

module.exports = mongoose.model('Building', BuildingSchema);
