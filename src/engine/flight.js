// AeroSim flight calculation engine (offline simulation; no live ATC feed).
export const AIRPORTS = {
  RCTP: { name: "台北桃園", city: "Taipei", lat: 25.0797, lon: 121.2342 },
  RJAA: { name: "東京成田", city: "Tokyo", lat: 35.7720, lon: 140.3929 },
  RJTT: { name: "東京羽田", city: "Tokyo", lat: 35.5494, lon: 139.7798 },
  VHHH: { name: "香港國際", city: "Hong Kong", lat: 22.3080, lon: 113.9185 },
  RKSI: { name: "首爾仁川", city: "Seoul", lat: 37.4602, lon: 126.4407 },
  WSSS: { name: "新加坡樟宜", city: "Singapore", lat: 1.3644, lon: 103.9915 },
  KUL:  { name: "吉隆坡", city: "Kuala Lumpur", lat: 2.7456, lon: 101.7072 },
  KLAX: { name: "洛杉磯國際", city: "Los Angeles", lat: 33.9416, lon: -118.4085 },
  KSFO: { name: "三藩市國際", city: "San Francisco", lat: 37.6213, lon: -122.3790 },
  EGLL: { name: "倫敦希斯路", city: "London", lat: 51.4700, lon: -0.4543 },
  EDDF: { name: "法蘭克福", city: "Frankfurt", lat: 50.0379, lon: 8.5622 },
  YSSY: { name: "悉尼", city: "Sydney", lat: -33.9399, lon: 151.1753 }
};

const rad = value => value * Math.PI / 180;
export function calculateDistance(origin, destination) {
  const a = AIRPORTS[origin], b = AIRPORTS[destination];
  if (!a || !b || origin === destination) return 0;
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

export function calculateFlightMetrics(distanceKm, cruiseSpeed = 850, aircraftCondition = 100) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const speed = Math.max(450, Number(cruiseSpeed) || 850);
  const condition = Math.max(1, Math.min(100, Number(aircraftCondition) || 100));
  const blockTime = distance / speed + 0.42 + (condition < 70 ? 0.12 : 0);
  return {
    distanceKm: Math.round(distance),
    cruiseSpeed: speed,
    blockHours: Math.round(blockTime * 100) / 100,
    fuelIndex: Math.round((distance * 2.65 + blockTime * 320) * 10) / 10,
    condition
  };
}

export function estimateRouteDemand(distanceKm, seatCount = 180, fareIndex = 1) {
  const distance = Math.max(100, Number(distanceKm) || 100);
  const seats = Math.max(1, Number(seatCount) || 180);
  const price = Math.max(0.5, Number(fareIndex) || 1);
  const distanceFactor = Math.max(0.58, Math.min(1.12, 1.12 - distance / 40000));
  const loadFactor = Math.max(0.35, Math.min(0.96, (0.88 * distanceFactor) / price));
  return { loadFactor: Math.round(loadFactor * 1000) / 10, passengers: Math.round(seats * loadFactor) };
}
