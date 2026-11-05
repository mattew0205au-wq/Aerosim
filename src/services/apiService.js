// Local-first data service. The game works without a server or API key.
const LOCAL_DB_KEY = "AEROSIM_LOCAL_SAVE_V2";
const clone = value => JSON.parse(JSON.stringify(value));
const DEFAULT_STORE = {
  company: { name: "星空亞洲航空", callsign: "STARASIA", cash: 12480500, rating: "AA-" },
  fleet: [
    { id: "AC-101", reg: "B-16701", modelId: "B737-800", modelName: "Boeing 737-800", seats: 162, bizSeats: 12, ecoSeats: 150, condition: 95, hourlyCost: 2800 },
    { id: "AC-102", reg: "B-16702", modelId: "A350-900", modelName: "Airbus A350-900", seats: 306, bizSeats: 32, ecoSeats: 274, condition: 88, hourlyCost: 6500 },
    { id: "AC-103", reg: "B-16703", modelId: "USED-A330-200E", modelName: "Airbus A330-200E", seats: 293, bizSeats: 24, ecoSeats: 269, condition: 58, hourlyCost: 4300 }
  ],
  routes: [
    { id: "R1", origin: "RCTP", dest: "RJAA", dist: 2182, speed: 842, fare: 280, baseFare: 310, ors: 84, netProfit: 142000 },
    { id: "R2", origin: "RCTP", dest: "KLAX", dist: 10925, speed: 903, fare: 950, baseFare: 920, ors: 68, netProfit: 385000 }
  ],
  schedules: {
    "B-16701": [{ routeId: "R1", flightNo: "SAA801", startHour: 8, duration: 3.5, turnaround: 0.75 }],
    "B-16702": [{ routeId: "R2", flightNo: "SAA008", startHour: 10, duration: 12.5, turnaround: 0.75 }]
  },
  settings: { language: "zh-Hant", autosave: true }
};

function readStore() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) return clone(DEFAULT_STORE);
    const saved = JSON.parse(raw);
    return {
      ...clone(DEFAULT_STORE), ...saved,
      company: { ...DEFAULT_STORE.company, ...(saved.company || {}) },
      fleet: Array.isArray(saved.fleet) ? saved.fleet : clone(DEFAULT_STORE.fleet),
      routes: Array.isArray(saved.routes) ? saved.routes : clone(DEFAULT_STORE.routes),
      schedules: saved.schedules && typeof saved.schedules === "object" ? saved.schedules : clone(DEFAULT_STORE.schedules)
    };
  } catch (error) {
    console.warn("AeroSim save could not be read; starting with a fresh local game.", error);
    return clone(DEFAULT_STORE);
  }
}
function writeStore(data) {
  try { localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data)); return true; }
  catch (error) { console.error("AeroSim could not save this change.", error); return false; }
}

export const ApiService = {
  async getSnapshot() { return readStore(); },
  async saveSnapshot(snapshot) { return { success: writeStore(snapshot) }; },
  async getCompanyProfile() { return readStore().company; },
  async getFleet() { return readStore().fleet; },
  async getRoutes() { return readStore().routes; },
  async saveFlightSchedule(aircraftReg, newFlight) {
    const store = readStore();
    if (!store.schedules[aircraftReg]) store.schedules[aircraftReg] = [];
    store.schedules[aircraftReg].push(newFlight);
    const success = writeStore(store);
    return { success, updatedSchedules: store.schedules[aircraftReg] };
  },
  async leaseAircraft(model) {
    const store = readStore();
    const newAircraft = { id: `AC-${Date.now()}`, reg: `AS-${String(Date.now()).slice(-4)}`, modelId: model.id, modelName: model.name, seats: model.seats, bizSeats: 12, ecoSeats: model.seats - 12, condition: model.isUsed ? model.condition : 100, hourlyCost: 3200 };
    store.fleet.push(newAircraft);
    store.schedules[newAircraft.reg] = [];
    return { success: writeStore(store), aircraft: newAircraft };
  },
  async performMaintenance(aircraftReg, checkType) {
    const store = readStore(), aircraft = store.fleet.find(item => item.reg === aircraftReg);
    if (!aircraft) return { success: false, message: "找不到這架飛機。" };
    aircraft.condition = checkType === "C" ? 100 : Math.min(100, aircraft.condition + 15);
    return { success: writeStore(store), newCondition: aircraft.condition };
  },
  async clearSave() {
    try { localStorage.removeItem(LOCAL_DB_KEY); return { success: true }; }
    catch (error) { return { success: false }; }
  }
};
