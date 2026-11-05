const FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DJFUELUSGULF";
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
let chart = null;

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function parseFredCsv(csv) {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const comma = line.indexOf(",");
    if (comma < 0) return null;
    const date = line.slice(0, comma).replaceAll('"', "").trim();
    const raw = line.slice(comma + 1).replaceAll('"', "").trim();
    const value = Number(raw);
    if (!date || !raw || raw === "." || !Number.isFinite(value)) return null;
    return { date, value };
  }).filter(Boolean);
}

function renderChart(rows) {
  const canvas = document.getElementById("fuelChart");
  if (!canvas || !window.Chart) return;
  const recent = rows.slice(-30);
  const data = {
    labels: recent.map(row => row.date),
    datasets: [{
      label: "EIA Jet Fuel Spot (USD/gallon)",
      data: recent.map(row => row.value),
      borderColor: "#fbbf24",
      backgroundColor: "rgba(251,191,36,.12)",
      fill: true,
      tension: .25,
      borderWidth: 2,
      pointRadius: 1.5
    }]
  };
  if (chart) {
    chart.data = data;
    chart.update();
    return;
  }
  chart = new window.Chart(canvas.getContext("2d"), {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#94a3b8", maxTicksLimit: 6 } },
        y: { grid: { color: "rgba(148,163,184,.12)" }, ticks: { color: "#94a3b8" } }
      }
    }
  });
}

async function refreshFuelPrice() {
  const status = document.getElementById("fuel-source-status");
  if (status) status.textContent = "更新中…";
  try {
    const response = await fetch(FRED_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = parseFredCsv(await response.text());
    if (!rows.length) throw new Error("No published observations");
    const latest = rows[rows.length - 1];
    const formatted = "$" + latest.value.toFixed(3);
    setText("fuel-price-current", formatted);
    setText("finance-fuel-price", formatted + " / gallon");
    setText("fuel-price-date", latest.date);
    setText("finance-fuel-date", "資料日期：" + latest.date);
    renderChart(rows);
    if (status) status.textContent = "已連接 · 每小時檢查";
  } catch (error) {
    console.warn("Live jet-fuel price update failed:", error);
    if (status) status.textContent = "暫時無法連線";
    const price = document.getElementById("fuel-price-current");
    if (price && price.textContent === "載入中") price.textContent = "暫無報價";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshFuelPrice();
  window.setInterval(refreshFuelPrice, REFRESH_INTERVAL_MS);
});
