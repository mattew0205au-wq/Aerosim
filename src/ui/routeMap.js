import { AIRPORTS } from "../engine/flight.js";
const maps=new Map(), palette=["#38bdf8","#a78bfa","#34d399","#f59e0b","#fb7185"];
function createMap(id){
  const el=document.getElementById(id); if(!el||!window.L)return;
  const map=L.map(el,{scrollWheelZoom:true,preferCanvas:true,worldCopyJump:true}).setView([25,180],2);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,noWrap:false,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(map);
  const layer=L.layerGroup().addTo(map);maps.set(id,{map,layer});
}
function unwrap(lon,ref){while(lon-ref>180)lon-=360;while(lon-ref< -180)lon+=360;return lon;}
function greatCircle(start,end,steps=96){
  const v=([lat,lon])=>{const p=lat*Math.PI/180,l=lon*Math.PI/180;return [Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)];};
  const a=v(start),b=v(end),dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])),omega=Math.acos(dot),sin=Math.sin(omega),points=[];
  for(let i=0;i<=steps;i++){const t=i/steps,wa=Math.abs(sin)<1e-8?1-t:Math.sin((1-t)*omega)/sin,wb=Math.abs(sin)<1e-8?t:Math.sin(t*omega)/sin,x=wa*a[0]+wb*b[0],y=wa*a[1]+wb*b[1],z=wa*a[2]+wb*b[2],lat=Math.atan2(z,Math.hypot(x,y))*180/Math.PI,lon=unwrap(Math.atan2(y,x)*180/Math.PI,start[1]+(end[1]-start[1])*t);points.push([lat,lon]);}
  return points;
}
function render(){
  if(!window.gameState)return;
  for(const {map,layer} of maps.values()){
    layer.clearLayers();
    const routes=(window.gameState.routes||[]).filter(r=>AIRPORTS[r.origin]&&AIRPORTS[r.dest]);
    if(!routes.length){map.setView([25,180],2);continue;}
    const lons=routes.flatMap(r=>[AIRPORTS[r.origin].lon,AIRPORTS[r.dest].lon]),sx=lons.reduce((s,x)=>s+Math.sin(x*Math.PI/180),0),cx=lons.reduce((s,x)=>s+Math.cos(x*Math.PI/180),0),center=Math.atan2(sx,cx)*180/Math.PI;
    const bounds=[],markers=new Map();
    routes.forEach((r,i)=>{
      const a=AIRPORTS[r.origin],b=AIRPORTS[r.dest],start=[a.lat,unwrap(a.lon,center)],end=[b.lat,unwrap(b.lon,unwrap(a.lon,center))],path=greatCircle(start,end);
      L.polyline(path,{color:palette[i%palette.length],weight:3.5,opacity:.95,lineCap:"round"}).bindPopup(r.origin+" → "+r.dest+"<br>"+Number(r.dist||0).toLocaleString()+" km").addTo(layer);
      bounds.push(...path);markers.set(r.origin,{airport:a,point:start});markers.set(r.dest,{airport:b,point:end});
    });
    for(const [code,item] of markers)L.circleMarker(item.point,{radius:6,color:"#e2e8f0",weight:2,fillColor:"#0ea5e9",fillOpacity:1}).bindPopup("<strong>"+code+"</strong><br>"+item.airport.name).addTo(layer);
    map.fitBounds(bounds,{padding:[30,30],maxZoom:5});
  }
}
function init(){if(!window.L){document.querySelectorAll(".aerosim-map").forEach(e=>e.textContent="地圖載入失敗，請檢查網絡。");return;}createMap("overview-route-map");createMap("route-network-map");window.refreshRouteMaps();}
window.refreshRouteMaps=()=>requestAnimationFrame(()=>{for(const {map} of maps.values())map.invalidateSize();render();});
document.addEventListener("DOMContentLoaded",init);
