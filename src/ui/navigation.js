import { aircraftModels } from '../data/aircrafts.js';
import { checkScheduleConflict } from '../engine/scheduler.js';

window.gameState = {
  selectedReg: 'B-16701',
  fleet: [
    { reg: 'B-16701', modelId: 'B737-800', modelName: 'Boeing 737-800', seats: 162, bizSeats: 12, ecoSeats: 150, condition: 95 },
    { reg: 'B-16702', modelId: 'A350-900', modelName: 'Airbus A350-900', seats: 306, bizSeats: 32, ecoSeats: 274, condition: 88 },
    { reg: 'B-16703', modelId: 'USED-A330-200E', modelName: 'Airbus A330-200E', seats: 293, bizSeats: 24, ecoSeats: 269, condition: 58 }
  ],
  routes: [
    { id: 'R1', origin: 'RCTP', dest: 'RJAA', dist: 2182, speed: 842, fare: 280, baseFare: 310, ors: 84, netProfit: 142000 },
    { id: 'R2', origin: 'RCTP', dest: 'KLAX', dist: 10925, speed: 903, fare: 950, baseFare: 920, ors: 68, netProfit: 385000 }
  ],
  schedules: {
    'B-16701': [{ routeId: 'R1', flightNo: 'SAA801', startHour: 8, duration: 3.5, turnaround: 0.75 }],
    'B-16702': [{ routeId: 'R2', flightNo: 'SAA008', startHour: 10, duration: 12.5, turnaround: 0.75 }]
  }
};

window.toggleDropdown = function(event, element) {
  event.stopPropagation();
  const isAlreadyActive = element.classList.contains('active');
  document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('active'));
  if (!isAlreadyActive) {
    element.classList.add('active');
  }
};

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('active'));
});

// View 畫面切換引擎
window.switchView = function(viewId) {
  document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.spa-view').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.remove('hidden');
  }

  if (viewId === 'schedule') window.renderGanttScheduler();
  if (viewId === 'fleet') window.renderFleetList();
  if (viewId === 'routes') window.renderRoutesTable();
};

window.openModal = function(id) {
  document.querySelectorAll('.dropdown').forEach(el => el.classList.remove('active'));
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
  if (id === 'modal-lease') window.renderMarketList();
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
};

window.renderFleetList = function() {
  const container = document.getElementById('fleet-list-container');
  if (!container) return;
  container.innerHTML = window.gameState.fleet.map(ac => `
    <div onclick="window.selectAircraft('${ac.reg}')" class="bg-[#141923] border ${ac.reg === window.gameState.selectedReg ? 'border-blue-600' : 'border-[#2d3748]'} p-2 cursor-pointer hover:bg-gray-800 flex justify-between items-center">
      <div><span class="text-blue-400 font-bold">${ac.reg}</span> <span class="text-gray-500 text-[10px]">${ac.modelId}</span></div>
      <span class="${ac.condition < 65 ? 'text-amber-400' : 'text-emerald-400'} font-bold">機況 ${ac.condition}%</span>
    </div>
  `).join('');
};

window.selectAircraft = function(reg) {
  window.gameState.selectedReg = reg;
  const ac = window.gameState.fleet.find(a => a.reg === reg);
  if (ac) {
    document.getElementById('selected-reg').innerText = ac.reg;
    document.getElementById('input-biz-seats').value = ac.bizSeats;
    document.getElementById('input-eco-seats').value = ac.ecoSeats;
    window.updateCabinSVG();
  }
  window.renderFleetList();
};

window.updateCabinSVG = function() {
  const bizSeats = parseInt(document.getElementById('input-biz-seats').value || 12);
  const ecoSeats = parseInt(document.getElementById('input-eco-seats').value || 150);
  document.getElementById('val-biz-seats').innerText = bizSeats;
  document.getElementById('val-eco-seats').innerText = ecoSeats;

  const svg = document.getElementById('cabin-svg');
  if (!svg) return;
  let html = `<path d="M 10,75 Q 40,15 100,15 L 720,15 Q 750,15 750,75 Q 750,135 720,135 L 100,135 Q 40,135 10,75 Z" fill="#09090b" stroke="#2d3748" stroke-width="2"/>`;
  const bizRows = Math.ceil(bizSeats / 4);
  for (let r = 0; r < bizRows; r++) html += `<rect x="${75 + r*22}" y="28" width="15" height="18" fill="#d97706"/>`;
  const ecoRows = Math.min(26, Math.ceil(ecoSeats / 6));
  const startX = 75 + bizRows * 22 + 10;
  for (let r = 0; r < ecoRows; r++) html += `<rect x="${startX + r*15}" y="25" width="10" height="12" fill="#2563eb"/>`;
  svg.innerHTML = html;
};

window.renderGanttScheduler = function() {
  const container = document.getElementById('gantt-tracks-container');
  if (!container) return;
  container.innerHTML = window.gameState.fleet.map(ac => {
    const acSchedules = window.gameState.schedules[ac.reg] || [];
    return `
      <div class="space-y-1 bg-[#141923] p-2 border border-[#2d3748]">
        <div class="flex justify-between items-center text-[10px]">
          <span class="font-bold text-blue-400">${ac.reg} (${ac.modelName})</span>
          <button onclick="window.openAddFlightModal('${ac.reg}')" class="bg-blue-900 border border-blue-600 text-blue-200 px-2 py-0.5 hover:bg-blue-800">+ 排入航班</button>
        </div>
        <div class="h-7 bg-[#1a202c] border border-[#2d3748] relative w-full overflow-hidden flex items-center">
          ${acSchedules.map((s, idx) => `
            <div class="absolute h-full bg-blue-800 border border-blue-500 flex items-center justify-between px-1 text-[9px] text-gray-100 font-mono" style="left: ${(s.startHour/168)*100}%; width: ${(s.duration/168)*100}%;">
              <span>${s.flightNo}</span>
              <button onclick="window.deleteScheduleSlot('${ac.reg}', ${idx})" class="text-rose-400 font-bold ml-1">[X]</button>
            </div>
            <div class="absolute h-full bg-amber-600" style="left: ${((s.startHour+s.duration)/168)*100}%; width: ${(s.turnaround/168)*100}%;"></div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
};

let targetScheduleReg = '';
window.openAddFlightModal = function(reg) {
  targetScheduleReg = reg;
  document.getElementById('add-flight-reg').innerText = reg;
  document.getElementById('add-flight-route-select').innerHTML = window.gameState.routes.map(r => `<option value="${r.id}">${r.origin} ✈ ${r.dest}</option>`).join('');
  window.openModal('modal-add-flight');
};

window.confirmScheduleFlight = function() {
  const routeId = document.getElementById('add-flight-route-select').value;
  const day = parseInt(document.getElementById('add-flight-day').value);
  const hour = parseInt(document.getElementById('add-flight-hour').value);
  const startHour = day * 24 + hour;
  const route = window.gameState.routes.find(r => r.id === routeId);
  const duration = Math.round((route.dist / route.speed + 0.5) * 10) / 10;
  const turnaround = 0.75;

  const existing = window.gameState.schedules[targetScheduleReg] || [];
  const check = checkScheduleConflict(existing, startHour, duration, turnaround);

  if (check.hasConflict) {
    alert(`⚠️ 排班失敗: ${check.message}`);
    return;
  }

  if (!window.gameState.schedules[targetScheduleReg]) window.gameState.schedules[targetScheduleReg] = [];
  window.gameState.schedules[targetScheduleReg].push({ routeId: route.id, flightNo: `SAA${Math.floor(100+Math.random()*899)}`, startHour, duration, turnaround });
  window.closeModal('modal-add-flight');
  window.renderGanttScheduler();
};

window.deleteScheduleSlot = function(reg, idx) {
  window.gameState.schedules[reg].splice(idx, 1);
  window.renderGanttScheduler();
};

window.renderMarketList = function() {
  const container = document.getElementById('aircraft-market-list');
  if (!container) return;
  container.innerHTML = aircraftModels.map(m => `
    <div class="bg-[#141923] border border-[#2d3748] p-2.5 flex justify-between items-center text-xs font-mono">
      <div>
        <span class="font-bold text-gray-200">${m.name}</span>
        <span class="text-[10px] text-gray-500 block">航程 ${m.range.toLocaleString()} km | 席次 ${m.seats}</span>
      </div>
      <button onclick="window.leaseNewAircraft('${m.id}')" class="bg-blue-900 border border-blue-600 text-blue-200 px-2.5 py-1 text-[10px]">租賃 $${m.lease.toLocaleString()}/週</button>
    </div>
  `).join('');
};

window.leaseNewAircraft = function(modelId) {
  const model = aircraftModels.find(m => m.id === modelId);
  const newReg = `B-167${Math.floor(10 + Math.random() * 90)}`;
  window.gameState.fleet.push({ reg: newReg, modelId: model.id, modelName: model.name, seats: model.seats, bizSeats: 12, ecoSeats: model.seats - 12, condition: model.isUsed ? model.condition : 100 });
  window.gameState.schedules[newReg] = [];
  alert(`🎉 成功引進 ${model.name} (${newReg})！`);
  window.closeModal('modal-lease');
  window.renderFleetList();
};

window.openMaintenanceModal = function() {
  const ac = window.gameState.fleet.find(a => a.reg === window.gameState.selectedReg);
  if (ac) {
    document.getElementById('maint-reg').innerText = ac.reg;
    window.openModal('modal-maintenance');
  }
};

window.performMaintenance = function(addCond, cost) {
  const ac = window.gameState.fleet.find(a => a.reg === window.gameState.selectedReg);
  if (ac) {
    ac.condition = Math.min(100, ac.condition + addCond);
    alert(`🛠️ 保養完成！${ac.reg} 機況提升至 ${ac.condition}%。`);
    window.closeModal('modal-maintenance');
    window.selectAircraft(ac.reg);
  }
};

window.renderRoutesTable = function() {
  const tbody = document.getElementById('routes-table-body');
  if (!tbody) return;
  tbody.innerHTML = window.gameState.routes.map(r => `
    <tr class="hover:bg-gray-800">
      <td class="border-r border-[#2d3748] font-bold text-gray-200">${r.origin} ✈ ${r.dest}</td>
      <td class="border-r border-[#2d3748] text-gray-400">${r.dist.toLocaleString()} km</td>
      <td class="border-r border-[#2d3748] text-gray-300">${(r.dist/r.speed + 0.5).toFixed(1)} h</td>
      <td class="border-r border-[#2d3748] text-gray-300">$${r.fare} / <span class="text-gray-500">$${r.baseFare}</span></td>
      <td class="border-r border-[#2d3748] text-emerald-400 font-bold">${r.ors} / 100</td>
      <td class="text-emerald-400 font-bold">+$${r.netProfit.toLocaleString()} AS$</td>
    </tr>
  `).join('');
};

window.addNewRoute = function() {
  const origin = document.getElementById('select-origin').value;
  const dest = document.getElementById('select-dest').value;
  window.gameState.routes.push({ id: `R${window.gameState.routes.length+1}`, origin, dest, dist: 2182, speed: 850, fare: 320, baseFare: 310, ors: 82, netProfit: 120000 });
  alert(`✅ 成功獲得 ${origin} ✈ ${dest} 航權許可！`);
  window.closeModal('modal-route');
  window.renderRoutesTable();
};

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  setInterval(() => {
    const clock = document.getElementById('real-utc-clock');
    if (clock) clock.innerText = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }, 1000);

  const ctx = document.getElementById('fuelChart');
  if (ctx) {
    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['2010', '2012', '2014', '2016', '2018', '2020', '2022', '2024', '2026'],
        datasets: [{ label: 'Jet-A1 (ASc/l)', data: [30, 85, 45, 65, 40, 30, 75, 48, 52], borderColor: '#38bdf8', borderWidth: 1.5, pointRadius: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  window.renderFleetList();
  window.selectAircraft('B-16701');
});
