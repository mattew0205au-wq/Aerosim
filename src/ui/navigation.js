import { aircraftModels } from "../data/aircrafts.js";
import { checkScheduleConflict } from "../engine/scheduler.js";
import { AIRPORTS, calculateDistance, calculateFlightMetrics, estimateRouteDemand } from "../engine/flight.js";
import { ApiService } from "../services/apiService.js";

const SAVE_KEY = "AEROSIM_LOCAL_SAVE_V2";
const DEFAULT_STATE = {
  company: { name: "星空亞洲航空", cash: 12480500, rating: "AA-" },
  selectedReg: "B-16701",
  fleet: [
    { reg: "B-16701", modelId: "B737-800", modelName: "Boeing 737-800", seats: 162, bizSeats: 12, ecoSeats: 150, condition: 95, hourlyCost: 2800 },
    { reg: "B-16702", modelId: "A350-900", modelName: "Airbus A350-900", seats: 306, bizSeats: 32, ecoSeats: 274, condition: 88, hourlyCost: 6500 },
    { reg: "B-16703", modelId: "USED-A330-200E", modelName: "Airbus A330-200E", seats: 293, bizSeats: 24, ecoSeats: 269, condition: 58, hourlyCost: 4300 }
  ],
  routes: [
    { id: "R1", origin: "RCTP", dest: "RJAA", dist: 2182, speed: 842, fare: 280, baseFare: 310, ors: 84, netProfit: 142000 },
    { id: "R2", origin: "RCTP", dest: "KLAX", dist: 10925, speed: 903, fare: 950, baseFare: 920, ors: 68, netProfit: 385000 }
  ],
  schedules: {
    "B-16701": [{ routeId: "R1", flightNo: "SAA801", startHour: 8, duration: 3.5, turnaround: .75 }],
    "B-16702": [{ routeId: "R2", flightNo: "SAA008", startHour: 10, duration: 12.5, turnaround: .75 }]
  },
  contracts: [
    { id:"C-1001", type:"地勤服務", partner:"桃園航勤 (TPE Ops)", scope:"RCTP 台北桃園", fee:1200, currency:"AS$", startDate:"2026-01-01", endDate:"2027-12-31", status:"生效中", notes:"每架次過站服務" },
    { id:"C-1002", type:"地勤服務", partner:"JAL Ground Service", scope:"RJAA 東京成田", fee:1850, currency:"AS$", startDate:"2026-01-01", endDate:"2027-06-30", status:"生效中", notes:"每架次過站服務" },
    { id:"C-1003", type:"機上餐飲", partner:"SATS Catering Ltd", scope:"全航線", fee:14, currency:"AS$", startDate:"2026-01-01", endDate:"2028-12-31", status:"生效中", notes:"每位乘客餐飲供應" },
    { id:"C-1004", type:"地勤服務", partner:"Swissport International", scope:"海外站點", fee:1650, currency:"AS$", startDate:"2026-01-01", endDate:"2027-06-30", status:"生效中", notes:"地勤代理及行李處理" }
  ]
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved) return structuredClone(DEFAULT_STATE);
    return {
      ...structuredClone(DEFAULT_STATE), ...saved,
      company: { ...DEFAULT_STATE.company, ...(saved.company || {}) },
      fleet: Array.isArray(saved.fleet) ? saved.fleet.map(aircraft => {
        const model = aircraftModels.find(item => item.id === aircraft.modelId);
        const capacity = Number(aircraft.capacity) || model?.seats || Number(aircraft.seats) || 0;
        return { ...aircraft, capacity, seats: Number(aircraft.seats) || capacity };
      }) : structuredClone(DEFAULT_STATE.fleet),
      routes: Array.isArray(saved.routes) ? saved.routes : structuredClone(DEFAULT_STATE.routes),
      schedules: saved.schedules && typeof saved.schedules === "object" ? saved.schedules : structuredClone(DEFAULT_STATE.schedules),
      contracts: Array.isArray(saved.contracts) ? saved.contracts : structuredClone(DEFAULT_STATE.contracts)
    };
  } catch (error) {
    console.warn("AeroSim save was invalid; using a clean game.", error);
    return structuredClone(DEFAULT_STATE);
  }
}

window.gameState = loadState();
window.saveGame = function() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(window.gameState));
    return true;
  } catch (error) {
    console.error("AeroSim save failed.", error);
    return false;
  }
};

const money = value => "$" + Math.round(Number(value) || 0).toLocaleString("en-US");
const getAircraft = reg => window.gameState.fleet.find(item => item.reg === reg);
const getRoute = id => window.gameState.routes.find(item => item.id === id);
const airportLabel = code => AIRPORTS[code] ? `${code} · ${AIRPORTS[code].name}` : code;
const escapeText = value => String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));

window.toggleDropdown = function(event, element) {
  event.stopPropagation();
  const wasOpen = element.classList.contains("active");
  document.querySelectorAll(".dropdown").forEach(node => {
    node.classList.remove("active");
    const menu = node.querySelector(".dropdown-menu");
    if (menu) menu.style.top = "";
  });
  if (!wasOpen) {
    element.classList.add("active");
    const menu = element.querySelector(".dropdown-menu");
    if (menu && matchMedia("(max-width: 720px)").matches) menu.style.top = Math.ceil(element.getBoundingClientRect().bottom + 4) + "px";
  }
};
document.addEventListener("click", () => document.querySelectorAll(".dropdown").forEach(node => node.classList.remove("active")));

window.switchView = function(viewId) {
  document.querySelectorAll(".dropdown").forEach(node => node.classList.remove("active"));
  document.querySelectorAll(".spa-view").forEach(node => node.classList.add("hidden"));
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (viewId === "schedule") window.renderGanttScheduler();
  if (viewId === "fleet") window.renderFleetList();
  if (viewId === "routes") window.renderRoutesTable();
  if (viewId === "partners") window.renderContracts?.();
  if (viewId === "overview") window.renderDashboard();
  if (viewId === "overview" || viewId === "routes") window.refreshRouteMaps?.();
};

window.openModal = function(id) {
  document.querySelectorAll(".dropdown").forEach(node => node.classList.remove("active"));
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("hidden");
  if (id === "modal-lease") window.renderMarketList();
};
window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("hidden");
};

window.renderDashboard = function() {
  const overview = document.getElementById("view-overview");
  if (!overview) return;
  let panel = document.getElementById("as-ops-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "as-ops-panel";
    panel.className = "mb-3";
    overview.prepend(panel);
  }
  const state = window.gameState;
  const flights = Object.values(state.schedules).reduce((sum, list) => sum + list.length, 0);
  const avgCondition = state.fleet.length ? state.fleet.reduce((sum, item) => sum + item.condition, 0) / state.fleet.length : 0;
  const avgLoad = state.routes.length ? state.routes.reduce((sum, route) => sum + estimateRouteDemand(route.dist, 180, route.fare / Math.max(1, route.baseFare)).loadFactor, 0) / state.routes.length : 0;
  panel.innerHTML = `
    <div class="as-kpi"><span class="as-kpi-label">公司可用資金</span><strong class="as-kpi-value">${money(state.company.cash)}</strong></div>
    <div class="as-kpi"><span class="as-kpi-label">現役飛機</span><strong class="as-kpi-value">${state.fleet.length} 架</strong></div>
    <div class="as-kpi"><span class="as-kpi-label">已排定航班</span><strong class="as-kpi-value">${flights} 班</strong></div>
    <div class="as-kpi"><span class="as-kpi-label">平均機況</span><strong class="as-kpi-value">${avgCondition.toFixed(1)}%</strong></div>
    <div class="as-kpi"><span class="as-kpi-label">預估平均載客率</span><strong class="as-kpi-value">${avgLoad.toFixed(1)}%</strong></div>
`;
  const count = document.getElementById("kpi-fleet-count");
  if (count) count.textContent = `${state.fleet.length} 架`;
  const cash = document.getElementById("header-cash");
  if (cash) cash.textContent = money(state.company.cash) + " AS$";
};

window.renderFleetList = function() {
  const container = document.getElementById("fleet-list-container");
  if (!container) return;
  container.innerHTML = window.gameState.fleet.map(ac => `
    <button type="button" onclick="window.selectAircraft('${escapeText(ac.reg)}')" class="w-full text-left bg-[#141923] border ${ac.reg === window.gameState.selectedReg ? "border-blue-500" : "border-[#2d3748]"} p-2.5 cursor-pointer hover:bg-gray-800 flex justify-between items-center gap-2">
      <span><strong class="text-blue-300">${escapeText(ac.reg)}</strong><small class="block text-gray-500">${escapeText(ac.modelId)}</small></span>
      <span class="${ac.condition < 65 ? "text-amber-400" : "text-emerald-400"} font-bold whitespace-nowrap">${ac.condition}%</span>
    </button>`).join("");
  const count = document.getElementById("kpi-fleet-count");
  if (count) count.textContent = `${window.gameState.fleet.length} 架`;
};

window.selectAircraft = function(reg) {
  const aircraft = getAircraft(reg);
  if (!aircraft) return;
  window.gameState.selectedReg = reg;
  const capacity = Number(aircraft.capacity) || aircraftModels.find(model => model.id === aircraft.modelId)?.seats || aircraft.seats;
  const selected = document.getElementById("selected-reg");
  const info = document.getElementById("selected-model-info");
  const biz = document.getElementById("input-biz-seats");
  const eco = document.getElementById("input-eco-seats");
  if (selected) selected.textContent = aircraft.reg;
  if (info) info.textContent = `${aircraft.modelName} | ${aircraft.seats} 席（機型上限 ${capacity} 席）`;
  if (biz) { biz.max = String(capacity); biz.value = aircraft.bizSeats; }
  if (eco) { eco.max = String(capacity); eco.value = aircraft.ecoSeats; }
  window.updateCabinSVG();
  window.renderFleetList();
  window.saveGame();
};

window.updateCabinSVG = function() {
  const bizInput = document.getElementById("input-biz-seats");
  const ecoInput = document.getElementById("input-eco-seats");
  if (!bizInput || !ecoInput) return;
  const bizSeats = Math.max(0, Number(bizInput.value) || 0);
  const ecoSeats = Math.max(0, Number(ecoInput.value) || 0);
  const aircraft = getAircraft(window.gameState.selectedReg);
  const capacity = Number(aircraft?.capacity) || aircraftModels.find(model => model.id === aircraft?.modelId)?.seats || Number(aircraft?.seats) || 0;
  const total = bizSeats + ecoSeats;
  const bizLabel = document.getElementById("val-biz-seats");
  const ecoLabel = document.getElementById("val-eco-seats");
  if (bizLabel) bizLabel.textContent = bizSeats;
  if (ecoLabel) ecoLabel.textContent = ecoSeats;
  const score = document.getElementById("cabin-ors-score");
  if (score) score.textContent = Math.max(35, Math.min(100, 100 - Math.abs(capacity - total) * .3 - Math.max(0, total - capacity) * .2)).toFixed(1);
  const svg = document.getElementById("cabin-svg");
  if (svg) {
    let html = '<path d="M 10,75 Q 40,15 100,15 L 720,15 Q 750,15 750,75 Q 750,135 720,135 L 100,135 Q 40,135 10,75 Z" fill="#090f1b" stroke="#475569" stroke-width="2"/>';
    const bizRows = Math.min(12, Math.ceil(bizSeats / 4));
    const ecoRows = Math.min(32, Math.ceil(ecoSeats / 6));
    for (let i = 0; i < bizRows; i++) html += `<rect x="${70+i*22}" y="30" width="15" height="18" rx="3" fill="#d97706"/>`;
    const startX = 80 + bizRows * 22;
    for (let i = 0; i < ecoRows; i++) html += `<rect x="${startX+i*15}" y="27" width="10" height="13" rx="2" fill="#2563eb"/>`;
    svg.innerHTML = html;
  }
  const status = document.getElementById("cabin-config-status");
  if (status) {
    status.textContent = total > capacity ? `超出機型上限 ${capacity} 席，請調低座位數` : `預覽：${total} / ${capacity} 席；按「儲存配置」後才會套用`;
    status.className = total > capacity ? "text-xs text-rose-400" : "text-xs text-gray-400";
  }
};

window.saveCabinConfiguration = function() {
  const aircraft = getAircraft(window.gameState.selectedReg);
  const bizSeats = Math.max(0, Math.floor(Number(document.getElementById("input-biz-seats")?.value) || 0));
  const ecoSeats = Math.max(0, Math.floor(Number(document.getElementById("input-eco-seats")?.value) || 0));
  const capacity = Number(aircraft?.capacity) || aircraftModels.find(model => model.id === aircraft?.modelId)?.seats || Number(aircraft?.seats) || 0;
  const total = bizSeats + ecoSeats;
  const fee = 50000;
  if (!aircraft) { alert("請先選擇一架飛機。"); return; }
  if (total < 1 || total > capacity) { alert(`客艙座位數必須介乎 1 至 ${capacity} 席。`); return; }
  if (window.gameState.company.cash < fee) { alert("公司資金不足，未能支付 $50,000 配置費。"); return; }
  window.gameState.company.cash -= fee;
  aircraft.capacity = capacity;
  aircraft.bizSeats = bizSeats;
  aircraft.ecoSeats = ecoSeats;
  aircraft.seats = total;
  const info = document.getElementById("selected-model-info");
  if (info) info.textContent = `${aircraft.modelName} | ${total} 席（機型上限 ${capacity} 席）`;
  window.renderFleetList();
  window.renderDashboard();
  window.saveGame();
  const status = document.getElementById("cabin-config-status");
  if (status) status.textContent = `配置已儲存，支出 ${money(fee)}`;
  alert(`客艙配置已更新，支出 ${money(fee)}。`);
};

window.renderGanttScheduler = function() {
  const container = document.getElementById("gantt-tracks-container");
  if (!container) return;
  container.innerHTML = window.gameState.fleet.map(ac => {
    const schedules = window.gameState.schedules[ac.reg] || [];
    return `
      <section class="space-y-2 bg-[#141923] p-2.5 border border-[#2d3748] rounded-lg">
        <div class="flex justify-between items-center gap-2 text-xs">
          <strong class="text-blue-300">${escapeText(ac.reg)} · ${escapeText(ac.modelName)}</strong>
          <button type="button" onclick="window.openAddFlightModal('${escapeText(ac.reg)}')" class="bg-blue-900 border border-blue-600 text-blue-100 px-2.5 py-1">+ 排入航班</button>
        </div>
        <div class="h-8 bg-[#0b1220] border border-[#2d3748] rounded relative w-full overflow-hidden">
          ${schedules.map((item, index) => {
            const left = Math.max(0, item.startHour / 168 * 100);
            const width = Math.max(.7, item.duration / 168 * 100);
            return `<div title="${escapeText(item.flightNo)}" class="absolute top-0 h-full bg-blue-800 border border-blue-400 rounded-sm flex items-center px-1 overflow-hidden" style="left:${left}%;width:${width}%"><span class="text-[9px] whitespace-nowrap">${escapeText(item.flightNo)}</span><button type="button" aria-label="刪除航班" onclick="window.deleteScheduleSlot('${escapeText(ac.reg)}',${index})" class="ml-auto text-rose-200 px-1">×</button></div>`;
          }).join("")}
        </div>
        <div class="flex justify-between text-[9px] text-gray-500"><span>週一 00:00</span><span>週三</span><span>週五</span><span>週日 24:00 UTC</span></div>
      </section>`;
  }).join("");
};

let targetScheduleReg = "";
window.openAddFlightModal = function(reg) {
  targetScheduleReg = reg;
  const label = document.getElementById("add-flight-reg");
  const select = document.getElementById("add-flight-route-select");
  if (label) label.textContent = reg;
  if (select) select.innerHTML = window.gameState.routes.map(route => `<option value="${route.id}">${route.origin} ✈ ${route.dest}</option>`).join("");
  window.openModal("modal-add-flight");
};

window.confirmScheduleFlight = function() {
  const routeId = document.getElementById("add-flight-route-select")?.value;
  const day = Number(document.getElementById("add-flight-day")?.value);
  const hour = Number(document.getElementById("add-flight-hour")?.value);
  const route = getRoute(routeId), aircraft = getAircraft(targetScheduleReg);
  if (!route || !aircraft || !Number.isInteger(day) || day < 0 || day > 6 || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    alert("請檢查飛機、航線及起飛時間。"); return;
  }
  const metrics = calculateFlightMetrics(route.dist, route.speed, aircraft.condition);
  if (route.dist > (aircraft.range || aircraftModels.find(m => m.id === aircraft.modelId)?.range || 16000)) {
    alert("這架飛機的航程不足以執行此航線。"); return;
  }
  const startHour = day * 24 + hour, turnaround = .75;
  const existing = window.gameState.schedules[targetScheduleReg] || [];
  const check = checkScheduleConflict(existing, startHour, metrics.blockHours, turnaround);
  if (check.hasConflict) { alert("排班失敗：" + check.message); return; }
  const flightNo = "SAA" + String(Math.floor(100 + Math.random() * 899));
  existing.push({ routeId, flightNo, startHour, duration: metrics.blockHours, turnaround });
  window.gameState.schedules[targetScheduleReg] = existing;
  window.closeModal("modal-add-flight");
  window.renderGanttScheduler();
  window.renderDashboard();
  window.saveGame();
};

window.deleteScheduleSlot = function(reg, index) {
  const list = window.gameState.schedules[reg];
  if (!Array.isArray(list) || !list[index]) return;
  list.splice(index, 1);
  window.renderGanttScheduler();
  window.renderDashboard();
  window.saveGame();
};

window.renderMarketList = function() {
  const container = document.getElementById("aircraft-market-list");
  if (!container) return;
  container.innerHTML = aircraftModels.map(model => `
    <article class="bg-[#141923] border border-[#2d3748] p-3 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs">
      <div><strong class="text-gray-100">${escapeText(model.name)}</strong><span class="text-gray-400 block mt-1">航程 ${model.range.toLocaleString()} km · ${model.seats} 席 · 租金 ${money(model.lease)}/週</span></div>
      <button type="button" onclick="window.leaseNewAircraft('${model.id}')" class="bg-blue-900 border border-blue-600 text-blue-100 px-3 py-2 whitespace-nowrap">租賃飛機</button>
    </article>`).join("");
};

window.leaseNewAircraft = function(modelId) {
  const model = aircraftModels.find(item => item.id === modelId);
  if (!model) return;
  if (window.gameState.company.cash < model.lease) { alert("公司資金不足，未能支付首週租金。"); return; }
  const reg = "AS-" + String(Date.now()).slice(-4);
  window.gameState.company.cash -= model.lease;
  window.gameState.fleet.push({ reg, modelId: model.id, modelName: model.name, capacity: model.seats, seats: model.seats, bizSeats: Math.min(12, model.seats), ecoSeats: Math.max(0, model.seats - 12), condition: model.isUsed ? model.condition : 100, hourlyCost: 3200, range: model.range });
  window.gameState.schedules[reg] = [];
  window.closeModal("modal-lease");
  window.renderFleetList();
  window.renderDashboard();
  window.saveGame();
  alert(`已租賃 ${model.name}（${reg}），已扣除首週租金。`);
};

window.openMaintenanceModal = function() {
  const aircraft = getAircraft(window.gameState.selectedReg);
  if (!aircraft) { window.switchView("fleet"); return; }
  const label = document.getElementById("maint-reg");
  if (label) label.textContent = aircraft.reg;
  window.openModal("modal-maintenance");
};

window.performMaintenance = function(addCondition, cost) {
  const aircraft = getAircraft(window.gameState.selectedReg);
  if (!aircraft) return;
  const charge = Number(cost) || 0;
  if (window.gameState.company.cash < charge) { alert("公司資金不足，未能完成維修。"); return; }
  window.gameState.company.cash -= charge;
  aircraft.condition = addCondition >= 100 ? 100 : Math.min(100, aircraft.condition + addCondition);
  window.closeModal("modal-maintenance");
  window.renderFleetList();
  window.renderDashboard();
  window.saveGame();
  alert(`維修完成：${aircraft.reg} 機況 ${aircraft.condition}%。`);
};

window.renderRoutesTable = function() {
  const tbody = document.getElementById("routes-table-body");
  if (!tbody) return;
  tbody.innerHTML = window.gameState.routes.map(route => {
    const demand = estimateRouteDemand(route.dist, 180, route.fare / Math.max(1, route.baseFare));
    return `<tr class="hover:bg-gray-800">
      <td class="border-r border-[#2d3748] font-bold text-gray-100">${route.origin} ✈ ${route.dest}</td>
      <td class="border-r border-[#2d3748] text-gray-300">${route.dist.toLocaleString()} km</td>
      <td class="border-r border-[#2d3748] text-gray-300">${(route.dist / route.speed + .42).toFixed(1)} h</td>
      <td class="border-r border-[#2d3748] text-gray-300">${money(route.fare)} / <span class="text-gray-500">${money(route.baseFare)}</span></td>
      <td class="border-r border-[#2d3748] text-emerald-400 font-bold">${route.ors} / 100</td>
      <td class="text-emerald-400 font-bold">${demand.loadFactor.toFixed(1)}% 預估載客率</td>
    </tr>`;
  }).join("");
};

window.addNewRoute = function() {
  const origin = document.getElementById("select-origin")?.value;
  const dest = document.getElementById("select-dest")?.value;
  if (!origin || !dest || origin === dest) { alert("請選擇不同的出發及目的機場。"); return; }
  if (window.gameState.routes.some(route => route.origin === origin && route.dest === dest)) { alert("這條航線已經存在。"); return; }
  const distance = calculateDistance(origin, dest);
  if (!distance) { alert("未能計算這條航線距離。"); return; }
  const fee = 25000;
  if (window.gameState.company.cash < fee) { alert("公司資金不足，未能開設航線。"); return; }
  window.gameState.company.cash -= fee;
  const route = { id: "R" + (window.gameState.routes.length + 1), origin, dest, dist: distance, speed: 850, fare: Math.round(distance * .13), baseFare: Math.round(distance * .14), ors: 80, netProfit: 0 };
  window.gameState.routes.push(route);
  window.closeModal("modal-route");
  window.renderRoutesTable();
  window.renderDashboard();
  window.saveGame();
  alert(`已開設 ${origin} ✈ ${dest}，距離約 ${distance.toLocaleString()} km。`);
};

function startClock() {
  const update = () => {
    const clock = document.getElementById("real-utc-clock");
    if (clock) clock.textContent = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  };
  update();
  window.setInterval(update, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();
  startClock();
  if (!window.gameState.schedules) window.gameState.schedules = {};
  window.gameState.fleet.forEach(aircraft => { if (!window.gameState.schedules[aircraft.reg]) window.gameState.schedules[aircraft.reg] = []; });
  window.renderFleetList();
  if (getAircraft(window.gameState.selectedReg)) window.selectAircraft(window.gameState.selectedReg);
  else if (window.gameState.fleet[0]) window.selectAircraft(window.gameState.fleet[0].reg);
  window.renderRoutesTable();
  window.renderDashboard();
  window.addEventListener("beforeunload", window.saveGame);
  const navLinks = document.querySelectorAll(".dropdown-menu a");
  navLinks.forEach(link => link.addEventListener("click", () => {
    if (link.getAttribute("href") === "#") setTimeout(() => window.scrollTo(0, 0), 0);
  }));
});
