/**
 * AeroSim 數據服務抽象層 (Data Service Layer)
 * 支援「單機 LocalStorage」與「雲端 MMO API」無縫切換
 */

const CONFIG = {
  IS_ONLINE: false, // 💡 未來連線時只需將此改為 true 並填入 API URL
  API_BASE_URL: 'https://api.aerosim.mmo/v1'
};

// 本地單機初始快照 (Mock DB)
const LOCAL_DB_KEY = 'AEROSIM_LOCAL_SAVE_V1';

function getLocalStore() {
  const data = localStorage.getItem(LOCAL_DB_KEY);
  if (!data) {
    const defaultData = {
      company: { name: '星空亞洲航空', callsign: 'STARASIA', cash: 12480500, rating: 'AA-' },
      fleet: [
        { id: 'AC-101', reg: 'B-16701', modelId: 'B737-800', modelName: 'Boeing 737-800', seats: 162, bizSeats: 12, ecoSeats: 150, condition: 95, hourlyCost: 2800 },
        { id: 'AC-102', reg: 'B-16702', modelId: 'A350-900', modelName: 'Airbus A350-900', seats: 306, bizSeats: 32, ecoSeats: 274, condition: 88, hourlyCost: 6500 }
      ],
      routes: [
        { id: 'R-1', origin: 'RCTP', dest: 'RJAA', dist: 2182, speed: 842, fare: 280, baseFare: 310, ors: 84, netProfit: 142000 },
        { id: 'R-2', origin: 'RCTP', dest: 'KLAX', dist: 10925, speed: 903, fare: 950, baseFare: 920, ors: 68, netProfit: 385000 }
      ],
      schedules: {
        'B-16701': [{ id: 'SCH-1', routeId: 'R-1', flightNo: 'SAA801', startHour: 8, duration: 3.5, turnaround: 0.75 }]
      }
    };
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
}

function saveLocalStore(data) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(data));
}

export const ApiService = {
  // 1. 取得公司與財務資產
  async getCompanyProfile() {
    if (CONFIG.IS_ONLINE) {
      const res = await fetch(`${CONFIG.API_BASE_URL}/company`);
      return await res.json();
    }
    return getLocalStore().company;
  },

  // 2. 取得機隊清單
  async getFleet() {
    if (CONFIG.IS_ONLINE) {
      const res = await fetch(`${CONFIG.API_BASE_URL}/fleet`);
      return await res.json();
    }
    return getLocalStore().fleet;
  },

  // 3. 提交新航班排班 (168h 甘特圖)
  async saveFlightSchedule(aircraftReg, newFlight) {
    if (CONFIG.IS_ONLINE) {
      const res = await fetch(`${CONFIG.API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg: aircraftReg, ...newFlight })
      });
      return await res.json();
    }

    // 單機處理
    const store = getLocalStore();
    if (!store.schedules[aircraftReg]) store.schedules[aircraftReg] = [];
    store.schedules[aircraftReg].push(newFlight);
    saveLocalStore(store);
    return { success: true, updatedSchedules: store.schedules[aircraftReg] };
  },

  // 4. 引進/租賃新飛機
  async leaseAircraft(modelId) {
    if (CONFIG.IS_ONLINE) {
      const res = await fetch(`${CONFIG.API_BASE_URL}/market/lease`, {
        method: 'POST',
        body: JSON.stringify({ modelId })
      });
      return await res.json();
    }

    const store = getLocalStore();
    const newReg = `B-167${Math.floor(10 + Math.random() * 90)}`;
    const newAircraft = {
      id: `AC-${Date.now()}`,
      reg: newReg,
      modelId: modelId,
      modelName: modelId,
      seats: 180,
      bizSeats: 12,
      ecoSeats: 168,
      condition: 100,
      hourlyCost: 3200
    };
    store.fleet.push(newAircraft);
    store.schedules[newReg] = [];
    saveLocalStore(store);
    return { success: true, aircraft: newAircraft };
  },

  // 5. 執行 MRO 飛機維護大修
  async performMaintenance(aircraftReg, checkType) {
    if (CONFIG.IS_ONLINE) {
      const res = await fetch(`${CONFIG.API_BASE_URL}/mro/check`, {
        method: 'POST',
        body: JSON.stringify({ reg: aircraftReg, checkType })
      });
      return await res.json();
    }

    const store = getLocalStore();
    const ac = store.fleet.find(a => a.reg === aircraftReg);
    if (ac) {
      ac.condition = checkType === 'C' ? 100 : Math.min(100, ac.condition + 15);
      saveLocalStore(store);
    }
    return { success: true, newCondition: ac.condition };
  }
};
