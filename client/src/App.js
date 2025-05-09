import React, { useState } from 'react';

// Coordinates of buildings
const campusBuildings = [
  // Block A (D Block)
{
  id: 'A',
  name: 'D Block',
  points: '100,150 200,150 200,250 100,250',  // 100px width, 100px height
  center: [150, 200]
},
// Block B (B Block)
{
  id: 'B',
  name: 'B Block',
  points: '300,150 400,150 400,250 300,250',  // 100px width, 100px height
  center: [350, 200]
}
,
{
  id: 'C',
  name: 'C Block',
  points: '500,50 600,50 600,200 500,200',  // Updated to be a rectangle
  center: [550, 125]  // Corrected center for the rectangle
}

];

// Roads between buildings (defined by start and end coordinates)
const roads = [
  { start: [250, 200], end: [350, 300] }, // A to B
];

function CampusMapSVG() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
  };

  return (
    <div>
      <h1>Campus Map</h1>
      <svg width="800" height="600" style={{ border: '1px solid black' }}>
        <rect width="100%" height="100%" fill="#f0f0f0" />
        
        {/* Draw roads (lines between buildings) */}
        {roads.map((road, index) => (
          <line
            key={index}
            x1={road.start[0]}
            y1={road.start[1]}
            x2={road.end[0]}
            y2={road.end[1]}
            stroke="gray"
            strokeWidth="3"
            strokeDasharray="5,5" // Makes the road dashed for a more road-like appearance
          />
        ))}

        {/* Draw buildings (polygons) */}
        {campusBuildings.map((building) => (
          <polygon
            key={building.id}
            points={building.points}
            fill="lightblue"
            stroke="blue"
            strokeWidth="2"
            onClick={() => handleBuildingClick(building)}
          />
        ))}
      </svg>
      {selectedBuilding && (
        <div>
          <h3>Selected Building</h3>
          <p>{selectedBuilding.name}</p>
        </div>
      )}
    </div>
  );
}

export default CampusMapSVG;
