// visited-locations.js
export class VisitedSet {
  constructor(overlayId, listId) {
    this.visited = new Set();
    this.overlay = document.getElementById(overlayId);
    this.list = document.getElementById(listId);

    // Bind close button inside the overlay to close()
    const closeBtn = this.overlay.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }
  }

  insert(locationName) {
    if (!locationName) return;
    this.visited.add(locationName);
    this.updateList();
  }

  updateList() {
    this.list.innerHTML = "";

    if (this.visited.size === 0) {
      const li = document.createElement("li");
      li.textContent = "No locations visited yet.";
      this.list.appendChild(li);
      return;
    }

    this.visited.forEach((location) => {
      const li = document.createElement("li");
      li.textContent = location;
      this.list.appendChild(li);
    });
  }

  open() {
    this.overlay.classList.remove("hidden");
    this.updateList();
    this.overlay.focus();
  }

  close() {
    this.overlay.classList.add("hidden");
  }

  clear() {
    this.visited.clear();
    this.updateList();
  }
}

export const visitedSetInstance = new VisitedSet(
  "visitedOverlay",
  "visitedList"
);

window.showVisitedLocations = () => {
  visitedSetInstance.open();
};

window.closeVisitedLocations = () => {
  visitedSetInstance.close();
};
