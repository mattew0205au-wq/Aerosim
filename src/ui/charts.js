function chart(){const h=S.hist;if(h.length<2)return'<span class="m">營運數日後顯示現金走勢</span>';
 const lo=Math.min(...h.map(x=>x.cash)),sp=Math.max(...h.map(x=>x.cash))-lo||1;
 return`<svg viewBox="0 0 300 80" style="width:100%;display:block"><polyline fill="none" stroke="var(--ac)" stroke-width="1.5" points="${h.map((x,i)=>`${(i/(h.length-1)*300).toFixed(1)},${(76-(x.cash-lo)/sp*72).toFixed(1)}`).join(" ")}"/></svg>`}
function map(){const px=k=>(AP[k][2]+180)*2,py=k=>(90-AP[k][1])*2,u=new Set(["RCTP"]);S.rt.forEach(r=>{u.add(r.o);u.add(r.d)});
 let s=`<svg viewBox="0 0 720 360" style="width:100%;display:block"><g stroke="var(--ln)" stroke-width=".6">`;
 for(let x=0;x<=720;x+=60)s+=`<path d="M${x} 0V360"/>`;for(let y=0;y<=360;y+=60)s+=`<path d="M0 ${y}H720"/>`;
 s+=`</g><g stroke="var(--ac)" stroke-width="1.4">`+S.rt.map(r=>`<path d="M${px(r.o)} ${py(r.o)}L${px(r.d)} ${py(r.d)}"/>`).join("")+`</g>`;
 for(const k in AP){const a=u.has(k);s+=`<circle cx="${px(k)}" cy="${py(k)}" r="${a?4:2.5}" fill="${a?"var(--ac)":"var(--mut)"}"/>`+(a?`<text x="${px(k)+6}" y="${py(k)+3}" font-size="10" fill="var(--ink)">${k}</text>`:"")}
 return s+"</svg>"}
