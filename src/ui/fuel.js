// In-game fuel cost index only. This is deliberately fictional, not a real-world fuel quote.
let chart = null;
function updateFuelSimulation() {
  const now = new Date();
  const dayCycle = Math.sin((now.getUTCHours() / 24) * Math.PI * 2) * 1.2;
  const weekCycle = Math.sin((now.getUTCDay() / 7) * Math.PI * 2) * 2.5;
  const index = 100 + dayCycle + weekCycle;
  const label = index.toFixed(1);
  const date = now.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  const status = document.getElementById("fuel-source-status");
  if (status) status.textContent = "遊戲模擬";
  const price = document.getElementById("fuel-price-current");
  if (price) price.textContent = label;
  const financePrice = document.getElementById("finance-fuel-price");
  if (financePrice) financePrice.textContent = label + " 指數";
  const dateNode = document.getElementById("fuel-price-date");
  if (dateNode) dateNode.textContent = date;
  const financeDate = document.getElementById("finance-fuel-date");
  if (financeDate) financeDate.textContent = "模擬更新：" + date;
  const canvas = document.getElementById("fuelChart");
  if (!canvas || !window.Chart) return;
  const history = Array.from({ length: 24 }, (_, i) => {
    const hour = (now.getUTCHours() - 23 + i + 24) % 24;
    return { hour: String(hour).padStart(2, "0") + ":00", value: 100 + Math.sin(hour / 24 * Math.PI * 2) * 1.2 + weekCycle };
  });
  const data = { labels: history.map(x => x.hour), datasets: [{ label: "模擬燃油指數", data: history.map(x => x.value), borderColor: "#fbbf24", backgroundColor: "rgba(251,191,36,.12)", fill: true, tension: .25, borderWidth: 2, pointRadius: 1 }] };
  if (chart) { chart.data = data; chart.update(); }
  else chart = new window.Chart(canvas.getContext("2d"), { type: "line", data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", maxTicksLimit: 6 } }, y: { grid: { color: "rgba(148,163,184,.12)" }, ticks: { color: "#94a3b8" } } } } });
}
document.addEventListener("DOMContentLoaded", () => {
  updateFuelSimulation();
  window.setInterval(updateFuelSimulation, 60 * 60 * 1000);
});
