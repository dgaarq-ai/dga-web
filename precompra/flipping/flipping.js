const $ = q => document.querySelector(q);

const RUBROS = [
  { key:'estructura',      label:'Estructura / mampostería',     unit:'m²' },
  { key:'techos',          label:'Techos / cubiertas',            unit:'m²' },
  { key:'electrica',       label:'Instalación eléctrica',         unit:'m²' },
  { key:'sanitaria',       label:'Instalación sanitaria / gas',   unit:'m²' },
  { key:'revestimientos',  label:'Revestimientos y pisos',        unit:'m²' },
  { key:'pintura',         label:'Pintura general',               unit:'m²' },
  { key:'carpinterias',    label:'Carpinterías',                  unit:'global' },
  { key:'cocina',          label:'Cocina (muebles + equipo)',     unit:'global' },
  { key:'banos',           label:'Baños (terminación completa)',  unit:'global' },
  { key:'exteriores',      label:'Exteriores / fachada',          unit:'global' },
];

const modules = [
  { type:'intro' },
  { type:'datos',     title:'Datos de la operación' },
  { type:'rubros',    title:'Presupuesto de reforma' },
  { type:'portacion', title:'Costos de portación y transacción' },
  { type:'timeline',  title:'Timeline del proyecto' },
  { type:'riesgo',    title:'Riesgo estructural / dominial' },
  { type:'report',    title:'Resultado' },
];

let current = 0;
let state = JSON.parse(localStorage.getItem('hs_flipping') || '{}');
function save(){ localStorage.setItem('hs_flipping', JSON.stringify(state)); }
function isPro(){ return !!state.pro; }
function loadSaved(){ return JSON.parse(localStorage.getItem('hs_flipping_saved') || '[]'); }
function persistSaved(list){ localStorage.setItem('hs_flipping_saved', JSON.stringify(list)); }
let viewingCompare = false;
function guardarOperacion(){
  if (!isPro()) return;
  if (!state.arv) { alert('Completá al menos el ARV antes de guardar.'); return; }
  const list = loadSaved();
  list.push({
    id: Date.now(),
    direccion: state.direccion || 'Sin dirección',
    precio: state.precio_compra || '',
    arv: Math.round(num(state.arv)),
    margen: Math.round(margenBruto()),
    margenPct: Math.round(margenPct()),
    savedAt: new Date().toLocaleDateString('es-AR'),
  });
  persistSaved(list);
  const keepPro = state.pro;
  state = { pro: keepPro }; save();
  updateCompareBtn();
  go(1);
  alert('Operación guardada ✓ — evaluá la próxima propiedad.');
}
function eliminarGuardada(id){ persistSaved(loadSaved().filter(p => p.id !== id)); renderCompareView(); updateCompareBtn(); }
function updateCompareBtn(){
  const btn = document.getElementById('compareBtn'); if (!btn) return;
  const n = loadSaved().length;
  if (isPro()) { btn.style.display = 'block'; btn.textContent = `📊 Mis operaciones (${n})`; }
  else btn.style.display = 'none';
}
function toggleCompare(){ viewingCompare = !viewingCompare; if (viewingCompare) renderCompareView(); else render(); }
function renderCompareView(){
  renderNav();
  const list = loadSaved();
  document.getElementById('title').textContent = 'Mis operaciones evaluadas';
  const bars = list.map(p => `<div class="cmp-bar-row"><span>${p.direccion}</span><div class="cmp-bar-track"><div class="cmp-bar-fill" style="width:${Math.max(0,Math.min(100,p.margenPct))}%"></div></div><b>${p.margenPct}%</b></div>`).join('');
  const rows = list.length ? list.map(p => `<tr><td>${p.direccion}</td><td>${p.precio ? money(Number(p.precio)) : '—'}</td><td>${money(p.arv)}</td><td><strong>${money(p.margen)}</strong></td><td>${p.margenPct}%</td><td>${p.savedAt}</td><td><button class="outline" style="padding:6px 10px" onclick="eliminarGuardada(${p.id})">Eliminar</button></td></tr>`).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Todavía no guardaste ninguna operación. Completá una evaluación y guardala desde el informe final.</td></tr>`;
  content.innerHTML = `<h2>Comparación de operaciones</h2><div class="cmp-chart">${bars || '<p style="color:var(--muted)">Sin datos para graficar todavía.</p>'}</div><table class="cmp-table"><thead><tr><th>Dirección</th><th>Compra</th><th>ARV</th><th>Margen</th><th>% Margen</th><th>Guardada</th><th></th></tr></thead><tbody>${rows}</tbody></table><button class="start" style="margin-top:20px" onclick="toggleCompare()">← Volver a la evaluación</button>`;
}
function showUnlockCeremony(){
  const ov = document.createElement('div'); ov.className = 'pro-unlock-overlay';
  ov.innerHTML = `<div class="pro-unlock-card"><h2>PRO desbloqueado ✓</h2><p>Checklist de riesgo ampliado y guardado de operaciones disponibles.</p></div>`;
  document.body.appendChild(ov);
  setTimeout(() => ov.remove(), 2200);
}
async function activarPro(){
  const input = document.getElementById('proCodeInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  const msg = document.getElementById('proCodeMsg');
  try {
    const res = await fetch('/.netlify/functions/verify-code?code=' + encodeURIComponent(code));
    if (res.ok) {
      const data = await res.json();
      if (data.valid) { state.pro = true; save(); showUnlockCeremony(); render(); updateCompareBtn(); if (msg) { msg.textContent = 'PRO activado ✓'; msg.style.color = 'var(--green)'; } return; }
      if (msg) { msg.textContent = data.error || 'Código inválido.'; msg.style.color = 'var(--danger)'; }
      return;
    }
  } catch (e) { /* función no desplegada — sin activación posible hasta que esté en vivo */ }
  if (msg) { msg.textContent = 'Código inválido.'; msg.style.color = 'var(--danger)'; }
}
function num(v){ v = parseFloat(v); return isNaN(v) ? 0 : v; }
function money(v){ return '$' + Math.round(v).toLocaleString('es-AR'); }

const list = $('#moduleList'), content = $('#content');
const FLIP_ICONS=[
 '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3l3 3-8.4 8.4-3.9.9.9-3.9 8.4-8.4z" stroke="currentColor" stroke-width="1.5"/><path d="M13 8l3 3" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 11h18" stroke="currentColor" stroke-width="1.5"/><circle cx="7.5" cy="15" r="1" fill="currentColor"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M12 7v5l4 2" stroke="currentColor" stroke-width="1.5"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3L2 20h20L12 3z" stroke="currentColor" stroke-width="1.5"/><path d="M12 10v4M12 17h.01" stroke="currentColor" stroke-width="1.6"/></svg>',
 '<svg viewBox="0 0 24 24" fill="none"><path d="M4 19h16M6 15l4-5 3 3 5-7" stroke="currentColor" stroke-width="1.6"/></svg>',
];
modules.forEach((m, i) => {
  const names = ['00 · Inicio','01 · Datos','02 · Reforma','03 · Portación','04 · Timeline','05 · Riesgo','06 · Resultado'];
  let d = document.createElement('div');
  d.className = 'module';
  d.innerHTML = `<span class="module-ico">${FLIP_ICONS[i]||FLIP_ICONS[0]}</span><span class="module-txt"><strong>${names[i]}</strong><small>${i===0?'Bienvenida':m.title}</small></span>`;
  d.onclick = () => go(i);
  list.appendChild(d);
});

function go(i){ viewingCompare = false; current = Math.max(0, Math.min(modules.length-1, i)); render(); save(); }
$('#prev').onclick = () => go(current-1);
$('#next').onclick = () => go(current+1);
$('#reset').onclick = () => { if(confirm('¿Reiniciar el cálculo completo?')){ state={}; save(); go(0); } };
$('#pdf').onclick = () => window.print();

function renderNav(){
  [...list.children].forEach((el,i) => {
    el.classList.toggle('active', i===current);
  });
}

// ---- cálculos ----
function reformaSubtotal(key){
  const qty = num(state['r_qty_'+key]);
  const precio = num(state['r_precio_'+key]);
  return qty * precio;
}
function reformaTotalBase(){
  return RUBROS.reduce((a,r) => a + reformaSubtotal(r.key), 0);
}
function reformaTotal(){
  const imprevistos = num(state.imprevistos_pct ?? 10);
  return reformaTotalBase() * (1 + imprevistos/100);
}
function totalMeses(){
  return num(state.meses_obra ?? 3) + num(state.meses_venta ?? 2);
}
function inversionCompra(){
  const precio = num(state.precio_compra);
  return precio
    + precio * num(state.comision_compra_pct ?? 0) / 100
    + precio * num(state.sellos_pct ?? 3.5) / 100;
}
function costosPortacion(){
  const meses = totalMeses();
  const gastosFijos = num(state.gastos_fijos_mensuales) * meses;
  const interes = num(state.monto_prestamo) * num(state.tasa_prestamo_mensual_pct)/100 * meses;
  return gastosFijos + interes;
}
function costosVenta(){
  return num(state.arv) * num(state.comision_venta_pct ?? 4) / 100;
}
function inversionTotal(){
  return inversionCompra() + reformaTotal() + costosPortacion();
}
function margenBruto(){
  return num(state.arv) - inversionTotal() - costosVenta();
}
function margenPct(){
  const inv = inversionTotal();
  return inv ? (margenBruto() / inv) * 100 : 0;
}
function retornoAnualizado(){
  const meses = totalMeses();
  return meses ? (margenPct() / meses) * 12 : 0;
}
const RIESGOS = [
  { key:'riesgo_estructural', label:'Riesgo estructural', desc:'Fisuras importantes, desniveles, humedad de base, o cualquier indicio que requiera estudio de un profesional antes de avanzar.', tier:'critico' },
  { key:'riesgo_dominial', label:'Riesgo dominial / documental', desc:'Escritura no disponible, plano no coincide con lo construido, sucesión sin resolver, o cualquier traba legal sobre el dominio.', tier:'critico' },
  { key:'riesgo_gravamenes', label:'Gravámenes sobre el vendedor', desc:'Hipoteca vigente, embargo o inhibición general de bienes que pueda trabar la escrituración.', tier:'critico' },
  { key:'riesgo_zonificacion', label:'Zonificación / uso de suelo', desc:'El destino que planeás darle (vivienda, comercial, ampliación) no está confirmado como permitido por el código urbano de la zona.', tier:'menor' },
  { key:'riesgo_servicios', label:'Servicios de infraestructura', desc:'Sin cloacas de red (pozo séptico), sin gas natural, o suministro eléctrico limitado para el uso previsto.', tier:'menor' },
  { key:'riesgo_ambiental', label:'Riesgo ambiental / hídrico', desc:'Zona con antecedentes de inundación, napas altas, o cercanía a una fuente de contaminación.', tier:'menor' },
  { key:'riesgo_consorcio', label:'Riesgo de consorcio (si es PH)', desc:'Expensas atrasadas del edificio, juicios pendientes del consorcio, o deudas que puedan trasladarse al comprador.', tier:'menor' },
];
function hayRiesgoCritico(){ return RIESGOS.some(r=>r.tier==='critico' && state[r.key]); }
function hayRiesgoMenor(){ return RIESGOS.some(r=>r.tier==='menor' && state[r.key]); }
function hayRiesgo(){ return hayRiesgoCritico() || hayRiesgoMenor(); }
function semaforoNivel(){
  if (hayRiesgoCritico()) return 'rojo';
  const p = margenPct();
  if (!state.arv) return 'gris';
  if (p >= 20) return hayRiesgoMenor() ? 'amarillo' : 'verde';
  if (p >= 10) return 'amarillo';
  return 'rojo';
}

function attachFlipPhoto(key,input){
  const file=input.files&&input.files[0]; if(!file) return;
  const img=new Image(); const reader=new FileReader();
  reader.onload=e=>{
    img.onload=()=>{
      const maxW=900; const scale=Math.min(1,maxW/img.width);
      const canvas=document.createElement('canvas');
      canvas.width=img.width*scale; canvas.height=img.height*scale;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      state['foto_'+key]=canvas.toDataURL('image/jpeg',0.7);
      try{ save(); }catch(err){ delete state['foto_'+key]; alert('No se pudo guardar la foto — es muy pesada para el espacio disponible en el navegador.'); return; }
      render();
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function removeFlipPhoto(key){ delete state['foto_'+key]; save(); render(); }
function photoWidgetFlip(key){
  const existing=state['foto_'+key];
  if(existing) return `<div class="photo-attach has-photo"><img src="${existing}" alt="Foto adjunta"><button class="photo-remove" onclick="removeFlipPhoto('${key}')">Quitar foto</button></div>`;
  return `<div class="photo-attach"><label class="photo-add">📷 Adjuntar foto de la fisura/grieta<input type="file" accept="image/*" onchange="attachFlipPhoto('${key}',this)" hidden></label></div>`;
}
function baSlot(key,label,hint,cls){
  const existing=state['foto_'+key];
  if(existing) return `<div class="ba-slot ${cls} has-photo"><img src="${existing}" alt="${label}"><strong>${label}</strong><button class="photo-remove" onclick="removeFlipPhoto('${key}')">Quitar foto</button></div>`;
  return `<label class="ba-slot ${cls}"><input type="file" accept="image/*" onchange="attachFlipPhoto('${key}',this)" hidden><svg class="ba-icon" viewBox="0 0 24 24" fill="none"><path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="1.6"/></svg><strong>${label}</strong><span>${hint}</span></label>`;
}
// ---- render por tipo de módulo ----
function render(){
  const m = modules[current];
  $('#title').textContent = m.title || 'Bienvenida';
  renderNav();
  renderDecision();

  if (m.type === 'intro') {
    content.innerHTML = `
      <div class="intro intro--flip">
        <span class="intro-badge">DGA METHOD® · Flipping</span>
        <h2>Comprá, reformá y vendé con el número resuelto antes de firmar.</h2>
        <p>HOME SCORE® Flipping calcula el margen real de la operación: presupuesto por rubro, costos de portación, timeline y punto de equilibrio.</p>

        <div class="intro-chart">
          <div class="intro-chart-title">Ejemplo — cómo se compone el margen</div>
          <svg viewBox="0 0 560 200" class="margin-chart">
            <line x1="60" y1="20" x2="60" y2="170" stroke="#dce7ee" stroke-width="1"/>
            <line x1="60" y1="170" x2="540" y2="170" stroke="#dce7ee" stroke-width="1"/>
            <rect x="90"  y="60"  width="70" height="110" fill="#1B1F24" rx="4"/>
            <text x="125" y="185" text-anchor="middle" font-size="12" fill="#6E7178">Compra</text>
            <text x="125" y="52" text-anchor="middle" font-size="12" font-weight="700" fill="#1B1F24">70%</text>
            <rect x="200" y="90"  width="70" height="80"  fill="#6E7178" rx="4"/>
            <text x="235" y="185" text-anchor="middle" font-size="12" fill="#6E7178">Reforma</text>
            <text x="235" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="#6E7178">18%</text>
            <rect x="310" y="140" width="70" height="30"  fill="#6E7178" rx="4"/>
            <text x="345" y="185" text-anchor="middle" font-size="12" fill="#6E7178">Portación</text>
            <text x="345" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="#6E7178">4%</text>
            <rect x="420" y="45"  width="70" height="125" fill="#9AA1A8" stroke="#1B1F24" stroke-width="1.5" rx="4"/>
            <text x="455" y="185" text-anchor="middle" font-size="12" fill="#1B1F24" font-weight="700">Margen</text>
            <text x="455" y="37" text-anchor="middle" font-size="13" font-weight="800" fill="#1B1F24">8%</text>
          </svg>
          <p class="intro-chart-note">Valores de ejemplo ilustrativo — tu operación se calcula en los próximos pasos con tus propios números.</p>
        </div>

        <div class="before-after">
          ${baSlot('antes','ANTES','Subí la foto del inmueble tal como se compra','ba-before')}
          ${baSlot('despues','DESPUÉS','Subí la foto una vez terminada la reforma','ba-after')}
        </div>

        <button class="start" onclick="go(1)">Empezar evaluación</button>
      </div>`;
  }

  if (m.type === 'datos') {
    content.innerHTML = `
      <h2>${m.title}</h2>
      <div class="fieldGrid">
        <label class="field">Dirección del inmueble
          <input value="${state.direccion||''}" oninput="state.direccion=this.value;save();renderDecision()">
        </label>
        <label class="field">m² totales
          <input type="number" value="${state.m2||''}" oninput="state.m2=this.value;save();renderDecision()">
        </label>
        <label class="field">Precio de compra
          <input type="number" value="${state.precio_compra||''}" oninput="state.precio_compra=this.value;save();renderDecision()">
        </label>
        <label class="field">$/m² de zona (comparables)
          <input type="number" value="${state.precio_m2_zona||''}" oninput="state.precio_m2_zona=this.value;save();renderDecision()">
        </label>
        <label class="field">ARV — valor estimado de venta post-reforma
          <input type="number" value="${state.arv||''}" oninput="state.arv=this.value;save();renderDecision()">
        </label>
        <div class="field" style="display:flex;align-items:end">
          <button class="outline" style="width:100%" onclick="calcularARVporM2()">Calcular ARV = $/m² zona × m²</button>
        </div>
      </div>
      <span class="hint">El ARV podés ingresarlo directo si ya tenés un comparable de venta, o calcularlo por $/m² de zona.</span>
    `;
  }

  if (m.type === 'rubros') {
    const rows = RUBROS.map(r => `
      <div class="rubro-row">
        <div class="rubro-label">${r.label}</div>
        <input type="number" placeholder="Cant. (${r.unit})" value="${state['r_qty_'+r.key]||''}" oninput="state.r_qty_${r.key}=this.value;save();renderRubroSub('${r.key}');renderDecision()">
        <input type="number" placeholder="$/${r.unit==='global'?'global':'m²'}" value="${state['r_precio_'+r.key]||''}" oninput="state.r_precio_${r.key}=this.value;save();renderRubroSub('${r.key}');renderDecision()">
        <div class="rubro-sub" id="sub_${r.key}">${money(reformaSubtotal(r.key))}</div>
      </div>`).join('');
    content.innerHTML = `
      <h2>${m.title}</h2>
      <span class="hint">Valores orientativos, cargá tus propios precios de la Base de Precios DGA para números reales de mercado.</span>
      <div class="rubro-head"><span>Rubro</span><span>Cantidad</span><span>Precio unitario</span><span>Subtotal</span></div>
      <div class="rubro-table">${rows}</div>
      <div class="imprevistos-row">
        <label>Imprevistos (%)</label>
        <input type="number" value="${state.imprevistos_pct ?? 10}" oninput="state.imprevistos_pct=this.value;save();renderDecision()">
      </div>
      <div class="rubro-total"><span>Total reforma (con imprevistos)</span><strong id="reformaTotalTxt">${money(reformaTotal())}</strong></div>
    `;
  }

  if (m.type === 'portacion') {
    content.innerHTML = `
      <h2>${m.title}</h2>
      <div class="fieldGrid">
        <label class="field">Comisión inmobiliaria — compra (%)
          <input type="number" value="${state.comision_compra_pct ?? 0}" oninput="state.comision_compra_pct=this.value;save();renderDecision()">
        </label>
        <label class="field">Escritura / sellos (%)
          <input type="number" value="${state.sellos_pct ?? 3.5}" oninput="state.sellos_pct=this.value;save();renderDecision()">
        </label>
        <label class="field">Comisión inmobiliaria — venta (%)
          <input type="number" value="${state.comision_venta_pct ?? 4}" oninput="state.comision_venta_pct=this.value;save();renderDecision()">
        </label>
        <label class="field">Monto préstamo puente (si aplica)
          <input type="number" value="${state.monto_prestamo||''}" oninput="state.monto_prestamo=this.value;save();renderDecision()">
        </label>
        <label class="field">Tasa mensual préstamo (%)
          <input type="number" value="${state.tasa_prestamo_mensual_pct||''}" oninput="state.tasa_prestamo_mensual_pct=this.value;save();renderDecision()">
        </label>
        <label class="field">Gastos fijos mensuales (expensas + ABL + seguro)
          <input type="number" value="${state.gastos_fijos_mensuales||''}" oninput="state.gastos_fijos_mensuales=this.value;save();renderDecision()">
        </label>
      </div>
      <span class="hint">Los gastos fijos y el interés del préstamo se multiplican por el total de meses definido en Timeline.</span>
    `;
  }

  if (m.type === 'timeline') {
    content.innerHTML = `
      <h2>${m.title}</h2>
      <div class="fieldGrid">
        <label class="field">Meses estimados de obra
          <input type="number" value="${state.meses_obra ?? 3}" oninput="state.meses_obra=this.value;save();renderDecision()">
        </label>
        <label class="field">Meses estimados de comercialización / venta
          <input type="number" value="${state.meses_venta ?? 2}" oninput="state.meses_venta=this.value;save();renderDecision()">
        </label>
      </div>
      <span class="hint">Exposición total: <strong>${totalMeses()} meses</strong>. Con dirección de obra propia este plazo se controla — es tu ventaja frente a un inversor sin equipo técnico.</span>
    `;
  }

  if (m.type === 'riesgo') {
    const criticos = RIESGOS.filter(r=>r.tier==='critico');
    const menores = RIESGOS.filter(r=>r.tier==='menor');
    const renderCheck = r => `
      <div class="riesgo-check ${state[r.key]?'checked':''}" onclick="toggleRiesgo('${r.key}')">
        <input type="checkbox" ${state[r.key]?'checked':''} onclick="event.stopPropagation()">
        <div><strong>${r.label}</strong><p>${r.desc}</p>${r.key==='riesgo_estructural'&&state[r.key]?`<div onclick="event.stopPropagation()">${photoWidgetFlip('riesgo_estructural')}</div>`:''}</div>
      </div>`;
    const menoresHtml = isPro()
      ? menores.map(renderCheck).join('')
      : `<div class="pro-lock-block"><div class="pro-lock-head">🔒 PRO analiza ${menores.length} categorías más de riesgo (zonificación, servicios, ambiental, consorcio)</div>${menores.map(r=>`<div class="riesgo-check locked"><input type="checkbox" disabled><div><strong>${r.label}</strong><p>${r.desc}</p></div></div>`).join('')}<button class="primary" style="width:100%;margin-top:10px" onclick="location.href='pro/index.html'">Desbloquear PRO por US$10 →</button></div>`;
    content.innerHTML = `
      <h2>${m.title}</h2>
      <span class="hint">Riesgos críticos — cualquiera de estos invalida el margen calculado, sea cual sea el número.</span>
      ${criticos.map(renderCheck).join('')}
      <span class="hint" style="margin-top:18px;display:block">Riesgos a evaluar — no invalidan el margen por sí solos, pero lo condicionan.</span>
      ${menoresHtml}
      ${hayRiesgoCritico() ? '<div class="warn-box">Con un riesgo crítico declarado, el margen calculado no es confiable aunque el número final parezca bueno. Resolvé esto antes de comprometer capital.</div>' : hayRiesgoMenor() ? '<div class="warn-box" style="border-color:var(--warn);color:#8a6a2f">Hay riesgos declarados que condicionan la operación — el semáforo no puede llegar a verde hasta que se resuelvan o se descarten.</div>' : ''}
    `;
  }

  if (m.type === 'report') {
    const saveCta = isPro() ? `<button class="outline" style="margin-top:10px" onclick="guardarOperacion()">💾 Guardar y evaluar otra operación</button>` : '';
    content.innerHTML = `<div class="intro"><h2>Informe de viabilidad</h2><p>Resultado preliminar de la operación, listo para descargar o usar como base de negociación.</p><button class="start" onclick="window.print()">Descargar PDF</button>${saveCta}</div>`;
    updatePDFReport();
    sendLead();
  }
}

function renderRubroSub(key){
  const el = document.getElementById('sub_'+key);
  if (el) el.textContent = money(reformaSubtotal(key));
  const total = document.getElementById('reformaTotalTxt');
  if (total) total.textContent = money(reformaTotal());
}

function calcularARVporM2(){
  const arv = num(state.precio_m2_zona) * num(state.m2);
  if (arv > 0) { state.arv = arv; save(); render(); }
}

function toggleRiesgo(key){
  state[key] = !state[key];
  save();
  render();
}

function renderDecision(){
  const margen = margenBruto();
  const pct = margenPct();
  const nivel = semaforoNivel();

  $('#margenBruto').textContent = money(margen);
  $('#topMargen').textContent = state.arv ? Math.round(pct)+'%' : '—';
  $('#margenPct').textContent = Math.round(pct) + '%';
  $('#retornoAnual').textContent = Math.round(retornoAnualizado()) + '% anual';
  $('#inversionTotal').textContent = money(inversionTotal());

  const barPct = Math.max(0, Math.min(100, pct));
  $('#scoreBar').style.width = barPct + '%';
  $('#margenLabel').textContent = !state.arv ? 'Sin datos' : (margen>=0 ? 'Margen positivo' : 'Margen negativo');

  document.querySelectorAll('.semaforo .luz').forEach(l => l.classList.remove('on'));
  if (nivel !== 'gris') document.querySelector(`.semaforo .luz[data-luz="${nivel}"]`)?.classList.add('on');

  const textos = {
    gris: 'Completá los datos para evaluar.',
    rojo: hayRiesgoCritico() ? 'Riesgo crítico declarado (estructural, dominial o gravámenes) — el número no es confiable hasta resolverlo.' : 'Margen insuficiente para el riesgo de la operación.',
    amarillo: hayRiesgoMenor() ? 'Margen bueno, pero hay riesgos a evaluar (zonificación, servicios, ambiental o consorcio) que impiden llegar a verde.' : 'Margen ajustado — revisá supuestos de reforma, timeline o precio de compra.',
    verde: 'Operación con margen sólido y sin riesgos declarados.',
  };
  $('#semaforoTexto').textContent = textos[nivel];

  const teaser=document.getElementById('pro-teaser-block'); if(teaser) teaser.style.display=isPro()?'none':'block';
  const proBadge=document.getElementById('pro-active-badge'); if(proBadge) proBadge.style.display=isPro()?'block':'none';
  updateCompareBtn();

  const rec = $('#recommendation');
  if (!state.arv) rec.textContent = 'Completá ARV y presupuesto de reforma para obtener una orientación preliminar.';
  else if (nivel === 'rojo') rec.textContent = 'No se recomienda avanzar con estos números. Renegociar precio de compra o descartar.';
  else if (nivel === 'amarillo') rec.textContent = 'Viable con ajustes. Renegociar precio de compra o acotar alcance de reforma para mejorar el margen.';
  else rec.textContent = 'Los números cierran. Avanzar con inspección técnica final antes de comprometer capital.';
}

function updatePDFReport(){
  $('#pdfDireccion').textContent = state.direccion || 'Dirección del inmueble';
  $('#pdfMeta').textContent = `Precio de compra: ${money(num(state.precio_compra))} · m²: ${state.m2||'—'} · Emitido: ${new Date().toLocaleDateString('es-AR')}`;
  $('#pdfArv').textContent = money(num(state.arv));
  $('#pdfInversion').textContent = money(inversionTotal());
  $('#pdfMargen').textContent = money(margenBruto());
  $('#pdfMargenPct').textContent = Math.round(margenPct()) + '% sobre inversión';
  $('#pdfRetorno').textContent = Math.round(retornoAnualizado()) + '% anual aprox.';

  $('#pdfRubros').innerHTML = RUBROS.map(r => {
    const sub = reformaSubtotal(r.key);
    const maxRef = Math.max(...RUBROS.map(x=>reformaSubtotal(x.key)), 1);
    const pct = Math.round((sub/maxRef)*100);
    return `<div class="pdf-area"><span>${r.label}</span><div class="pdf-track"><div class="pdf-fill" style="width:${pct}%"></div></div><b>${money(sub)}</b></div>`;
  }).join('');

  $('#pdfCostos').innerHTML = `
    <div class="pdf-area"><span>Compra (precio + sellos + comisión)</span><div class="pdf-track"><div class="pdf-fill" style="width:100%"></div></div><b>${money(inversionCompra())}</b></div>
    <div class="pdf-area"><span>Portación (fijos + interés)</span><div class="pdf-track"><div class="pdf-fill" style="width:100%"></div></div><b>${money(costosPortacion())}</b></div>
    <div class="pdf-area"><span>Venta (comisión inmobiliaria)</span><div class="pdf-track"><div class="pdf-fill" style="width:100%"></div></div><b>${money(costosVenta())}</b></div>
  `;

  $('#pdfRecomendacion').textContent = $('#recommendation').textContent;

  const gallery=document.getElementById('pdfPhotos');
  if(gallery){
    const shots=[
      state.foto_antes?{img:state.foto_antes,label:'ANTES — al momento de compra'}:null,
      state.foto_despues?{img:state.foto_despues,label:'DESPUÉS — reforma terminada'}:null,
      state.foto_riesgo_estructural?{img:state.foto_riesgo_estructural,label:'Riesgo estructural declarado'}:null,
    ].filter(Boolean);
    gallery.innerHTML=shots.length?`<h2>Evidencia fotográfica de referencia</h2><p style="font-size:12px;color:var(--muted);margin:0 0 10px">Fotos aportadas por el usuario — no reemplazan la validación técnica en sitio de un profesional DGA®.</p><div class="pdf-gallery">${shots.map(s=>`<figure><img src="${s.img}" alt="${s.label}"><figcaption>${s.label}</figcaption></figure>`).join('')}</div>`:'';
  }
}

function solicitarPro(){
  const params = new URLSearchParams({
    ref: 'flipping-pro',
    direccion: state.direccion || '',
    precio_compra: state.precio_compra || '',
    arv: state.arv || '',
    margen_pct: Math.round(margenPct()) + '%',
  });
  window.location.href = '../../contacto.html?' + params.toString();
}

function sendLead(){
  if (state.leadSent) return;
  if (!state.arv) return;
  state.leadSent = true; save();
  const payload = {
    direccion: state.direccion || '',
    precio_compra: state.precio_compra || '',
    arv: state.arv || '',
    reforma_total: Math.round(reformaTotal()),
    inversion_total: Math.round(inversionTotal()),
    margen_bruto: Math.round(margenBruto()),
    margen_pct: Math.round(margenPct()) + '%',
    riesgo_declarado: hayRiesgo() ? 'sí' : 'no',
    _subject: 'Nuevo lead — HomeScore Flipping',
  };
  fetch('https://formspree.io/f/xlgyzool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

render();
