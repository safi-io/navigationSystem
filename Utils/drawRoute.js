import { recordVisit } from "../StructuresAlgorithms/Stack.js";
import { visitedSetInstance } from "../StructuresAlgorithms/Set.js";

export function drawRoute(
  map,
  graph,
  pointMap,
  dijkstra,
  routeLine,
  startSel,
  endSel
) {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const id1 = startSel.value;
  const id2 = endSel.value;

  if (!(id1 && id2 && pointMap[id1] && pointMap[id2])) return null;

  const result = dijkstra(graph, id1, id2);
  if (!result.path || result.path.length < 2) return null;

  const pathCoords = result.path.map((id) => {
    const [lon, lat] = pointMap[id];
    return [lat, lon];
  });

  routeLine = L.polyline(pathCoords, { color: "blue" }).addTo(map);
  map.fitBounds(routeLine.getBounds());

  const distance = result.distance; // in meters
  const walkingSpeed = 1.39; // average human walking speed in m/s
  const timeSeconds = distance / walkingSpeed;

  const minutes = Math.floor(timeSeconds / 60);
  const seconds = Math.round(timeSeconds % 60);

  document.getElementById("distance").innerHTML =
    `Shortest Distance: ${distance.toFixed(2)} meters<br>` +
    `Estimated Walking Time: ${minutes} min ${seconds} sec`;

  // ✅ Get the visible labels (text) from the select options
  const startLabel = startSel.options[startSel.selectedIndex].text;
  const endLabel = endSel.options[endSel.selectedIndex].text;

  // ✅ Record to history (if you have a function for it)
  recordVisit(startLabel, endLabel);
  visitedSetInstance.insert(endLabel);

  return routeLine;
}
