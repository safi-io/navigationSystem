import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.*;
import java.lang.reflect.Type;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;

/**
 * HospitalNavigator.java
 *
 * A Swing GUI that:
 * 1) Loads graph.json (nodes + edges)
 * 2) Lets the user pick "Source" and "Destination" node IDs from dropdowns
 * 3) Runs Dijkstra in Java to find shortest path
 * 4) Generates a temporary HTML file that uses Leaflet + map.geojson
 *    to display the hospital map and overlay the computed path
 * 5) Opens that HTML file in the default browser
 *
 * Prerequisites:
 * - graph.json and map.geojson must be in the working directory
 * - Gson (gson-2.x.jar) must be on the classpath at compile/run time
 *
 * Compile & Run (example on Windows):
 *   > javac ‑cp .;Gson‑2.x.jar src/HospitalNavigator.java
 *   > java  ‑cp .;Gson‑2.x.jar src.HospitalNavigator
 *
 * (On Mac/Linux, replace ';' with ':')
 */
public class HospitalNavigator {

    // Data structures to hold the graph
    private static Map<String, Node> nodes;           // nodeId → Node(lat,lon)
    private static Map<String, List<Edge>> adjacency; // nodeId → list of outgoing edges

    // Simple container classes to match graph.json
    private static class Node {
        double lat;
        double lon;
    }

    private static class Edge {
        String from;
        String to;
        double weight;
    }

    // For Dijkstra's algorithm
    private static class DistPair implements Comparable<DistPair> {
        String nodeId;
        double dist;
        DistPair(String nodeId, double dist) {
            this.nodeId = nodeId;
            this.dist = dist;
        }
        public int compareTo(DistPair other) {
            return Double.compare(this.dist, other.dist);
        }
    }

    public static void main(String[] args) {
        // 1) Load graph.json from the working directory
        try {
            loadGraph("graph.json");
        } catch (IOException e) {
            JOptionPane.showMessageDialog(null,
                    "Failed to load graph.json:\n" + e.getMessage(),
                    "Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        // 2) Build and show the Swing UI on the Event Dispatch Thread
        SwingUtilities.invokeLater(HospitalNavigator::createAndShowGUI);
    }

    /**
     * loadGraph: Parses graph.json into 'nodes' and 'adjacency'
     */
    private static void loadGraph(String filename) throws IOException {
        Gson gson = new Gson();
        try (Reader reader = Files.newBufferedReader(Paths.get(filename))) {
            // We expect a JSON object with two keys: "nodes" and "edges"
            // "nodes" is an object: { nodeId: { lat: ..., lon: ... }, ... }
            // "edges" is an array: [ { from:"100", to:"101", weight:12.4 }, ... ]
            Type graphType = new TypeToken<Map<String, Object>>(){}.getType();
            Map<String, Object> raw = gson.fromJson(reader, graphType);

            // 1) Load nodes
            Map<String, Object> rawNodes = (Map<String, Object>) raw.get("nodes");
            nodes = new HashMap<>();
            for (String nodeId : rawNodes.keySet()) {
                Map<String, Double> coords = (Map<String, Double>) rawNodes.get(nodeId);
                Node n = new Node();
                n.lat = coords.get("lat");
                n.lon = coords.get("lon");
                nodes.put(nodeId, n);
            }

            // 2) Load edges and build adjacency list
            List<Map<String, Object>> rawEdges = (List<Map<String, Object>>) raw.get("edges");
            adjacency = new HashMap<>();
            // Initialize adjacency lists
            for (String nodeId : nodes.keySet()) {
                adjacency.put(nodeId, new ArrayList<>());
            }
            // Populate
            for (Map<String, Object> e : rawEdges) {
                String from = (String) e.get("from");
                String to   = (String) e.get("to");
                double w    = ((Number) e.get("weight")).doubleValue();
                Edge edge = new Edge();
                edge.from = from;
                edge.to = to;
                edge.weight = w;
                if (adjacency.containsKey(from)) {
                    adjacency.get(from).add(edge);
                }
            }
        }
    }

    /**
     * createAndShowGUI: Builds the Swing window with two dropdowns and a button.
     */
    private static void createAndShowGUI() {
        JFrame frame = new JFrame("Hospital Navigation (DSA Project)");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(400, 200);
        frame.setLayout(new BorderLayout());

        // Panel at top with labels & dropdowns
        JPanel topPanel = new JPanel(new GridLayout(3, 2, 10, 10));
        topPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JLabel lblFrom = new JLabel("Source Node ID:");
        JLabel lblTo   = new JLabel("Destination Node ID:");
        JComboBox<String> cmbFrom = new JComboBox<>();
        JComboBox<String> cmbTo   = new JComboBox<>();

        // Populate both dropdowns with sorted node IDs
        List<String> nodeList = new ArrayList<>(nodes.keySet());
        Collections.sort(nodeList, Comparator.comparingInt(Integer::parseInt));
        for (String nid : nodeList) {
            cmbFrom.addItem(nid);
            cmbTo.addItem(nid);
        }

        topPanel.add(lblFrom);
        topPanel.add(cmbFrom);
        topPanel.add(lblTo);
        topPanel.add(cmbTo);

        frame.add(topPanel, BorderLayout.CENTER);

        // “Show Route” button at bottom
        JButton btnShowRoute = new JButton("Show Shortest Route");
        frame.add(btnShowRoute, BorderLayout.SOUTH);

        // Button action: compute Dijkstra & generate HTML
        btnShowRoute.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent ae) {
                String fromId = (String) cmbFrom.getSelectedItem();
                String toId   = (String) cmbTo.getSelectedItem();
                if (fromId.equals(toId)) {
                    JOptionPane.showMessageDialog(frame,
                            "Source and Destination cannot be the same.",
                            "Input Error", JOptionPane.WARNING_MESSAGE);
                    return;
                }
                // 1) Run Dijkstra
                List<String> path = computeShortestPath(fromId, toId);
                if (path == null) {
                    JOptionPane.showMessageDialog(frame,
                            "No path found between " + fromId + " and " + toId,
                            "No Path", JOptionPane.ERROR_MESSAGE);
                    return;
                }
                // 2) Generate HTML file with the path
                try {
                    File htmlFile = generateHtmlWithPath(path);
                    // 3) Open it in default browser
                    Desktop.getDesktop().browse(htmlFile.toURI());
                } catch (Exception ex) {
                    ex.printStackTrace();
                    JOptionPane.showMessageDialog(frame,
                            "Failed to generate/open HTML:\n" + ex.getMessage(),
                            "Error", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }

    /**
     * computeShortestPath: Simple Dijkstra's algorithm
     * Returns a List<String> of node IDs from source → destination (inclusive).
     * If no path, returns null.
     */
    private static List<String> computeShortestPath(String startId, String endId) {
        // Distances and previous‐node map
        Map<String, Double> dist = new HashMap<>();
        Map<String, String> prev = new HashMap<>();
        for (String nid : nodes.keySet()) {
            dist.put(nid, Double.POSITIVE_INFINITY);
            prev.put(nid, null);
        }
        dist.put(startId, 0.0);

        // Min‐heap (priority queue) of (nodeId, dist)
        PriorityQueue<DistPair> pq = new PriorityQueue<>();
        pq.add(new DistPair(startId, 0.0));

        Set<String> visited = new HashSet<>();

        while (!pq.isEmpty()) {
            DistPair uPair = pq.poll();
            String u = uPair.nodeId;
            if (visited.contains(u)) continue;
            visited.add(u);
            if (u.equals(endId)) break;

            // Relax edges from u
            for (Edge e : adjacency.get(u)) {
                String v = e.to;
                if (visited.contains(v)) continue;
                double alt = dist.get(u) + e.weight;
                if (alt < dist.get(v)) {
                    dist.put(v, alt);
                    prev.put(v, u);
                    pq.add(new DistPair(v, alt));
                }
            }
        }

        if (dist.get(endId).isInfinite()) {
            return null; // no path
        }
        // Reconstruct path by walking prev[] backward
        LinkedList<String> path = new LinkedList<>();
        String cur = endId;
        while (cur != null) {
            path.addFirst(cur);
            cur = prev.get(cur);
        }
        return path;
    }

    /**
     * generateHtmlWithPath:
     *   • Takes a List<String> of node IDs (the computed path)
     *   • Builds an HTML string that:
     *       – loads Leaflet
     *       – loads map.geojson
     *       – draws a polyline connecting the lat/lon of each node in 'path'
     *   • Writes that string to a temp file route.html in the working directory
     *   • Returns the File object pointing to route.html
     */
    private static File generateHtmlWithPath(List<String> path) throws IOException {
        // 1) Build a JSON array of coordinates: [[lat,lon],[lat,lon],…]
        StringBuilder coordsJsArray = new StringBuilder("[\n");
        for (int i = 0; i < path.size(); i++) {
            Node n = nodes.get(path.get(i));
            coordsJsArray.append("  [")
                    .append(n.lat).append(", ")
                    .append(n.lon).append("]");
            if (i < path.size() - 1) coordsJsArray.append(",");
            coordsJsArray.append("\n");
        }
        coordsJsArray.append("]");

        // 2) Build the full HTML content
        String html =
                "<!DOCTYPE html>\n" +
                        "<html>\n" +
                        "<head>\n" +
                        "  <meta charset=\"UTF-8\">\n" +
                        "  <title>Hospital Route</title>\n" +
                        "  <link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet/dist/leaflet.css\" />\n" +
                        "  <style>\n" +
                        "    body { margin: 0; padding: 0; }\n" +
                        "    #map { width: 100vw; height: 100vh; }\n" +
                        "  </style>\n" +
                        "</head>\n" +
                        "<body>\n" +
                        "  <div id=\"map\"></div>\n" +
                        "  <script src=\"https://unpkg.com/leaflet/dist/leaflet.js\"></script>\n" +
                        "  <script>\n" +
                        "    // 1) Initialize Leaflet map and set view to the average of all path coords\n" +
                        "    const pathCoords = " + coordsJsArray.toString() + ";\n" +
                        "    // Compute a rough center by averaging lat/lon\n" +
                        "    let sumLat = 0, sumLon = 0;\n" +
                        "    pathCoords.forEach(c => { sumLat += c[0]; sumLon += c[1]; });\n" +
                        "    const avgLat = sumLat / pathCoords.length;\n" +
                        "    const avgLon = sumLon / pathCoords.length;\n" +
                        "    const map = L.map('map').setView([avgLat, avgLon], 18);\n\n" +
                        "    // 2) Add an OSM tile layer (so the hospital sits on real-world map)\n" +
                        "    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {\n" +
                        "      attribution: '© OpenStreetMap contributors'\n" +
                        "    }).addTo(map);\n\n" +
                        "    // 3) Load your custom geojson (hospital layout)\n" +
                        "    fetch('map.geojson')\n" +
                        "      .then(resp => resp.json())\n" +
                        "      .then(geoData => {\n" +
                        "        L.geoJSON(geoData, {\n" +
                        "          style: { color: '#3388ff', weight: 1, fillOpacity: 0.3 },\n" +
                        "          onEachFeature: (f, layer) => {\n" +
                        "            if (f.properties && f.properties.name) {\n" +
                        "              layer.bindPopup(f.properties.name);\n" +
                        "            }\n" +
                        "          }\n" +
                        "        }).addTo(map);\n" +
                        "        // 4) Draw the computed path as a red polyline\n" +
                        "        L.polyline(pathCoords, { color: 'red', weight: 4 }).addTo(map);\n" +
                        "        // Fit map bounds to the path\n" +
                        "        const bounds = L.latLngBounds(pathCoords);\n" +
                        "        map.fitBounds(bounds.pad(0.1));\n" +
                        "      })\n" +
                        "      .catch(err => console.error('Failed to load map.geojson:', err));\n" +
                        "  </script>\n" +
                        "</body>\n" +
                        "</html>\n";

        // 3) Write to a temporary file named "route.html"
        File outFile = new File("route.html");
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outFile))) {
            writer.write(html);
        }
        return outFile;
    }
}
