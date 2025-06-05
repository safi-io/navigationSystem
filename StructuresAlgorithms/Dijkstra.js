export function dijkstra(graph, startId, endId) {
  const distances = {};
  const prev = {};
  const visited = new Set();
  const pq = new Map();

  for (const node in graph) {
    distances[node] = Infinity;
    pq.set(node, Infinity);
  }
  distances[startId] = 0;
  pq.set(startId, 0);

  while (pq.size) {
    const currentId = [...pq.entries()].reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    pq.delete(currentId);

    if (currentId === endId) break;
    visited.add(currentId);

    for (const neighbor of graph[currentId]) {
      if (visited.has(neighbor.id)) continue;
      const alt = distances[currentId] + neighbor.dist;
      if (alt < distances[neighbor.id]) {
        distances[neighbor.id] = alt;
        prev[neighbor.id] = currentId;
        pq.set(neighbor.id, alt);
      }
    }
  }

  const path = [];
  let u = endId;
  while (u) {
    path.unshift(u);
    u = prev[u];
  }

  return { path, distance: distances[endId] };
}
