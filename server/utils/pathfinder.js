// Main Algorithm
class PriorityQueue {
  constructor() {
    this.values = [];
  }
  
  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }
  
  dequeue() {
    return this.values.shift();
  }
  
  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }
  
  isEmpty() {
    return !this.values.length;
  }
}

// Dijkstra's algorithm
async function findShortestPath(startBuildingId, endBuildingId, Path) {
  try {
    // Get all paths from database
    const allPaths = await Path.find({});
    
    // Build adjacency list
    const graph = {};
    allPaths.forEach(path => {
      // Initialize building nodes if they don't exist
      if (!graph[path.startBuilding]) graph[path.startBuilding] = [];
      if (!graph[path.endBuilding]) graph[path.endBuilding] = [];
      
      graph[path.startBuilding].push({ node: path.endBuilding, weight: path.distance });
      graph[path.endBuilding].push({ node: path.startBuilding, weight: path.distance });
    });
    
    // Initialize data structures
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();
    
    // Initialize all distances as infinity except starting node
    Object.keys(graph).forEach(building => {
      if (building === startBuildingId) {
        distances[building] = 0;
        pq.enqueue(building, 0);
      } else {
        distances[building] = Infinity;
        pq.enqueue(building, Infinity);
      }
      previous[building] = null;
    });
    
    // Dijkstra's algorithm
    while (!pq.isEmpty()) {
      const current = pq.dequeue().val;
      
      if (current === endBuildingId) break; // Found the destination
      
      if (distances[current] === Infinity) continue; // Skip unreachable nodes
      
      // Check all neighbors of current node
      if (graph[current]) {
        for (let neighbor of graph[current]) {
          const distance = distances[current] + neighbor.weight;
          
          // If found shorter path, update
          if (distance < distances[neighbor.node]) {
            distances[neighbor.node] = distance;
            previous[neighbor.node] = current;
            pq.enqueue(neighbor.node, distance);
          }
        }
      }
    }
    
    // Reconstruct path
    const path = [];
    let current = endBuildingId;
    
    while (current) {
      path.unshift(current);
      current = previous[current];
    }
    
    // If path doesn't start with startBuildingId, no path exists
    if (path[0] !== startBuildingId) {
      return { path: [], distance: null, error: "No path exists between these buildings" };
    }
    
    return {
      path,
      distance: distances[endBuildingId],
      error: null
    };
  } catch (error) {
    return { path: [], distance: null, error: error.message };
  }
}

module.exports = { findShortestPath };
