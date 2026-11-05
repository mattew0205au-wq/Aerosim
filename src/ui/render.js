function top(){const w=S.hist.slice(-7).reduce((s,h)=>s+h.rev-h.cost,0);
 $("#top").innerHTML=`<span class="k"><small>公司</small>星空亞洲航空</span><span class="k"><small>日期</small>${dt()}</span><span class="k"><small>現金</small>${M(S.cash)}</span><span class="k"><small>近 7 日利潤</small>${M(w)}</span><span class="k"><small>油價 $/kg</small>${S.fuel.toFixed(2)}</span>`}
function body(){$("#b").innerHTML=V[tab]();top()}
function refresh(){top();const a=document.activeElement;if(!(a&&a.closest&&a.closest("#b")&&/INPUT|SELECT/.test(a.tagName)))body()}
function show(){msg("");$("#nav").innerHTML=Object.entries(TABS).map(([k,v])=>`<button class="${k==tab?"on":""}" onclick="tab='${k}';show()">${v}</button>`).join("");
 $("#f").innerHTML=F[tab]?F[tab]():"";body();if(tab=="rt")pv(1);setSpd(spd)}
