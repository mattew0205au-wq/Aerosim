function pv(rs){const o=$("#o").value,d=$("#d").value,a=S.ac.find(x=>x.id==$("#a").value),out=$("#pv");
 if(!a||o==d){out.textContent="請選擇不同的起訖機場，並有一架閒置機體。";return}
 const dist=D(o,d),m=maxF(blk(dist,a.t));
 if(dist>TY[a.t].r){out.innerHTML=`<span class=n>距離 ${N(dist)} km 超過 ${TY[a.t].n} 的航程 ${N(TY[a.t].r)} km，請換機型。</span>`;return}
 if(rs){$("#fr").value=ref(dist);$("#bf").value=ref(dist)*3;$("#fq").value=sug(o,d,a.t)}
 const f=Math.min(m,+$("#fq").value||1),fare=+$("#fr").value||ref(dist),bf=+$("#bf").value||ref(dist)*3,e=est(o,d,a.t,f,fare,S.rep,a.c,bf);
 out.innerHTML=`距離 ${N(dist)} km，單程 ${e.b.toFixed(1)} 小時，參考票價 $${ref(dist)}，每週最多 ${m} 班來回，競爭對手 ${comp(o,d)} 家。<br>預估載客率 ${R(e.lf*100)}%，週收入 ${M(e.rev)}，週成本 ${M(e.cost)}，週利潤 <b class="${e.rev>e.cost?"p":"n"}">${M(e.rev-e.cost)}</b>`}

const opt=(ks,s)=>ks.map(k=>`<option value="${k}" ${k==s?"selected":""}>${k} ${AP[k][0]}</option>`).join("");
const kv=r=>r.map(([a,b])=>`<tr><td>${a}<td>${b}`).join("");
const F={
fl:()=>`<div class="pn"><h3>機型市場（全新機）</h3><div class="tw"><table><tr><th>機型<th>座位<th>航程 km<th>巡航 km/h<th>油耗 kg/h<th>日維護費<th>售價 / 日租<th>`+Object.entries(TY).map(([k,t])=>`<tr><td>${t.n}<td>${t.s}<td>${N(t.r)}<td>${t.v}<td>${N(t.b)}<td>$${t.m}k<td>$${t.p}M / $${R(t.p*.6)}k<td><button class="b" onclick="buy('${k}')">購買</button> <button class="b" onclick="lease('${k}')">租賃</button>`).join("")+`</table></div></div><div class="pn"><h3>二手機市場（每 30 天更新）</h3><div class="tw"><table><tr><th>機型<th>機況<th>座位<th>價格<th>`+S.used.map((u,i)=>`<tr><td>${TY[u.t].n}<td>${u.c}%<td>${TY[u.t].s}<td>${M(TY[u.t].p*1e6*(.4+.3*u.c/100))}<td><button class="b" onclick="buyU(${i})">購買</button>`).join("")+`</table></div></div>`,
rt:()=>{const idle=S.ac.filter(a=>!S.rt.some(r=>r.ac==a.id)),ks=Object.keys(AP);
 return`<div class="pn"><h3>開設新航線</h3><div class="pb"><div class="f">
 <label>出發機場<select id="o" onchange="pv(1)">${opt(ks,"RCTP")}</select></label>
 <label>目的機場<select id="d" onchange="pv(1)">${opt(ks,"RJTT")}</select></label>
 <label>指派機體<select id="a" onchange="pv(1)">${idle.length?idle.map(a=>`<option value="${a.id}">${a.reg} ${TY[a.t].n}</option>`).join(""):'<option value="0">（沒有閒置機體）</option>'}</select></label>
 <label>每週來回班次<input id="fq" type="number" min="1" oninput="pv()"></label>
 <label>經濟艙票價 $<input id="fr" type="number" min="1" oninput="pv()"></label>
 <label>商務艙票價 $<input id="bf" type="number" min="1" oninput="pv()"></label>
 <button class="b" onclick="addRt()">開設航線</button></div>
 <p id="pv" class="m" style="margin:10px 0 0"></p></div></div>`}};
F.fin=()=>`<div class="pn"><h3>貸款與服務</h3><div class="pb f"><label>貸款餘額 ${M(S.loan)}，年利率 8%<span><button class="b" onclick="loan(1e7)">借 $10M</button> <button class="b" onclick="loan(-1e7)">還 $10M</button></span></label><label>服務等級<select onchange="setSvc(this.value)">${["經濟（每名乘客 $0，需求 -20%）","標準（每名乘客 $25）","優質（每名乘客 $60，需求 +20%）"].map((t,i)=>`<option value="${i}" ${i==S.svc?"selected":""}>${t}</option>`).join("")}</select></label></div></div>`;
