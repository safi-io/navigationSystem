const express = require('express');
const router = express.Router();
const Building = require('../models/Building');
const Path = require('../models/Path');
const { findShortestPath } = require('../utils/pathfinder');

// Get shortest path between two buildings
router.get('/shortest-path', async (req, res) => {
  try {
    const { startBuilding, endBuilding } = req.query;

    if (!startBuilding || !endBuilding) {
      return res.status(400).json({
        success: false,
        error: 'Start and end building IDs are required'
      });
    }
    
    // Verify both buildings exist
    const [startExists, endExists] = await Promise.all([
      Building.exists({ buildingId: startBuilding }),
      Building.exists({ buildingId: endBuilding })
    ]);
    
    if (!startExists || !endExists) {
      return res.status(404).json({
        success: false,
        error: 'One or both buildings not found'
      });
    }
    
    // Find shortest path
    const result = await findShortestPath(startBuilding, endBuilding, Path);
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    const buildingDetails = await Building.find(
      { buildingId: { $in: result.path } },
      'buildingId name'
    );
    
    // Ensure the order matches result.path
    const pathWithDetails = result.path.map(id =>
      buildingDetails.find(b => b.buildingId === id)
    );
        
    res.json({
      success: true,
      path: pathWithDetails,
      distance: result.distance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a new building
router.post('/buildings', async (req, res) => {
  try {
    const building = new Building(req.body);
    await building.save();
    res.status(201).json({
      success: true,
      data: building
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Add a new path between buildings
router.post('/paths', async (req, res) => {
  try {
    const { startBuilding, endBuilding, distance } = req.body;
    
    // Verify both buildings exist
    const [startExists, endExists] = await Promise.all([
      Building.exists({ buildingId: startBuilding }),
      Building.exists({ buildingId: endBuilding })
    ]);
    
    if (!startExists || !endExists) {
      return res.status(404).json({
        success: false,
        error: 'One or both buildings not found'
      });
    }
    
    const path = new Path(req.body);
    await path.save();
    
    res.status(201).json({
      success: true,
      data: path
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all buildings
router.get('/buildings', async (req, res) => {
  try {
    const buildings = await Building.find();
    res.json({
      success: true,
      count: buildings.length,
      data: buildings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
