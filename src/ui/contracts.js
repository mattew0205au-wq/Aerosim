const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const list=()=>{if(!Array.isArray(window.gameState.contracts))window.gameState.contracts=[];return window.gameState.contracts;};
function render(){
 const rows=list(),today=new Date();today.setHours(0,0,0,0);const limit=new Date(today);limit.setDate(limit.getDate()+90);
 $("contracts-total").textContent=rows.length;$("contracts-active").textContent=rows.filter(x=>x.status==="生效中").length;$("contracts-cancelled").textContent=rows.filter(x=>x.status==="已取消").length;
 $("contracts-expiring").textContent=rows.filter(x=>x.status==="生效中"&&x.endDate&&new Date(x.endDate+"T00:00:00")>=today&&new Date(x.endDate+"T00:00:00")<=limit).length;
 $("contracts-empty").classList.toggle("hidden",rows.length>0);
 $("contracts-table-body").innerHTML=rows.map(x=>{const cls=x.status==="生效中"?"text-emerald-400":x.status==="已取消"?"text-rose-400":"text-amber-300";return `<tr class="hover:bg-gray-800/60"><td>${esc(x.type)}</td><td class="font-bold text-gray-100">${esc(x.partner)}</td><td>${esc(x.scope)}</td><td>${esc(x.currency)} ${Number(x.fee||0).toLocaleString("en-US")}</td><td class="whitespace-nowrap">${esc(x.startDate)}<br><span class="text-gray-500">至 ${esc(x.endDate)}</span></td><td class="${cls}">${esc(x.status)}</td><td><div class="flex flex-wrap gap-1"><button type="button" onclick="window.openContractEditor('${esc(x.id)}')" class="bg-slate-700 text-slate-100 px-2 py-1">編輯</button>${x.status!=="已取消"?`<button type="button" onclick="window.cancelContract('${esc(x.id)}')" class="bg-rose-950 border border-rose-800 text-rose-200 px-2 py-1">取消</button>`:""}</div></td></tr>`;}).join("");
}
window.renderContracts=render;
window.openContractEditor=id=>{
 const x=list().find(r=>r.id===id);$("contract-modal-title").textContent=x?"編輯合同 · "+x.id:"新增合同";
 $("contract-id").value=x?.id||"";$("contract-type").value=x?.type||"地勤服務";$("contract-status").value=x?.status||"生效中";
 $("contract-partner").value=x?.partner||"";$("contract-scope").value=x?.scope||"";$("contract-fee").value=x?.fee??0;$("contract-currency").value=x?.currency||"AS$";
 $("contract-start").value=x?.startDate||new Date().toISOString().slice(0,10);$("contract-end").value=x?.endDate||"";$("contract-notes").value=x?.notes||"";$("contract-form-error").textContent="";
 $("modal-contract").classList.remove("hidden");$("modal-contract").classList.add("flex");
};
window.saveContract=()=>{
 const id=$("contract-id").value,partner=$("contract-partner").value.trim(),scope=$("contract-scope").value.trim(),fee=Number($("contract-fee").value),startDate=$("contract-start").value,endDate=$("contract-end").value,err=$("contract-form-error");
 if(!partner||!scope){err.textContent="請填寫供應商及服務範圍。";return;}if(!Number.isFinite(fee)||fee<0){err.textContent="費用必須是有效的非負數字。";return;}if(!startDate||!endDate||endDate<startDate){err.textContent="請確認合同開始及到期日期。";return;}
 const rows=list(),old=rows.find(r=>r.id===id),record={id:old?.id||"C-"+Date.now().toString().slice(-8),type:$("contract-type").value,status:$("contract-status").value,partner,scope,fee,currency:$("contract-currency").value,startDate,endDate,notes:$("contract-notes").value.trim(),updatedAt:new Date().toISOString()};
 if(old)Object.assign(old,record);else rows.push(record);window.saveGame();window.closeModal("modal-contract");render();
};
window.cancelContract=id=>{
 const x=list().find(r=>r.id===id);if(!x||x.status==="已取消")return;
 if(!confirm("確定取消「"+x.partner+"」的合同？系統會保留取消紀錄。"))return;
 x.status="已取消";x.cancelledAt=new Date().toISOString();window.saveGame();render();
};
document.addEventListener("DOMContentLoaded",()=>{
 if(!Array.isArray(window.gameState.contracts)||!window.gameState.contracts.length)window.gameState.contracts=[
 {id:"C-1001",type:"地勤服務",partner:"桃園航勤 (TPE Ops)",scope:"RCTP 台北桃園",fee:1200,currency:"AS$",startDate:"2026-01-01",endDate:"2027-12-31",status:"生效中",notes:"每架次過站服務"},
 {id:"C-1002",type:"地勤服務",partner:"JAL Ground Service",scope:"RJAA 東京成田",fee:1850,currency:"AS$",startDate:"2026-01-01",endDate:"2027-06-30",status:"生效中",notes:"每架次過站服務"},
 {id:"C-1003",type:"機上餐飲",partner:"SATS Catering Ltd",scope:"全航線",fee:14,currency:"AS$",startDate:"2026-01-01",endDate:"2028-12-31",status:"生效中",notes:"每位乘客餐飲供應"},
 {id:"C-1004",type:"地勤服務",partner:"Swissport International",scope:"海外站點",fee:1650,currency:"AS$",startDate:"2026-01-01",endDate:"2027-06-30",status:"生效中",notes:"地勤代理及行李處理"}
 ];
 window.saveGame();render();
});
