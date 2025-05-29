import { exportDegreePlanAsTechs } from './js/DegreePlan/DegreePlanParser.js';

fetch('./DegreeJSON/6100.json')
  .then(res => res.json())
  .then(degreePlan => {
    const techs = exportDegreePlanAsTechs(degreePlan);
    initTechTree(techs);
  });

function initTechTree(techs) {
  const grid = document.getElementById("tech-grid");
  const svg = document.getElementById("connections");
  const techMap = {};
  const unlocked = new Set();

  // Make SVG fill the container
  const container = document.getElementById("tree-container");
  svg.setAttribute("width", container.offsetWidth);
  svg.setAttribute("height", container.offsetHeight);

  // Add this after creating the SVG element, before creating <g>
  let defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  let marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "10");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");
  marker.setAttribute("markerUnits", "strokeWidth");
  marker.innerHTML = `<polygon points="0 0, 10 3.5, 0 7" fill="cyan"/>`;
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Create a group for zoom/pan
  let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svg.appendChild(g);

  // --- ZOOM & PAN LOGIC ---
  let panX = 0, panY = 0, zoom = 1;
  let isPanning = false, startX = 0, startY = 0, lastPanX = 0, lastPanY = 0;

  svg.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    isPanning = true;
    startX = e.clientX;
    startY = e.clientY;
    lastPanX = panX;
    lastPanY = panY;
    svg.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", e => {
    if (!isPanning) return;
    panX = lastPanX + (e.clientX - startX);
    panY = lastPanY + (e.clientY - startY);
    updateTransform();
  });
  window.addEventListener("mouseup", () => {
    isPanning = false;
    svg.style.cursor = "";
  });
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const scale = e.deltaY < 0 ? 1.1 : 0.9;
    zoom *= scale;
    // Optional: clamp zoom
    zoom = Math.max(0.2, Math.min(zoom, 3));
    updateTransform();
  }, { passive: false });

  function updateTransform() {
    g.setAttribute("transform", `translate(${panX},${panY}) scale(${zoom})`);
    grid.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    drawConnections();
  }

  // --- NODE CREATION ---
  techs.forEach(tech => {
    const el = document.createElement("div");
    el.className = "tech-node locked";
    el.id = `tech-${tech.id}`;
    el.dataset.id = tech.id;

    el.innerHTML = `
      <div class="icon">${tech.icon}</div>
      <div class="title">${tech.title}</div>
      <div class="outputs">${tech.outputs.join(" ")}</div>
      <div class="turns">${tech.turns} Turns</div>
    `;

    el.style.gridColumn = tech.x + 1;
    el.style.gridRow = tech.y + 1;

    el.addEventListener("click", () => {
      if (canUnlock(tech)) {
        unlock(tech.id);
      }
    });

    grid.appendChild(el);
    techMap[tech.id] = { ...tech, el };
  });

  function canUnlock(tech) {
    if (unlocked.has(tech.id)) return false;
    if (!tech.requires) return true;
    return tech.requires.every(id => unlocked.has(id));
  }

  function unlock(id) {
    unlocked.add(id);
    techMap[id].el.classList.remove("locked");
  }

  // Unlock base techs
  techs.forEach(tech => {
    if (!tech.requires) unlock(tech.id);
  });

  // --- DRAW CONNECTIONS ---
  function drawConnections() {
    // Clear previous lines
    while (g.firstChild) g.removeChild(g.firstChild);

    techs.forEach(tech => {
      if (!tech.requires) return;
      tech.requires.forEach(reqId => {
        const from = techMap[reqId].el.getBoundingClientRect();
        const to = techMap[tech.id].el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Adjust for pan/zoom
        const x1 = (from.left + from.width / 2 - containerRect.left - panX) / zoom;
        const y1 = (from.top + from.height / 2 - containerRect.top - panY) / zoom;
        const x2 = (to.left + to.width / 2 - containerRect.left - panX) / zoom;
        const y2 = (to.top + to.height / 2 - containerRect.top - panY) / zoom;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "cyan");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("marker-end", "url(#arrowhead)"); // Add arrowhead marker
        g.appendChild(line);
      });
    });
  }

  // Initial draw
  drawConnections();

  // Redraw on window resize
  window.addEventListener("resize", () => {
    svg.setAttribute("width", container.offsetWidth);
    svg.setAttribute("height", container.offsetHeight);
    drawConnections();
  });
}
