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
      window.L.polyline([start, end], {
        color, weight: 3, opacity: 0.9, dashArray: "7 6",
        lineCap: "round"
      }).bindPopup(`${route.origin} → ${route.dest}<br>${Number(route.dist || 0).toLocaleString()} km`).addTo(layer);
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
