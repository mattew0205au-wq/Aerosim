const SERIES = { jet: "DJFUELUSGULF", brent: "DCOILBRENTEU" };
const REFRESH_MS = 60 * 60 * 1000;
let chart = null, latest = { jet: null, brent: null };
const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
function parseCsv(csv) {
  return csv.trim().split(/\r?\n/).slice(1).map(line => {
    const i = line.indexOf(","); if (i < 0) return null;
    const date = line.slice(0,i).replaceAll('"',"").trim(), raw = line.slice(i+1).replaceAll('"',"").trim(), value = Number(raw);
    return date && raw && raw !== "." && Number.isFinite(value) ? {date,value} : null;
  }).filter(Boolean);
}
async function getSeries(id) {
  const response = await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id="+encodeURIComponent(id),{cache:"no-store"});
  if (!response.ok) throw new Error(id+" HTTP "+response.status);
  const rows=parseCsv(await response.text()); if (!rows.length) throw new Error("No data: "+id); return rows;
}
function drawChart(jetRows, brentRows) {
  const canvas=document.getElementById("fuelChart"); if(!canvas||!window.Chart)return;
  const labels=[...new Set([...jetRows.slice(-30),...brentRows.slice(-30)].map(x=>x.date))].sort().slice(-30);
  const jm=new Map(jetRows.map(x=>[x.date,x.value])), bm=new Map(brentRows.map(x=>[x.date,x.value]));
  const data={labels,datasets:[
    {label:"EIA Jet Fuel (USD/gallon)",data:labels.map(d=>jm.get(d)??null),borderColor:"#fbbf24",backgroundColor:"rgba(251,191,36,.1)",yAxisID:"yJet",spanGaps:true,tension:.2,borderWidth:2,pointRadius:1},
    {label:"Brent Crude (USD/barrel)",data:labels.map(d=>bm.get(d)??null),borderColor:"#38bdf8",backgroundColor:"rgba(56,189,248,.08)",yAxisID:"yBrent",spanGaps:true,tension:.2,borderWidth:2,pointRadius:1}
  ]};
  const options={responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{display:true,labels:{color:"#cbd5e1",boxWidth:9,font:{size:9}}}},scales:{
    x:{grid:{display:false},ticks:{color:"#94a3b8",maxTicksLimit:6}},
    yJet:{position:"left",title:{display:true,text:"USD / gallon",color:"#fbbf24",font:{size:9}},ticks:{color:"#fbbf24"},grid:{color:"rgba(148,163,184,.1)"}},
    yBrent:{position:"right",title:{display:true,text:"USD / barrel",color:"#38bdf8",font:{size:9}},ticks:{color:"#38bdf8"},grid:{drawOnChartArea:false}}
  }};
  if(chart){chart.data=data;chart.options=options;chart.update();}else chart=new Chart(canvas.getContext("2d"),{type:"line",data,options});
}
async function refreshFuel() {
  setText("fuel-source-status","查詢 EIA / FRED…");
  try {
    const [jetRows,brentRows]=await Promise.all([getSeries(SERIES.jet),getSeries(SERIES.brent)]);
    latest.jet=jetRows.at(-1); latest.brent=brentRows.at(-1);
    const jet="$"+latest.jet.value.toFixed(3), brent="$"+latest.brent.value.toFixed(2);
    setText("fuel-price-current",jet); setText("fuel-price-date",latest.jet.date);
    setText("finance-fuel-price",jet+" / gallon"); setText("finance-fuel-date","觀測日期："+latest.jet.date+" · EIA / FRED");
    setText("brent-price",brent+" / barrel"); setText("brent-date","("+latest.brent.date+")");
    setText("finance-brent-price",brent+" / barrel"); setText("finance-brent-date","觀測日期："+latest.brent.date+" · FRED");
    setText("fuel-source-status","官方數據已載入"); drawChart(jetRows,brentRows);
  } catch(error) {
    console.error("Fuel data refresh failed:",error); setText("fuel-source-status","暫時無法連線");
    if(!latest.jet)setText("fuel-price-current","暫無報價"); if(!latest.brent)setText("brent-price","暫無資料");
  }
}
document.addEventListener("DOMContentLoaded",()=>{refreshFuel();window.setInterval(refreshFuel,REFRESH_MS);});
