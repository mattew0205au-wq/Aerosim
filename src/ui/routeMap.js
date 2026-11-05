import { AIRPORTS } from "../engine/flight.js";

const maps = new Map();
const palette = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#fb7185"];

function createMap(elementId, zoom) {
  const element = document.getElementById(elementId);
  if (!element || !window.L) return null;
  const map = window.L.map(element, { scrollWheelZoom: true, preferCanvas: true }).setView([25, 125], zoom);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  }).addTo(map);
  const layer = window.L.layerGroup().addTo(map);
  maps.set(elementId, { map, layer });
  return { map, layer };
}

function greatCircleSegments(start, end, steps = 64) {
  const toVector = ([lat, lon]) => {
    const phi = lat * Math.PI / 180, lambda = lon * Math.PI / 180;
    return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)];
  };
  const a = toVector(start), b = toVector(end);
  const dot = Math.max(-1, Math.min(1, a[0]*b[0] + a[1]*b[1] + a[2]*b[2]));
  const omega = Math.acos(dot), sinOmega = Math.sin(omega);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wa = sinOmega < 1e-8 ? 1 - t : Math.sin((1 - t) * omega) / sinOmega;
    const wb = sinOmega < 1e-8 ? t : Math.sin(t * omega) / sinOmega;
    const x = wa*a[0] + wb*b[0], y = wa*a[1] + wb*b[1], z = wa*a[2] + wb*b[2];
    points.push([Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI]);
  }
  const segments = [[]];
  points.forEach((point, index) => {
    if (index && Math.abs(point[1] - points[index - 1][1]) > 180) segments.push([]);
    segments[segments.length - 1].push(point);
  });
  return segments.filter(segment => segment.length > 1);
}

function renderRoutes() {
  if (!window.gameState) return;
  for (const { map, layer } of maps.values()) {
    layer.clearLayers();
    const bounds = [];
    const usedAirports = new Set();
    (window.gameState.routes || []).forEach((route, index) => {
      const origin = AIRPORTS[route.origin], destination = AIRPORTS[route.dest];
      if (!origin || !destination) return;
      const color = palette[index % palette.length];
      const start = [origin.lat, origin.lon], end = [destination.lat, destination.lon];
      greatCircleSegments(start, end).forEach(segment => {
        window.L.polyline(segment, {
          color, weight: 3, opacity: 0.9, dashArray: "7 6",
          lineCap: "round"
        }).bindPopup(`${route.origin} → ${route.dest}<br>${Number(route.dist || 0).toLocaleString()} km`).addTo(layer);
      });
      bounds.push(start, end);
      for (const [code, airport, point] of [[route.origin, origin, start], [route.dest, destination, end]]) {
        if (usedAirports.has(code)) continue;
        usedAirports.add(code);
        window.L.circleMarker(point, {
          radius: 6, color: "#e2e8f0", weight: 2, fillColor: color, fillOpacity: 1
        }).bindPopup(`<strong>${code}</strong><br>${airport.name}`).addTo(layer);
      }
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 5 });
    else map.setView([25, 125], 3);
    map.invalidateSize();
  }
}

function initMaps() {
  if (!window.L) {
    document.querySelectorAll(".aerosim-map").forEach(el => {
      el.textContent = "地圖服務未能載入，請檢查網絡連線。";
    });
    return;
  }
  createMap("overview-route-map", 3);
  createMap("route-network-map", 3);
  renderRoutes();
}

window.refreshRouteMaps = () => {
  renderRoutes();
  for (const { map } of maps.values()) map.invalidateSize();
};

document.addEventListener("DOMContentLoaded", initMaps);
