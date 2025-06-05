class Stack {
  constructor() {
    this.items = [];
  }
  push(item) {
    this.items.push(item);
  }
  pop() {
    return this.items.pop();
  }
  peek() {
    return this.items[this.items.length - 1];
  }
  isEmpty() {
    return this.items.length === 0;
  }
  toArray() {
    return [...this.items];
  }
}

const visitHistory = new Stack();

// Example: Call this when a route is calculated
export function recordVisit(from, to) {
  visitHistory.push(`From ${from} → To ${to}`);
  updateHistoryList();
}

document.getElementById("popVisitBtn").addEventListener("click", () => {
  const removed = visitHistory.pop();
  if (removed) {
    updateHistoryList();
  } else {
    alert("No visits to remove.");
  }ww
});

// Show overlay
document.getElementById("historyBtn").addEventListener("click", () => {
  const overlay = document.getElementById("historyOverlay");
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const entries = visitHistory.toArray().reverse();
  if (entries.length === 0) {
    list.innerHTML = "<li>No visits recorded yet.</li>";
  } else {
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      list.appendChild(li);
    });
  }

  overlay.classList.remove("hidden");
});


function updateHistoryList() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const entries = visitHistory.toArray().reverse(); // Show newest first

  if (entries.length === 0) {
    list.innerHTML = "<li>No visits recorded yet.</li>";
  } else {
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      list.appendChild(li);
    });
  }
}
