import { customPoints } from "../../MapData/customPoints.js";
import { dijkstra } from "../../StructuresAlgorithms/Dijkstra.js";
import { drawRoute } from "../../Utils/drawRoute.js";

// Core Logic
const map = L.map("map", { attributionControl: false }).setView(
  [31.451, 73.0805],
  16
);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "",
}).addTo(map);

const startSel = document.getElementById("start");
const endSel = document.getElementById("end");

let pointMap = {};
let routeLine = null;
let graph = {};

fetch("../../MapData/hospital.json")
  .then((res) => res.json())
  .then((data) => {
    const rawCoords = [
      [73.08006355854093, 31.44751072199513],
      [73.07796725661927, 31.451066767220894],
      [73.08100871200836, 31.453578659675102],
      [73.08258396778746, 31.452524293267814],
      [73.08405016739752, 31.45395078616187],
      [73.0852013158518, 31.451966094482586],
      [73.08069366085257, 31.447469371838466],
      [73.08042163855521, 31.447236872126453],
      [73.0800760407825, 31.44753170836684],
      [73.08006355854093, 31.44751072199513],
    ];

    const boundaryPolygon = turf.polygon([rawCoords]);

    const filteredPolygons = data.features.filter(
      (f) =>
        (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") &&
        turf.booleanWithin(f, boundaryPolygon)
    );

    const filteredPoints = data.features.filter(
      (f) =>
        f.geometry.type === "Point" &&
        turf.booleanPointInPolygon(f, boundaryPolygon)
    );

    const leafletCoords = rawCoords.map(([lon, lat]) => [lat, lon]);
    L.polygon(leafletCoords, { color: "red", weight: 3, fillOpacity: 0.2 })
      .addTo(map)
      .bindPopup("Hospital Boundary");

    const outerBounds = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
      [-90, -180],
    ];

    L.polygon([outerBounds, leafletCoords], {
      color: "#000",
      fillColor: "#000",
      fillOpacity: 0.6,
      stroke: false,
      interactive: false,
    }).addTo(map);

    const bounds = L.latLngBounds(leafletCoords);
    map.setMaxBounds(bounds);
    map.setMinZoom(16);

    L.geoJSON(
      {
        type: "FeatureCollection",
        features: filteredPolygons,
      },
      {
        style: { color: "gray", weight: 1, fillOpacity: 0.2 },
        onEachFeature: (feature, layer) => {
          if (feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        },
      }
    ).addTo(map);

    startSel.innerHTML = '<option value="">Select Start</option>';
    endSel.innerHTML = '<option value="">Select End</option>';

    customPoints.forEach((p) => {
      const id = `${p.name}-${p.lat}-${p.lon}`;
      pointMap[id] = [p.lon, p.lat];
      L.marker([p.lat, p.lon]).addTo(map).bindPopup(p.name);
      startSel.appendChild(new Option(p.name, id));
      endSel.appendChild(new Option(p.name, id));
    });

    filteredPoints.forEach((feature) => {
      const props = feature.properties;
      const geom = feature.geometry;
      const id = props.id || props.name || Math.random().toString(36).slice(2);
      const name = props.name || `Unnamed Point (${id})`;
      const [lon, lat] = geom.coordinates;
      pointMap[id] = [lon, lat];
      L.marker([lat, lon]).addTo(map).bindPopup(name);
      startSel.appendChild(new Option(name, id));
      endSel.appendChild(new Option(name, id));
    });

    // Build graph
    const nodeList = Object.entries(pointMap);
    nodeList.forEach(([id1, coord1]) => {
      graph[id1] = [];
      nodeList.forEach(([id2, coord2]) => {
        if (id1 !== id2) {
          const dist = calcDistance(coord1[1], coord1[0], coord2[1], coord2[0]);
          graph[id1].push({ id: id2, dist });
        }
      });
    });

    startSel.addEventListener("change", () => {

      routeLine = drawRoute(
        map,
        graph,
        pointMap,
        dijkstra,
        routeLine,
        startSel,
        endSel
      );
    });

    endSel.addEventListener("change", () => {
      routeLine = drawRoute(
        map,
        graph,
        pointMap,
        dijkstra,
        routeLine,
        startSel,
        endSel
      );
    });

    function calcDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
  });

// Clearing Data
const clearBtn = document.getElementById("clearBtn");

clearBtn.addEventListener("click", () => {
  // Remove route from map
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  // Reset dropdowns
  startSel.selectedIndex = 0;
  endSel.selectedIndex = 0;

  // Clear distance text
  document.getElementById("distance").innerText =
    "Select starting point and destination to see route information";

  // Reset map center and zoom
  map.setView([31.451, 73.0805], 16);
});
