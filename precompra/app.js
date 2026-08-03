const modules=[
 {name:'00 · Inicio',type:'intro'},
 {name:'01 · Datos',type:'fields',title:'Datos Generales',fields:['Nombre y apellido','Email','Dirección','Tipo de inmueble','Precio solicitado','Objetivo de compra']},
 {name:'02 · Documentación',type:'score',title:'Documentación',qs:['Escritura disponible','Plano municipal','Final de obra','ABL / tasas','Expensas si corresponde','Certificado de gas si corresponde'],opts:[['5','Disponible'],['3','En trámite / dudoso'],['1','No disponible / no sé']],proQs:['Deudas municipales','Reglamento de copropiedad (si aplica)','Informe de dominio actualizado']},
 {name:'03 · Estructura',type:'score',title:'Estructura',qs:['Estado general','Fisuras visibles','Grietas importantes','Desniveles en pisos'],proQs:['Humedad en cimientos','Estado de columnas / vigas visibles','Antigüedad aproximada de la construcción']},
 {name:'04 · Humedades',type:'score',title:'Humedades',qs:['Manchas visibles','Pintura descascarada','Moho','Olor a humedad'],proQs:['Humedad ascendente en zócalos','Filtraciones en techos','Estado de desagües pluviales']},
 {name:'05 · Instalaciones',type:'score',title:'Instalaciones',qs:['Tablero eléctrico','Cables expuestos','Pérdidas de agua','Olor a gas','Presión de agua'],proQs:['Antigüedad aproximada de instalación eléctrica','Disyuntor y puesta a tierra','Estado de cañerías visibles','Certificado de gas vigente','Sistema cloacal o pozo séptico','Estado de calefacción / agua caliente']},
 {name:'06 · Terminaciones',type:'score',title:'Terminaciones',qs:['Pisos','Revestimientos','Carpinterías','Pintura'],proQs:['Aberturas — estado de sellado','Estado de mesadas / bacha','Terminación de escalera (si aplica)']},
 {name:'07 · Entorno',type:'score',title:'Entorno',qs:['Accesibilidad','Estado de la cuadra','Ruidos / molestias','Riesgo hídrico aparente'],proQs:['Transporte público cercano','Servicios cercanos (comercios, salud)','Antecedentes de inundación en la zona']},
 {name:'08 · Informe',type:'report',title:'Centro Ejecutivo'}
];
let current=0;
let state=JSON.parse(localStorage.getItem('hs_workspace')||'{}');
const $=q=>document.querySelector(q);
const list=$('#moduleList'), content=$('#content');
const MODULE_ICONS=[
 '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4h3v16H6zM11 4h3v16h-3zM16 4h3v16h-3z" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c3 4 5 7 5 10a5 5 0 01-10 0c0-3 2-6 5-10z" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M13 3L4 13h6l-1 8 10-11h-6l1-7z" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20l4-9 4 5 3-4 5 8H4z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="7" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.6-7-10.6A5 5 0 0112 5a5 5 0 017 5.4C19 16.4 12 21 12 21z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="10" r="2.3" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M4 17h16M6 17V9l6-4 6 4v8" stroke="currentColor" stroke-width="1.5"/></svg>',
];
modules.forEach((m,i)=>{let d=document.createElement('div');d.className='module';d.innerHTML=`<span class="module-ico">${MODULE_ICONS[i]||MODULE_ICONS[0]}</span><span class="module-txt"><strong>${m.name}</strong><small>${i===0?'Bienvenida':'Módulo de evaluación'}</small></span>`;d.onclick=()=>go(i);list.appendChild(d)});
function save(){localStorage.setItem('hs_workspace',JSON.stringify(state))}
function go(i){viewingCompare=false;current=Math.max(0,Math.min(modules.length-1,i));render();save()}
function isPro(){return !!state.pro}
function allQs(m){return m.qs.concat(isPro()&&m.proQs?m.proQs:[])}
let viewingCompare=false;
function loadSaved(){return JSON.parse(localStorage.getItem('hs_saved_properties')||'[]')}
function persistSaved(list){localStorage.setItem('hs_saved_properties',JSON.stringify(list))}
function areaLabels(){return ['Documentación','Estructura','Humedades','Instalaciones','Terminaciones','Entorno']}
function prioridades(){
  const labels=areaLabels();
  let items=[];
  for(let i=2;i<=7;i++){const s=scoreModule(i); if(s!==null) items.push({area:labels[i-2],score:s});}
  items.sort((a,b)=>a.score-b.score);
  return items.map(it=>({...it,nivel:it.score<2.5?'Prioridad alta':it.score<3.5?'Prioridad media':'En orden'}));
}
function guardarPropiedad(){
  if(!isPro())return;
  const g=globalScore();
  if(!g){alert('Completá al menos una parte de la evaluación antes de guardar.');return;}
  const list=loadSaved();
  list.push({id:Date.now(),direccion:state.f2||'Sin dirección',tipo:state.f3||'—',precio:state.f4||'',score:Math.round(g*20),trust:Math.round((completed()/6)*100),savedAt:new Date().toLocaleDateString('es-AR')});
  persistSaved(list);
  state={pro:true}; save();
  updateCompareBtn();
  go(1);
  alert('Propiedad guardada ✓ — arrancá la evaluación de la próxima.');
}
function eliminarGuardada(id){ persistSaved(loadSaved().filter(p=>p.id!==id)); renderCompareView(); updateCompareBtn(); }
function updateCompareBtn(){
  const btn=$('#compareBtn'); if(!btn) return;
  const n=loadSaved().length;
  if(isPro()){ btn.style.display='block'; btn.textContent=`📊 Mis propiedades (${n})`; }
  else btn.style.display='none';
}
function toggleCompare(){ viewingCompare=!viewingCompare; if(viewingCompare) renderCompareView(); else render(); }
function renderCompareView(){
  renderNav();
  const list=loadSaved();
  $('#title').textContent='Mis propiedades evaluadas';
  const bars=list.map(p=>`<div class="cmp-bar-row"><span>${p.direccion}</span><div class="cmp-bar-track"><div class="cmp-bar-fill" style="width:${p.score}%"></div></div><b>${p.score}</b></div>`).join('');
  const rows=list.length?list.map(p=>`<tr><td>${p.direccion}</td><td>${p.tipo}</td><td>${p.precio?('$'+Number(p.precio).toLocaleString('es-AR')):'—'}</td><td><strong>${p.score}</strong></td><td>${p.trust}%</td><td>${p.savedAt}</td><td><button class="outline" style="padding:6px 10px" onclick="eliminarGuardada(${p.id})">Eliminar</button></td></tr>`).join(''):`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Todavía no guardaste ninguna propiedad. Completá una evaluación y guardala desde el informe final.</td></tr>`;
  content.innerHTML=`<h2>Comparación de propiedades</h2><div class="cmp-chart">${bars||'<p style="color:var(--muted)">Sin datos para graficar todavía.</p>'}</div><table class="cmp-table"><thead><tr><th>Dirección</th><th>Tipo</th><th>Precio</th><th>Score</th><th>Trust</th><th>Guardada</th><th></th></tr></thead><tbody>${rows}</tbody></table><button class="start" style="margin-top:20px" onclick="toggleCompare()">← Volver a la evaluación</button>`;
}
function showUnlockCeremony(){
  const n=modules.reduce((a,m)=>a+(m.proQs?m.proQs.length:0),0);
  const ov=document.createElement('div'); ov.className='pro-unlock-overlay';
  ov.innerHTML=`<div class="pro-unlock-card"><h2>PRO desbloqueado ✓</h2><p>${n} preguntas nuevas disponibles en tu evaluación.</p></div>`;
  document.body.appendChild(ov);
  setTimeout(()=>ov.remove(),2200);
}
function scoreModule(i){
 const m=modules[i]; if(!m||m.type!=='score')return null;
 const vals=state['m'+i]||[];
 const filled=vals.filter(v=>v); if(!filled.length)return null; return filled.reduce((a,b)=>a+Number(b),0)/filled.length;
}
function globalScore(){let vals=[];for(let i=2;i<=7;i++){let s=scoreModule(i); if(s)vals.push(s)}return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0}
function completed(){let c=0;for(let i=2;i<=7;i++){if(scoreModule(i))c++}return c}
function renderNav(){[...list.children].forEach((el,i)=>{el.classList.toggle('active',i===current);el.classList.toggle('done',i<current || scoreModule(i))})}
const PHOTO_LABELS=['Fisuras visibles','Grietas importantes','Manchas visibles','Moho','Cables expuestos','Tablero eléctrico'];
function photoKey(mi,idx){ return 'photo_'+mi+'_'+idx; }
function attachPhoto(mi,idx,input){
  const file=input.files&&input.files[0]; if(!file) return;
  const img=new Image(); const reader=new FileReader();
  reader.onload=e=>{
    img.onload=()=>{
      const maxW=700; const scale=Math.min(1,maxW/img.width);
      const canvas=document.createElement('canvas');
      canvas.width=img.width*scale; canvas.height=img.height*scale;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const dataUrl=canvas.toDataURL('image/jpeg',0.7);
      state[photoKey(mi,idx)]=dataUrl;
      try{ save(); }catch(err){ delete state[photoKey(mi,idx)]; alert('No se pudo guardar la foto — es muy pesada para el espacio disponible en el navegador. Probá con otra imagen.'); return; }
      render();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function removePhoto(mi,idx){ delete state[photoKey(mi,idx)]; save(); render(); }
function photoWidget(mi,idx,q){
  if(!PHOTO_LABELS.includes(q)) return '';
  const existing=state[photoKey(mi,idx)];
  if(existing) return `<div class="photo-attach has-photo"><img src="${existing}" alt="Foto adjunta"><button class="photo-remove" onclick="removePhoto(${mi},${idx})">Quitar foto</button></div>`;
  return `<div class="photo-attach"><label class="photo-add">📷 Adjuntar foto de referencia<input type="file" accept="image/*" onchange="attachPhoto(${mi},${idx},this)" hidden></label></div>`;
}
function render(){
 const m=modules[current]; $('#title').textContent=m.title||'Bienvenida'; renderNav(); renderDecision();
 if(m.type==='intro') content.innerHTML=`<div class="intro"><h2>Comprá con información. No solamente con intuición.</h2><p>HOME SCORE® transforma la observación de un inmueble en una orientación preliminar clara, visual y útil para decidir el próximo paso.</p><button class="start" onclick="go(1)">Comenzar evaluación</button></div>`;
 if(m.type==='fields') content.innerHTML=`<h2>${m.title}</h2><div class="fieldGrid">${m.fields.map((f,idx)=>`<label class="field">${f}<input value="${state['f'+idx]||''}" oninput="state['f${idx}']=this.value;save();renderDecision()"></label>`).join('')}</div>`;
 if(m.type==='score'){
   let vals=state['m'+current]||[];
   const opts=m.opts||[['5','Muy bueno'],['4','Bueno'],['3','Regular'],['2','Requiere revisión']];
   const freeHtml=m.qs.map((q,idx)=>`<div class="question"><h3>${q}</h3><div class="options">${opts.map(o=>`<button class="option ${vals[idx]==o[0]?'selected':''}" onclick="setScore(${current},${idx},${o[0]})">${o[1]}</button>`).join('')}</div>${photoWidget(current,idx,q)}</div>`).join('');
   let proHtml='';
   if(m.proQs&&m.proQs.length){
     if(isPro()){
       proHtml=m.proQs.map((q,pIdx)=>{const idx=m.qs.length+pIdx; return `<div class="question"><h3>${q}</h3><div class="options">${opts.map(o=>`<button class="option ${vals[idx]==o[0]?'selected':''}" onclick="setScore(${current},${idx},${o[0]})">${o[1]}</button>`).join('')}</div>${photoWidget(current,idx,q)}</div>`;}).join('');
     } else {
       proHtml=`<div class="pro-lock-block"><div class="pro-lock-head">🔒 HOME SCORE® PRO analiza ${m.proQs.length} puntos más en este rubro</div>${m.proQs.map(q=>`<div class="question locked"><h3>${q}</h3><div class="options"><button class="option" disabled>—</button><button class="option" disabled>—</button><button class="option" disabled>—</button></div></div>`).join('')}<button class="primary" style="width:100%;margin-top:10px" onclick="location.href='pro/index.html'">Desbloquear PRO por US$10 →</button></div>`;
     }
   }
   content.innerHTML=`<h2>${m.title}</h2><div class="questionGrid">${freeHtml}</div>${proHtml}`;
 }
 if(m.type==='report'){
   const g=globalScore();
   const proParams=new URLSearchParams({motivo:'Servicio in situ HOME SCORE PRO',direccion:state.f2||'',tipo_inmueble:state.f3||'',home_score:g?Math.round(g*20):''});
   const proCta=isPro()
     ? `<button class="primary" style="margin-top:14px" onclick="location.href='../contacto.html?${proParams.toString()}'">Solicitar visita profesional in situ de DGA →</button><button class="outline" style="margin-top:10px" onclick="guardarPropiedad()">💾 Guardar y evaluar otra propiedad</button>`
     : '';
   content.innerHTML=`<div class="intro"><h2>Informe HOME SCORE®</h2><p>Resultado preliminar listo para descargar, compartir o utilizar como base para una consulta profesional.</p><button class="start" onclick="window.print()">Descargar PDF</button>${proCta}</div>`;
   sendLead();
 }
}
async function activarPro(){
  const input=$('#proCodeInput');
  if(!input) return;
  const code=input.value.trim().toUpperCase();
  const msg=$('#proCodeMsg');
  try{
    const res=await fetch('/.netlify/functions/verify-code?code='+encodeURIComponent(code));
    if(res.ok){
      const data=await res.json();
      if(data.valid){ state.pro=true; save(); showUnlockCeremony(); render(); updateCompareBtn(); if(msg){msg.textContent='PRO activado ✓'; msg.style.color='var(--green)';} return; }
      if(msg){msg.textContent=data.error||'Código inválido.'; msg.style.color='var(--danger)';}
      return;
    }
  }catch(e){ /* función no desplegada — sin activación posible hasta que esté en vivo */ }
  if(msg){ msg.textContent='Código inválido.'; msg.style.color='var(--danger)'; }
}
function sendLead(){
 if(state.leadSent) return;
 const g=globalScore(); if(!g) return; // no capturar si no completó nada
 state.leadSent=true; save();
 const payload={ nombre:state.f0||'', email:state.f1||'', direccion:state.f2||'', tipo_inmueble:state.f3||'', precio_solicitado:state.f4||'', objetivo_compra:state.f5||'', home_score:Math.round(g*20), trust_index:Math.round((completed()/6)*100)+'%', edicion:isPro()?'PRO':'FREE', _subject:'Nuevo lead — HomeScore Precompra' };
 fetch('https://formspree.io/f/xlgyzool',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)}).catch(function(){});
}
function setScore(mi,idx,val){state['m'+mi]=state['m'+mi]||[];state['m'+mi][idx]=val;render();save()}
function renderDecision(){
 const g=globalScore(); const pct=Math.round((g/5)*100); $('#score').textContent=g?Math.round(g*20):0; $('#topScore').textContent=g?Math.round(g*20):0; $('#scoreBar').style.width=pct+'%';
 $('#scoreLabel').textContent=g>=4.2?'Muy recomendable':g>=3?'Con observaciones':g>0?'Revisión sugerida':'Sin datos';
 $('#trust').textContent=Math.round((completed()/6)*100)+'%';
 const rec=$('#recommendation');
 if(!g)rec.textContent='Completá la evaluación para obtener una orientación preliminar.';
 else{
   let base=g>=4.2?'El inmueble presenta condiciones favorables para continuar el proceso de compra.':g>=3?'Se recomienda avanzar con precauciones y revisar los puntos observados.':'No se recomienda avanzar sin ampliar la evaluación profesional.';
   const top=prioridades().filter(p=>p.nivel!=='En orden')[0];
   if(top) base+=` Prioridad: revisar ${top.area}.`;
   rec.textContent=base;
 }
 const teaser=$('#pro-teaser-block'); if(teaser) teaser.style.display=isPro()?'none':'block';
 const proBadge=$('#pro-active-badge'); if(proBadge) proBadge.style.display=isPro()?'block':'none';
 updateCompareBtn();
 drawRadar();
 updatePDFReport();
}
function drawRadar(){
 const c=$('#radar'),ctx=c.getContext('2d'),cx=130,cy=130,r=82;ctx.clearRect(0,0,260,260);
 const labels=['Doc','Est','Hum','Inst','Term','Ent'];
 // rings
 for(let ring=1;ring<=4;ring++){
   ctx.beginPath();
   for(let i=0;i<6;i++){
     let a=-Math.PI/2+i*Math.PI*2/6,x=cx+Math.cos(a)*r*ring/4,y=cy+Math.sin(a)*r*ring/4;
     if(i==0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
   }
   ctx.closePath();ctx.strokeStyle='#dbe5ec';ctx.lineWidth=1;ctx.stroke();
 }
 // axis + labels
 for(let i=0;i<6;i++){
   let a=-Math.PI/2+i*Math.PI*2/6;
   ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.strokeStyle='#e7eef3';ctx.stroke();
   ctx.fillStyle='#385164';ctx.font='bold 12px Arial';ctx.textAlign='center';
   ctx.fillText(labels[i],cx+Math.cos(a)*110,cy+Math.sin(a)*110+4);
 }
 // data polygon
 let pts=[];
 for(let i=2;i<=7;i++){let s=scoreModule(i)||0,a=-Math.PI/2+(i-2)*Math.PI*2/6;pts.push([cx+Math.cos(a)*r*s/5,cy+Math.sin(a)*r*s/5]);}
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
 ctx.fillStyle='rgba(51,56,62,.18)';ctx.fill();ctx.strokeStyle='#33383E';ctx.lineWidth=3;ctx.stroke();
 pts.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fillStyle='#1B1F24';ctx.fill();});
}

$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);$('#pdf').onclick=()=>{updatePDFReport();window.print();};$('#reset').onclick=()=>{if(confirm('¿Reiniciar evaluación?')){state={};save();go(0)}}
render();


function photoLabel(mi,idx){
  const m=modules[mi]; if(!m||!m.qs) return 'Evidencia';
  const all=m.qs.concat(m.proQs||[]);
  return (m.title||'')+' — '+(all[idx]||'Evidencia');
}
function updatePDFReport(){
  const g=globalScore();
  const pct=Math.round((g/5)*100);
  const completedPct=Math.round((completed()/6)*100);
  const user=(state.f0||'Usuario pendiente');
  const address=(state.f2||'Dirección pendiente');
  const date=new Date().toLocaleDateString('es-AR');
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;}
  set('pdfUser',user);
  set('pdfAddress',address);
  set('pdfDate',date);
  set('pdfScore',g?Math.round(g*20):0);
  set('pdfTrust',completedPct+'%');
  set('pdfScoreLabel',g>=4.2?'Muy recomendable':g>=3?'Con observaciones':g>0?'Revisión sugerida':'Sin datos');
  const labels=['Documentación','Estructura','Humedades','Instalaciones','Terminaciones','Entorno'];
  const area=document.getElementById('pdfAreas');
  if(area){
    area.innerHTML=labels.map((n,idx)=>{
      const s=scoreModule(idx+2), p=s?Math.round(s/5*100):0;
      return `<div class="pdf-area"><strong>${n}</strong><div class="pdf-track"><div class="pdf-fill" style="width:${p}%"></div></div><span>${p}%</span></div>`;
    }).join('');
  }
  const recs=[];
  if(!g){ recs.push('Complete la evaluación para obtener una orientación preliminar.'); }
  else{
    recs.push(g>=4.2?'El inmueble presenta condiciones favorables para continuar el proceso de compra.':g>=3?'Se recomienda avanzar con precauciones y revisar los puntos observados antes de comprometer la operación.':'No se recomienda avanzar sin ampliar la evaluación profesional.');
    const pr=prioridades().filter(p=>p.nivel!=='En orden').slice(0,4);
    if(pr.length) pr.forEach(p=>recs.push(`${p.nivel} — revisar ${p.area} antes de avanzar.`));
    else recs.push('No se detectaron áreas de prioridad alta o media en los rubros evaluados.');
  }
  const ul=document.getElementById('pdfRecommendations');
  if(ul) ul.innerHTML=recs.map(r=>`<li>${r}</li>`).join('');

  const photoKeys=Object.keys(state).filter(k=>k.startsWith('photo_'));
  const gallery=document.getElementById('pdfPhotos');
  if(gallery){
    if(photoKeys.length){
      gallery.innerHTML=`<h2>Evidencia fotográfica de referencia</h2><p style="font-size:12px;color:var(--muted);margin:0 0 10px">Fotos aportadas por el usuario al completar la evaluación — no reemplazan el registro fotográfico técnico de una visita profesional DGA®.</p><div class="pdf-gallery">${photoKeys.map(k=>{
        const [,mi,idx]=k.split('_');
        return `<figure><img src="${state[k]}" alt="Evidencia"><figcaption>${photoLabel(Number(mi),Number(idx))}</figcaption></figure>`;
      }).join('')}</div>`;
    } else {
      gallery.innerHTML='';
    }
  }
}
