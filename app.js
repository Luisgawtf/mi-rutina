// ===================== Estado y almacenamiento =====================
const KEY = "rutina_v1";
// Checks diarios por defecto (se pueden añadir y quitar en Ajustes)
const HABITOS_BASE = () => [
  { id: "creatina", nombre: "Creatina 3–5 g" },
  { id: "proteina", nombre: "Proteína del día" },
  { id: "postura", nombre: "Rutina postural" },
  { id: "pausas", nombre: "Levantarme cada 30–45 min" },
  { id: "sueno", nombre: "Dormir 7 h o más" },
];
const VACIO = () => ({ ajustes: { plan: "P6", fase: "reentrada", edad: "", peso: "", swaps: {}, ultimaCopia: "", habitos: HABITOS_BASE() }, sesiones: [], mediciones: [], habitos: [], borrador: null });
const COLECCIONES = ["sesiones", "mediciones", "habitos"];
const normalizar = (d) => {
  const v = VACIO(), r = { ...v, ...d, ajustes: { ...v.ajustes, ...(d.ajustes || {}) } };
  if (!Array.isArray(r.ajustes.habitos)) r.ajustes.habitos = HABITOS_BASE();
  for (const c of COLECCIONES) r[c] = (Array.isArray(r[c]) ? r[c] : []).filter(valido[c]);
  return r;
};
let S = VACIO();
let TAB = "hoy";

// Dos modos: "nube" cuando la app está publicada en Claude (datos sincronizados entre
// móvil y PC) y "local" cuando se abre el archivo en el ordenador (navegador).
let MODO = "cargando";
let DB = null;
const guardado = {}; // ruta en la nube -> JSON ya escrito
let tGuardar = null, escribiendo = false, otraVez = false;

function leerLocal() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalizar(JSON.parse(raw)); } catch (e) { console.error(e); }
  return VACIO();
}
function guardar(inmediato) {
  if (MODO === "local") {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { estado("No se pudo guardar en este navegador. Exporta una copia desde Ajustes."); }
    return;
  }
  if (MODO !== "nube") return;
  clearTimeout(tGuardar);
  tGuardar = setTimeout(volcar, inmediato ? 0 : 700);
}
function deseado() {
  const m = { "config/ajustes": S.ajustes, "config/borrador": { b: S.borrador } };
  S.sesiones.forEach((s) => (m["sesiones/" + s.id] = s));
  S.mediciones.forEach((x) => (m["mediciones/" + x.id] = x));
  S.habitos.forEach((x) => (m["habitos/" + x.id] = x)); // un documento por día, id = fecha
  return m;
}
async function volcar() {
  if (escribiendo) { otraVez = true; return; }
  escribiendo = true;
  try {
    const m = deseado();
    for (const [p, obj] of Object.entries(m)) {
      const j = JSON.stringify(obj);
      if (guardado[p] !== j) { await DB.doc(p).set(JSON.parse(j)); guardado[p] = j; }
    }
    for (const p of Object.keys(guardado)) if (!(p in m)) { await DB.doc(p).delete(); delete guardado[p]; }
  } catch (e) {
    console.error(e);
    estado(e && e.code === "quota_exceeded" ? "El almacén está lleno: exporta una copia y borra sesiones antiguas." : "No se pudo guardar en la nube. Se reintentará con el próximo cambio.");
  } finally {
    escribiendo = false;
    if (otraVez) { otraVez = false; volcar(); }
  }
}
const valido = {
  sesiones: (s) => s && typeof s.id === "string" && typeof s.fecha === "string" && Array.isArray(s.items),
  mediciones: (m) => m && typeof m.id === "string" && typeof m.fecha === "string" && typeof m.test === "string",
  habitos: (h) => h && typeof h.id === "string" && h.id === h.fecha && h.hechos && typeof h.hechos === "object",
};
function suscribir(col) {
  DB.collection(col).onSnapshot((snap) => {
    // los cambios locales aún sin subir mandan sobre lo que llega
    const pend = new Map(S[col].filter((x) => guardado[col + "/" + x.id] !== JSON.stringify(x)).map((x) => [x.id, x]));
    for (const p of Object.keys(guardado)) if (p.startsWith(col + "/")) delete guardado[p];
    const lista = snap.docs.map((d) => { const j = JSON.stringify(d.data()); guardado[col + "/" + d.id] = j; return pend.get(d.id) || { ...JSON.parse(j), id: d.id }; });
    for (const [id, x] of pend) if (!snap.docs.some((d) => d.id === id)) lista.push(x);
    // ignora documentos que no tengan la forma de una sesión o medición (no se suben ni se dibujan)
    S[col] = lista.filter(valido[col]);
    if (!(TAB === "hoy" && S.borrador)) render(); // no interrumpir mientras registras una sesión
  }, () => estado("Se cortó la conexión en vivo. Recarga la página para ver los cambios de otros dispositivos."));
}
async function iniciar() {
  render();
  const db = window.claude && window.claude.use ? await window.claude.use("db").catch(() => null) : null;
  if (!db) {
    MODO = "local"; S = leerLocal(); render();
    // en el móvil, pide al navegador que no borre los datos de la app para liberar espacio
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    return;
  }
  DB = db;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const [aj, bo] = await Promise.all([db.doc("config/ajustes").get(), db.doc("config/borrador").get()]);
      // los datos que entrega la nube están congelados: se copian antes de editarlos
      if (aj.exists) { S.ajustes = normalizar({ ajustes: JSON.parse(JSON.stringify(aj.data())) }).ajustes; guardado["config/ajustes"] = JSON.stringify(aj.data()); }
      if (bo.exists) { S.borrador = bo.data().b ? JSON.parse(JSON.stringify(bo.data().b)) : null; guardado["config/borrador"] = JSON.stringify(bo.data()); }
      MODO = "nube";
      COLECCIONES.forEach(suscribir);
      render();
      return;
    } catch (e) { console.error(e); await new Promise((r) => setTimeout(r, 1500)); }
  }
  MODO = "error";
  render();
}

// Mensajes y confirmaciones dentro de la página (el visor de Claude no muestra alert/confirm)
let tEstado = null;
function estado(msg) {
  const el = document.querySelector("#estado"); if (!el) return;
  el.textContent = msg; el.hidden = !msg;
  clearTimeout(tEstado); if (msg) tEstado = setTimeout(() => (el.hidden = true), 6000);
}
let ARMADO = { k: "", t: 0 };
const armado = (k) => ARMADO.k === k && Date.now() - ARMADO.t < 5000;
function seguro(k) {
  if (armado(k)) { ARMADO.k = ""; return true; }
  ARMADO = { k, t: Date.now() }; render(); return false;
}
const conf = (k, txt) => (armado(k) ? "¿Seguro? Pulsa otra vez" : txt);
let IMPORT_PEND = null;

// ===================== Utilidades =====================
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const hoy = () => fmt(new Date());
const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); };
const lunes = (s) => { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return fmt(d); };
const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const EMO = ["", "😫", "😕", "😐", "🙂", "😄"];
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const VOL_CATS = ["fuerza", "calistenia", "prevencion"];
const CARRERA = ["rodaje_suave", "tirada_larga", "intervalos_4x4", "tempo"];

const plan = () => PLANES[S.ajustes.plan] || PLANES.P6;
const fase = () => FASES[S.ajustes.fase] || FASES.construccion;
const nSeries = (it) => Math.max(1, Math.round((it.series || 1) * fase().mult));
const sesionesOrd = () => [...S.sesiones].sort((a, b) => (b.fecha + b.id).localeCompare(a.fecha + a.id));
const ejDe = (sesId, idx, def) => S.ajustes.swaps[sesId + ":" + idx] || def;

// e1RM (Epley) contando el RIR como reps posibles
const e1rm = (kg, reps, rir) => (kg > 0 && reps > 0 ? kg * (1 + (reps + (rir || 0)) / 30) : null);
const setsValidos = (it) => (it.sets || []).filter((s) => num(s.reps) > 0);

// ===================== Lógica de entrenamiento =====================
function ultimo(ejId, excluirId) {
  for (const s of sesionesOrd()) {
    if (s.id === excluirId) continue;
    const it = s.items.find((i) => i.ej === ejId && setsValidos(i).length);
    if (it) return { fecha: s.fecha, sets: setsValidos(it) };
  }
  return null;
}

function sugerencia(ejId, obj, excluirId) {
  const e = EJ[ejId];
  const prev = ultimo(ejId, excluirId);
  if (!obj || !obj.reps) return { txt: "", kg: "" };
  const [mn, mx] = obj.reps;
  const ud = e.med === "seg" ? "s" : "reps";
  if (!prev) return { txt: `Primera vez: busca un peso con el que hagas ${mn} ${ud} dejando RIR ${obj.rir ?? 2}.`, kg: "" };
  const kgs = prev.sets.map((s) => num(s.kg) || 0);
  const kg = Math.max(...kgs);
  const todasArriba = prev.sets.length >= Math.min(obj.series || 1, prev.sets.length) && prev.sets.every((s) => num(s.reps) >= mx);
  const algunaBaja = prev.sets.some((s) => num(s.reps) < mn);
  if (kg === 0) {
    if (todasArriba) return { txt: "Llegaste al máximo del rango: añade lastre o pasa a una variante más difícil.", kg: "" };
    return { txt: `Busca +1 ${ud} en alguna serie.`, kg: "" };
  }
  if (todasArriba) {
    // ~2,5 %: +2,5 kg en cargas de barra (≥40 kg), +1 kg en mancuernas/máquinas ligeras
    const nuevo = kg >= 40 ? Math.round((kg + 2.5) / 2.5) * 2.5 : kg + 1;
    return { txt: `↑ Todas las series al máximo: sube a ${nuevo} kg y vuelve a ${mn} ${ud}.`, kg: nuevo };
  }
  if (algunaBaja) return { txt: `Mantén ${kg} kg. Si vuelves a quedarte por debajo de ${mn}, baja un 5–10 %.`, kg };
  return { txt: `Mantén ${kg} kg y busca +1 ${ud} en alguna serie.`, kg };
}

function crearItem(planIt, ejId, idx, sesId) {
  const e = EJ[ejId];
  const obj = { series: planIt.series ? nSeries(planIt) : null, reps: planIt.reps || null, rir: planIt.rir != null ? planIt.rir + fase().rirExtra : null, desc: planIt.desc || null, presc: planIt.presc || "", nota: planIt.nota || "", notaReentrada: planIt.notaReentrada || "" };
  const it = { ej: ejId, idx, obj, hecho: false };
  if (e.med === "cardio") it.cardio = { min: "", km: "", fc: "" };
  else if (e.med !== "check") {
    const sug = sugerencia(ejId, obj);
    it.sets = Array.from({ length: obj.series || 1 }, () => ({ kg: sug.kg, reps: "", rir: "", ok: false }));
  }
  return it;
}

function nuevoBorrador(sesId) {
  const ses = plan().sesiones.find((s) => s.id === sesId);
  S.borrador = {
    id: uid(), fecha: hoy(), sesionId: ses.id, nombre: ses.nombre, plan: S.ajustes.plan, fase: S.ajustes.fase, inicio: Date.now(),
    items: ses.items.map((pi, idx) => crearItem(pi, ejDe(ses.id, idx, pi.ej), idx, ses.id)),
    animo: null, energia: null, sueno: "", srpe: "", duracion: "", notas: "",
  };
  guardar();
}

function seriesPorMusculo(sesiones) {
  const r = {};
  for (const s of sesiones) for (const it of s.items) {
    const e = EJ[it.ej]; if (!e || !VOL_CATS.includes(e.cat)) continue;
    const n = setsValidos(it).length; if (!n) continue;
    e.pri.forEach((m) => (r[m] = (r[m] || 0) + n));
    e.sec.forEach((m) => (r[m] = (r[m] || 0) + n * 0.5));
  }
  return r;
}
function seriesPlanificadas() {
  const r = {};
  for (const ses of plan().sesiones) ses.items.forEach((pi, idx) => {
    const e = EJ[ejDe(ses.id, idx, pi.ej)]; if (!e || !pi.series || !VOL_CATS.includes(e.cat)) return;
    const n = nSeries(pi);
    e.pri.forEach((m) => (r[m] = (r[m] || 0) + n));
    e.sec.forEach((m) => (r[m] = (r[m] || 0) + n * 0.5));
  });
  return r;
}
function maxKmCarrera(desde, hasta, excluirId) {
  let m = 0;
  for (const s of S.sesiones) {
    if (s.id === excluirId || s.fecha < desde || s.fecha >= hasta) continue;
    for (const it of s.items) if (CARRERA.includes(it.ej) && it.cardio) m = Math.max(m, num(it.cardio.km) || 0);
  }
  return m;
}
const carga = (s) => (num(s.srpe) || 0) * (num(s.duracion) || 0);

// ===================== Checks diarios (creatina, postura, etc.) =====================
let HAB_DIA = null; // día que se está marcando (null = hoy)
const habDia = (f) => S.habitos.find((h) => h.fecha === f);
function marcarHab(f, id, valor) {
  let h = habDia(f);
  if (!h) { h = { id: f, fecha: f, hechos: {} }; S.habitos.push(h); }
  const hechos = { ...h.hechos };
  if (valor) hechos[id] = true; else delete hechos[id];
  h.hechos = hechos;
}
function nombreHab(x) {
  const p = num(S.ajustes.peso);
  return x.id === "proteina" && p ? `Proteína ${Math.round(p * 1.6)}–${Math.round(p * 2.2)} g` : x.nombre;
}
// días seguidos cumplidos hasta hoy (si hoy aún no está marcado, cuenta hasta ayer)
function racha(id) {
  let f = hoy(), n = 0;
  if (!habDia(f)?.hechos[id]) f = addDias(f, -1);
  while (habDia(f)?.hechos[id]) { n++; f = addDias(f, -1); }
  return n;
}
function vChecks() {
  const lista = S.ajustes.habitos; if (!lista.length) return "";
  const f = HAB_DIA || hoy(), h = habDia(f) || { hechos: {} };
  const n = lista.filter((x) => h.hechos[x.id]).length;
  return `<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Checks del día · ${n}/${lista.length}</h3>
      <span class="row"><button class="b sm" data-act="habdia" data-v="${addDias(f, -1)}" title="Día anterior">←</button>
      <span class="mut">${f === hoy() ? "Hoy" : esc(f)}</span>
      ${f < hoy() ? `<button class="b sm" data-act="habdia" data-v="${addDias(f, 1)}" title="Día siguiente">→</button>` : ""}</span></div>
    <div class="checks">${lista.map((x) => { const r = racha(x.id); return `<button class="b chk ${h.hechos[x.id] ? "ok" : ""}" data-act="hab" data-v="${esc(x.id)}">${h.hechos[x.id] ? "☑" : "☐"} ${esc(nombreHab(x))}${r > 1 ? ` <span class="tag">${r} días seguidos</span>` : ""}</button>`; }).join("")}</div></div>`;
}
function vHabProgreso() {
  const lista = S.ajustes.habitos; if (!lista.length) return "";
  const dias = [...Array(14)].map((_, k) => addDias(hoy(), k - 13));
  const pct = (id) => { let c = 0; for (let k = 0; k < 30; k++) if (habDia(addDias(hoy(), -k))?.hechos[id]) c++; return Math.round((c / 30) * 100); };
  return `<h2>Checks diarios</h2><p class="mut">Últimos 14 días (● hecho) y % de los últimos 30.</p>
    <div class="card"><table><tr><th></th>${dias.map((d) => `<th class="mut" style="padding:2px;text-align:center">${d.slice(8)}</th>`).join("")}<th>30 d</th></tr>
    ${lista.map((x) => `<tr><td style="white-space:nowrap">${esc(nombreHab(x))}</td>${dias.map((d) => `<td style="padding:2px;text-align:center;color:${habDia(d)?.hechos[x.id] ? "var(--ok)" : "var(--line)"}">${habDia(d)?.hechos[x.id] ? "●" : "·"}</td>`).join("")}<td>${pct(x.id)} %</td></tr>`).join("")}
    </table></div>`;
}

// ===================== Gráficos (SVG simple) =====================
function linea(puntos, { unidad = "", invertir = false } = {}) {
  if (puntos.length < 2) return `<p class="mut">Hacen falta al menos 2 registros para dibujar la gráfica.</p>`;
  const W = 600, H = 200, P = 34;
  const ys = puntos.map((p) => p.y);
  let mn = Math.min(...ys), mx = Math.max(...ys);
  if (mn === mx) { mn -= 1; mx += 1; }
  const X = (i) => P + (i * (W - 2 * P)) / (puntos.length - 1);
  const Y = (v) => { const t = (v - mn) / (mx - mn); return invertir ? P / 2 + t * (H - P) : H - P / 2 - t * (H - P); };
  const pts = puntos.map((p, i) => `${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
  const r = (v) => (Math.round(v * 10) / 10).toString();
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">
    <line x1="${P}" x2="${W - P}" y1="${Y(mx)}" y2="${Y(mx)}" stroke="currentColor" opacity=".12"/>
    <line x1="${P}" x2="${W - P}" y1="${Y(mn)}" y2="${Y(mn)}" stroke="currentColor" opacity=".12"/>
    <text x="2" y="${Y(mx) + 4}">${r(mx)}</text><text x="2" y="${Y(mn) + 4}">${r(mn)}</text>
    <polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="2"/>
    ${puntos.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3" fill="var(--acc)"><title>${esc(p.x)}: ${r(p.y)} ${unidad}</title></circle>`).join("")}
    <text x="${P}" y="${H - 2}">${esc(puntos[0].x)}</text><text x="${W - P}" y="${H - 2}" text-anchor="end">${esc(puntos[puntos.length - 1].x)}</text>
  </svg>`;
}
function barras(datos, { meta } = {}) {
  const W = 600, H = 170, P = 24, n = datos.length;
  const mx = Math.max(meta || 0, ...datos.map((d) => d.v), 1);
  const bw = (W - 2 * P) / n;
  const Y = (v) => H - P - (v / mx) * (H - 2 * P);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">
    ${meta ? `<line x1="${P}" x2="${W - P}" y1="${Y(meta)}" y2="${Y(meta)}" stroke="var(--ok)" stroke-dasharray="4 4"/>` : ""}
    ${datos.map((d, i) => `<rect x="${P + i * bw + 3}" y="${Y(d.v)}" width="${bw - 6}" height="${H - P - Y(d.v)}" fill="var(--acc)" rx="3"><title>${esc(d.l)}: ${d.v}</title></rect>
      <text x="${P + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.l)}</text>
      <text x="${P + i * bw + bw / 2}" y="${Y(d.v) - 3}" text-anchor="middle">${d.v ? Math.round(d.v * 10) / 10 : ""}</text>`).join("")}
  </svg>`;
}

// ===================== Vistas =====================
const TABS = { hoy: "Hoy", historial: "Historial", progreso: "Progreso", volumen: "Volumen", tests: "Tests", biblio: "Biblio", ajustes: "Ajustes" };

function render() {
  $("#nav").innerHTML = Object.entries(TABS).map(([k, v]) => `<button data-act="tab" data-v="${k}" class="${TAB === k ? "on" : ""}">${v}</button>`).join("");
  if (MODO === "cargando") { $("#main").innerHTML = `<p class="mut">Cargando tus datos…</p>`; return; }
  if (MODO === "error") { $("#main").innerHTML = `<div class="card warn">No se pudo conectar con tus datos en la nube. Recarga la página; si sigue fallando, prueba más tarde.</div>`; return; }
  $("#main").innerHTML = ({ hoy: vHoy, historial: vHistorial, progreso: vProgreso, volumen: vVolumen, tests: vTests, biblio: vBiblio, ajustes: vAjustes })[TAB]();
}

function vHoy() {
  const b = S.borrador;
  let aviso = "";
  if (MODO === "local" && S.sesiones.length >= 3) {
    const uc = S.ajustes.ultimaCopia;
    if (!uc || uc < addDias(hoy(), -7)) aviso = `<div class="card warn">💾 Hace más de una semana que no exportas una copia. Ve a Ajustes → Exportar.</div>`;
  }
  if (!b) {
    const dia = DIAS[new Date().getDay()];
    const sugerida = plan().sesiones.find((s) => s.dia.startsWith(dia));
    const hechasSemana = S.sesiones.filter((s) => s.fecha >= lunes(hoy())).map((s) => s.sesionId);
    return `${aviso}${vChecks()}<h2>¿Qué toca hoy?</h2>
      <p class="mut">${esc(plan().nombre)} · ${esc(fase().nombre)}<br>${esc(fase().nota)}</p>
      ${plan().sesiones.map((s) => `<div class="card row" style="justify-content:space-between">
        <div><b>${esc(s.dia)}</b> · ${esc(s.nombre)} ${hechasSemana.includes(s.id) ? "✅" : ""} ${sugerida && sugerida.id === s.id ? '<span class="tag">hoy</span>' : ""}</div>
        <button class="b ${sugerida && sugerida.id === s.id ? "p" : ""}" data-act="empezar" data-v="${s.id}">Empezar</button></div>`).join("")}`;
  }
  const mins = Math.round((Date.now() - b.inicio) / 60000);
  return `${aviso}<h2>${esc(b.nombre)}</h2>
    <div class="row"><label>Fecha <input type="date" data-f="ses" data-k="fecha" value="${esc(b.fecha)}"></label>
    <span class="mut">${FASES[b.fase]?.nombre || ""} · ${mins} min en marcha</span></div>
    ${b.items.map((it, i) => vItem(it, i, b)).join("")}
    <div class="card"><h3>¿Cómo ha ido?</h3>
      <div class="row emo">Ánimo: ${[1, 2, 3, 4, 5].map((n) => `<button class="b ${b.animo === n ? "on" : ""}" data-act="val" data-k="animo" data-v="${n}">${EMO[n]}</button>`).join("")}</div>
      <div class="row emo">Energía: ${[1, 2, 3, 4, 5].map((n) => `<button class="b ${b.energia === n ? "on" : ""}" data-act="val" data-k="energia" data-v="${n}">${n}</button>`).join("")}</div>
      <div class="row" style="margin-top:6px">
        <label>Sueño anoche (h) <input type="number" step="0.5" data-f="ses" data-k="sueno" value="${esc(b.sueno)}"></label>
        <label title="Esfuerzo percibido de toda la sesión, 1–10">Dureza sesión (1–10) <input type="number" min="1" max="10" data-f="ses" data-k="srpe" value="${esc(b.srpe)}"></label>
        <label>Duración (min) <input type="number" data-f="ses" data-k="duracion" placeholder="${mins}" value="${esc(b.duracion)}"></label>
      </div>
      <textarea data-f="ses" data-k="notas" placeholder="Notas: molestias, sensaciones, técnica…">${esc(b.notas)}</textarea>
      <div class="row" style="margin-top:8px"><button class="b p" data-act="guardar">Guardar sesión</button><button class="b" data-act="descartar">${conf("descartar", "Descartar")}</button></div>
    </div>`;
}

function vItem(it, i, b) {
  const e = EJ[it.ej]; const o = it.obj;
  const pi = plan().sesiones.find((s) => s.id === b.sesionId)?.items[it.idx];
  const opciones = pi ? [...new Set([pi.ej, ...(EJ[pi.ej]?.alt || []), ...(e.alt || [])])].filter((x) => EJ[x]) : [];
  const swap = opciones.length > 1 ? `<select data-f="swap" data-i="${i}" title="Cambiar ejercicio">${opciones.map((x) => `<option value="${x}" ${x === it.ej ? "selected" : ""}>${esc(EJ[x].nombre)}</option>`).join("")}</select>` : "";
  const cab = `<div class="row" style="justify-content:space-between"><b>${e.est ? "🔶 " : ""}${esc(e.nombre)}</b>${swap}</div>`;
  const info = `<details class="mut"><summary>Cómo se hace (imagen y técnica)</summary>${media(e)}<p>${esc(e.tecnica)}</p><p><i>${esc(e.porque)}</i></p></details>`;
  const reent = b.fase === "reentrada" && o.notaReentrada ? `<div class="warn">${esc(o.notaReentrada)}</div>` : "";

  if (e.med === "check") {
    return `<div class="card ${it.hecho ? "hecho" : ""}">${cab}${o.presc || o.nota ? `<div class="mut">${esc(o.presc || o.nota)}</div>` : ""}${info}
      <button class="b ${it.hecho ? "ok" : ""}" data-act="check" data-i="${i}">${it.hecho ? "✓ Hecho" : "Marcar hecho"}</button></div>`;
  }
  if (e.med === "cardio") {
    const c = it.cardio; const km = num(c.km), mn = num(c.min);
    const ritmo = km && mn ? `${Math.floor(mn / km)}:${pad(Math.round((mn / km - Math.floor(mn / km)) * 60))} min/km` : "";
    let w = "";
    if (CARRERA.includes(it.ej) && km) {
      const prev = maxKmCarrera(addDias(b.fecha, -30), b.fecha, b.id);
      if (prev > 0 && km > prev * 1.1) w = `<div class="warn">⚠️ ${km} km supera en más de un 10 % tu salida más larga de los últimos 30 días (${prev} km). Así es como aumenta el riesgo de lesión.</div>`;
    }
    return `<div class="card">${cab}<div class="mut">${esc(o.presc)}</div>${reent}${info}
      <div class="row"><label>Min <input type="number" data-f="cardio" data-i="${i}" data-k="min" value="${esc(c.min)}"></label>
      <label>Km <input type="number" step="0.01" data-f="cardio" data-i="${i}" data-k="km" value="${esc(c.km)}"></label>
      <label>FC media <input type="number" data-f="cardio" data-i="${i}" data-k="fc" value="${esc(c.fc)}"></label>
      <span class="mut">${ritmo}</span></div>${w}</div>`;
  }
  const ud = e.med === "seg" ? "seg" : "reps";
  const sug = sugerencia(it.ej, o, b.id);
  const prev = ultimo(it.ej, b.id);
  const prevTxt = prev ? `Última (${prev.fecha}): ${prev.sets.map((s) => (num(s.kg) ? s.kg + "×" : "") + s.reps + (s.rir !== "" && s.rir != null ? "@" + s.rir : "")).join(", ")}` : "";
  return `<div class="card">${cab}
    <div class="mut">${o.series}×${o.reps[0]}${o.reps[1] !== o.reps[0] ? "–" + o.reps[1] : ""} ${ud} · RIR ${o.rir} · descanso ${o.desc ? Math.round(o.desc / 60 * 10) / 10 + "'" : "—"}${o.nota ? " · " + esc(o.nota) : ""}</div>
    ${prevTxt ? `<div class="mut">${esc(prevTxt)}</div>` : ""}
    ${sug.txt ? `<div class="sug">${esc(sug.txt)}</div>` : ""}${info}
    <div class="set mut"><span>#</span><span>kg</span><span>${ud}</span><span>RIR</span><span></span></div>
    ${it.sets.map((s, j) => `<div class="set ${s.ok ? "done" : ""}"><span class="mut">${j + 1}</span>
      <input type="number" step="0.5" inputmode="decimal" data-f="set" data-i="${i}" data-s="${j}" data-k="kg" value="${esc(s.kg)}" placeholder="kg">
      <input type="number" inputmode="numeric" data-f="set" data-i="${i}" data-s="${j}" data-k="reps" value="${esc(s.reps)}" placeholder="${o.reps[0]}–${o.reps[1]}">
      <input type="number" inputmode="numeric" data-f="set" data-i="${i}" data-s="${j}" data-k="rir" value="${esc(s.rir)}" placeholder="${o.rir}">
      <button class="b sm ${s.ok ? "ok" : ""}" data-act="setok" data-i="${i}" data-s="${j}" title="Serie hecha: arranca el descanso">✓</button></div>`).join("")}
    <div class="row"><button class="b sm" data-act="addset" data-i="${i}">+ serie</button>${it.sets.length > 1 ? `<button class="b sm" data-act="delset" data-i="${i}">− serie</button>` : ""}</div>
  </div>`;
}

// Dos fotos (inicio/final) alternándose como un gif + enlace a vídeos
function media(e) {
  const im = imgsDe(e.id);
  const fotos = im.length ? `<div class="anim" title="Posición inicial ↔ final">${im.map((u) => `<img src="${u}" loading="lazy" alt="${esc(e.nombre)}" onerror="this.parentNode.remove()">`).join("")}</div>` : "";
  return `${fotos}<p><a href="${videoDe(e)}" target="_blank" rel="noopener">▶ Ver vídeos de cómo se hace</a></p>`;
}

function resumenItem(it) {
  const e = EJ[it.ej]; if (!e) return "";
  if (it.cardio) { const c = it.cardio; return [c.min && c.min + "'", c.km && c.km + " km", c.fc && c.fc + " lpm"].filter(Boolean).join(" · "); }
  if (!it.sets) return it.hecho ? "✓" : "";
  return setsValidos(it).map((s) => (num(s.kg) ? s.kg + "×" : "") + s.reps).join(", ");
}

function vHistorial() {
  const ses = sesionesOrd();
  if (!ses.length) return `<h2>Historial</h2><p class="mut">Todavía no hay sesiones.</p>`;
  return `<h2>Historial (${ses.length})</h2>` + ses.map((s) => `<div class="card">
    <div class="row" style="justify-content:space-between"><b>${esc(s.fecha)} · ${esc(s.nombre)}</b>
      <span>${s.animo ? EMO[s.animo] : ""} ${s.duracion ? s.duracion + "'" : ""} ${carga(s) ? `<span class="tag">carga ${carga(s)}</span>` : ""}</span></div>
    <details><summary class="mut">Detalle</summary><table>${s.items.map((it) => { const r = resumenItem(it); return r ? `<tr><td>${esc(EJ[it.ej]?.nombre || it.ej)}</td><td>${esc(r)}</td></tr>` : ""; }).join("")}</table>
      ${s.notas ? `<p class="mut">${esc(s.notas)}</p>` : ""}
      <div class="row"><button class="b sm" data-act="editar" data-v="${s.id}">${conf("editar" + s.id, "Editar")}</button><button class="b sm" data-act="borrar" data-v="${s.id}">${conf("borrar" + s.id, "Eliminar")}</button></div></details>
  </div>`).join("");
}

let PROG_EJ = "";
function vProgreso() {
  const semanas = [];
  for (let k = 7; k >= 0; k--) semanas.push(addDias(lunes(hoy()), -7 * k));
  const DIARIAS = ["POSTURA"]; // la rutina postural diaria se cuenta aparte
  const planN = plan().sesiones.filter((s) => s.id !== "EXTRA" && !DIARIAS.includes(s.id)).length;
  const enSemanaTodas = (w) => S.sesiones.filter((s) => s.fecha >= w && s.fecha < addDias(w, 7));
  const enSemana = (w) => enSemanaTodas(w).filter((s) => !DIARIAS.includes(s.sesionId));
  const lbl = (w) => w.slice(8) + "/" + w.slice(5, 7);
  const adh = semanas.map((w) => ({ l: lbl(w), v: enSemana(w).length }));
  const cargaSem = semanas.map((w) => ({ l: lbl(w), v: enSemana(w).reduce((a, s) => a + carga(s), 0) }));
  const cardioMin = semanas.map((w) => ({ l: lbl(w), v: enSemana(w).reduce((a, s) => a + s.items.reduce((b, it) => b + (it.cardio ? num(it.cardio.min) || 0 : 0), 0), 0) }));
  const media = (arr, k) => { const v = arr.map((s) => num(s[k])).filter((x) => x != null); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0; };

  // ejercicios con datos
  const conDatos = [...new Set(S.sesiones.flatMap((s) => s.items.filter((it) => setsValidos(it).length || (it.cardio && num(it.cardio.min))).map((it) => it.ej)))].filter((x) => EJ[x]);
  if (!PROG_EJ || !conDatos.includes(PROG_EJ)) PROG_EJ = conDatos[0] || "";
  let graf = "";
  if (PROG_EJ) {
    const e = EJ[PROG_EJ];
    const ses = [...S.sesiones].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const pts = [], filas = [];
    for (const s of ses) for (const it of s.items) if (it.ej === PROG_EJ) {
      if (it.cardio) {
        const km = num(it.cardio.km), mn = num(it.cardio.min);
        if (km && mn) pts.push({ x: s.fecha.slice(5), y: mn / km });
        filas.push([s.fecha, resumenItem(it)]);
      } else {
        const v = setsValidos(it); if (!v.length) continue;
        const best = Math.max(...v.map((x) => e1rm(num(x.kg) || 0, num(x.reps), num(x.rir)) || 0));
        const y = best > 0 ? best : Math.max(...v.map((x) => num(x.reps)));
        pts.push({ x: s.fecha.slice(5), y });
        filas.push([s.fecha, resumenItem(it)]);
      }
    }
    const esCardio = e.med === "cardio";
    const usaKg = !esCardio && S.sesiones.some((s) => s.items.some((it) => it.ej === PROG_EJ && setsValidos(it).some((x) => num(x.kg) > 0)));
    graf = `<p class="mut">${esCardio ? "Ritmo (min/km, más abajo = más rápido)" : usaKg ? "1RM estimado (Epley contando el RIR)" : e.med === "seg" ? "Mejor serie (segundos)" : "Mejor serie (reps)"}</p>
      ${linea(pts, { unidad: esCardio ? "min/km" : usaKg ? "kg" : "", invertir: false })}
      <details><summary class="mut">Registros</summary><table>${filas.reverse().map((f) => `<tr><td>${f[0]}</td><td>${esc(f[1])}</td></tr>`).join("")}</table></details>`;
  }
  const ult4 = S.sesiones.filter((s) => s.fecha >= addDias(hoy(), -28));
  return `<h2>Constancia</h2><p class="mut">Sesiones por semana (la línea verde son las ${planN} del plan)</p>${barras(adh, { meta: planN })}
    <div class="card row"><span>Últimas 4 semanas:</span> <b>${ult4.length}</b> sesiones · ánimo medio <b>${media(ult4, "animo") ? EMO[Math.round(media(ult4, "animo"))] + " " + media(ult4, "animo") : "—"}</b> · energía <b>${media(ult4, "energia") || "—"}</b> · sueño <b>${media(ult4, "sueno") || "—"} h</b></div>
    ${vHabProgreso()}
    <h2>Progreso por ejercicio</h2>
    ${conDatos.length ? `<select data-f="progej">${conDatos.map((x) => `<option value="${x}" ${x === PROG_EJ ? "selected" : ""}>${esc(EJ[x].nombre)}</option>`).join("")}</select>${graf}` : `<p class="mut">Registra sesiones para ver tu progreso.</p>`}
    <h2>Carga semanal</h2><p class="mut">Suma de dureza × minutos (sRPE). Subidas bruscas de más del ~30 % = cuidado.</p>${barras(cargaSem)}
    <h2>Minutos de cardio por semana</h2><p class="mut">Referencia: 150–300 (la línea verde marca 150).</p>${barras(cardioMin, { meta: 150 })}`;
}

function vVolumen() {
  const ini = lunes(hoy());
  const real = seriesPorMusculo(S.sesiones.filter((s) => s.fecha >= ini));
  const ult7 = seriesPorMusculo(S.sesiones.filter((s) => s.fecha > addDias(hoy(), -7)));
  const plan_ = seriesPlanificadas();
  const { min, max } = OBJETIVO_SERIES;
  const fila = (m) => {
    const v = ult7[m] || 0, p = plan_[m] || 0;
    const cls = v === 0 ? "" : v < min ? "lo" : v > max ? "hi" : "ok";
    return `<tr><td>${PRIORIDAD.includes(m) ? "★ " : ""}${MUSCULOS[m]}</td><td>${Math.round((real[m] || 0) * 10) / 10}</td><td>${Math.round(v * 10) / 10}</td><td class="mut">${Math.round(p * 10) / 10}</td>
      <td style="width:35%"><div class="bar ${cls}"><i style="width:${Math.min(100, (v / 25) * 100)}%"></i></div></td></tr>`;
  };
  return `<h2>Volumen por músculo</h2>
    <p class="mut">Series efectivas: el músculo principal cuenta 1 y el secundario 0,5 (Pelland 2024). Objetivo de hipertrofia: ${min}–${max} por semana. En fase de re-entrada es normal quedarse por debajo.<br>
    🟠 por debajo de ${min} · 🟢 dentro del rango · 🔴 por encima de ${max} · ★ tus zonas débiles: el plan les da más volumen.</p>
    <table><tr><th>Músculo</th><th>Esta semana</th><th>Últimos 7 días</th><th>Plan</th><th></th></tr>
    ${Object.keys(MUSCULOS).map(fila).join("")}</table>
    <p class="mut">Si un músculo está débil o atrasado, súbele 2–4 series/semana (en Ajustes puedes cambiar ejercicios; para añadir series, edita <code>datos.js</code>).</p>`;
}

let TEST_SEL = "";
function vTests() {
  if (!TEST_SEL) TEST_SEL = TESTS[0].id;
  const t = TESTS.find((x) => x.id === TEST_SEL);
  const regs = S.mediciones.filter((m) => m.test === TEST_SEL).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const resumen = TESTS.map((x) => {
    const r = S.mediciones.filter((m) => m.test === x.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!r.length) return `<tr><td>${esc(x.nombre)}</td><td class="mut">—</td><td></td></tr>`;
    const d = r[r.length - 1].valor - r[0].valor;
    const bien = x.mejor === "mas" ? d > 0 : x.mejor === "menos" ? d < 0 : null;
    const col = d === 0 || bien === null ? "" : bien ? "color:var(--ok)" : "color:var(--bad)";
    return `<tr><td>${esc(x.nombre)}</td><td>${r[r.length - 1].valor} ${x.unidad}</td><td style="${col}">${r.length > 1 ? (d > 0 ? "+" : "") + Math.round(d * 10) / 10 : ""}</td></tr>`;
  }).join("");
  return `<h2>Tests y mediciones</h2><p class="mut">Hazlos en la semana 1, en cada descarga y cada 6–12 semanas, siempre en las mismas condiciones.</p>
    <div class="card row"><input type="date" id="t_fecha" value="${hoy()}">
      <select data-f="testsel">${TESTS.map((x) => `<option value="${x.id}" ${x.id === TEST_SEL ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select>
      <input type="number" step="0.1" id="t_valor" placeholder="${esc(t.unidad)}"><button class="b p" data-act="addtest">Añadir</button></div>
    <h3>${esc(t.nombre)} (${esc(t.unidad)})</h3>${linea(regs.map((r) => ({ x: r.fecha.slice(2), y: r.valor })), { unidad: t.unidad })}
    ${regs.length ? `<details><summary class="mut">Registros</summary><table>${regs.map((r) => `<tr><td>${r.fecha}</td><td>${r.valor}</td><td><button class="b sm" data-act="deltest" data-v="${r.id}">✕</button></td></tr>`).join("")}</table></details>` : ""}
    <h3>Resumen (último valor y cambio desde el primero)</h3><table>${resumen}</table>`;
}

let BF = { q: "", cat: "", mus: "", eq: "" };
function vBiblio() {
  const cats = [...new Set(EJERCICIOS.map((e) => e.cat))];
  const eqs = [...new Set(EJERCICIOS.map((e) => e.equipo))];
  const q = BF.q.toLowerCase();
  const lista = EJERCICIOS.filter((e) => (!BF.cat || e.cat === BF.cat) && (!BF.eq || e.equipo === BF.eq) && (!BF.mus || e.pri.includes(BF.mus) || e.sec.includes(BF.mus)) && (!q || (e.nombre + " " + e.tecnica + " " + e.porque).toLowerCase().includes(q)));
  const sel = (k, opts, lab) => `<select data-f="bf" data-k="${k}"><option value="">${lab}</option>${opts.map(([v, t]) => `<option value="${v}" ${BF[k] === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  return `<h2>Biblioteca (${lista.length}/${EJERCICIOS.length})</h2>
    <div class="row"><input id="bq" placeholder="Buscar…" value="${esc(BF.q)}" data-f="bf" data-k="q">
    ${sel("cat", cats.map((c) => [c, c]), "Categoría")}${sel("mus", Object.entries(MUSCULOS), "Músculo")}${sel("eq", eqs.map((c) => [c, c]), "Material")}</div>
    <p class="mut">🔶 = carga alta con el músculo estirado (más hipertrofia según la evidencia).</p>
    ${lista.map((e) => `<details class="card"><summary><b>${e.est ? "🔶 " : ""}${esc(e.nombre)}</b> <span class="tag">${e.cat}</span><span class="tag">${e.equipo}</span></summary>
      <p>${e.pri.map((m) => `<span class="tag" style="color:var(--fg)">${MUSCULOS[m]}</span>`).join("")}${e.sec.map((m) => `<span class="tag">${MUSCULOS[m]} ½</span>`).join("")}</p>
      ${media(e)}<p><b>Técnica:</b> ${esc(e.tecnica)}</p><p><b>Por qué:</b> ${esc(e.porque)}</p>
      ${e.alt.length ? `<p class="mut">Alternativas: ${e.alt.map((a) => esc(EJ[a]?.nombre || a)).join(" · ")}</p>` : ""}</details>`).join("")}`;
}

function vAjustes() {
  const a = S.ajustes; const edad = num(a.edad), peso = num(a.peso);
  const fcmax = edad ? Math.round(208 - 0.7 * edad) : null;
  return `<h2>Ajustes</h2>
    <div class="card"><label>Plan <select data-f="aj" data-k="plan">${Object.entries(PLANES).map(([k, p]) => `<option value="${k}" ${a.plan === k ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</select></label></div>
    <div class="card"><label>Fase <select data-f="aj" data-k="fase">${Object.entries(FASES).map(([k, f]) => `<option value="${k}" ${a.fase === k ? "selected" : ""}>${esc(f.nombre)}</option>`).join("")}</select></label>
      <p class="mut">${esc(fase().nota)} Las series se multiplican por ${fase().mult} y se suman ${fase().rirExtra} al RIR.</p></div>
    <div class="card row"><label>Edad <input type="number" data-f="aj" data-k="edad" value="${esc(a.edad)}"></label><label>Peso (kg) <input type="number" step="0.1" data-f="aj" data-k="peso" value="${esc(a.peso)}"></label>
      <button class="b sm" data-act="rerender">Calcular</button></div>
    ${fcmax ? `<div class="card"><b>FC máx estimada: ${fcmax}</b> (Tanaka)<br>Suave: ${Math.round(fcmax * 0.6)}–${Math.round(fcmax * 0.75)} · Tempo: ${Math.round(fcmax * 0.8)}–${Math.round(fcmax * 0.88)} · Intervalos 4×4: ${Math.round(fcmax * 0.85)}–${Math.round(fcmax * 0.95)} lpm</div>` : ""}
    ${peso ? `<div class="card"><b>Proteína:</b> ${Math.round(peso * 1.6)}–${Math.round(peso * 2.2)} g/día (~${Math.round(peso * 0.4)} g/comida × 4) · <b>Creatina:</b> 3–5 g/día · <b>Cafeína opcional:</b> ~${Math.round(peso * 3)} mg antes de entrenar</div>` : ""}
    <div class="card"><h3>Checks diarios</h3>
      <table>${a.habitos.map((x) => `<tr><td>${esc(nombreHab(x))}</td><td style="text-align:right"><button class="b sm" data-act="habdel" data-v="${esc(x.id)}">${conf("habdel" + x.id, "Quitar")}</button></td></tr>`).join("")}</table>
      <div class="row" style="margin-top:8px"><input id="hab_nuevo" placeholder="Nuevo check (p. ej. vitamina D, 8.000 pasos)" style="flex:1;min-width:0"><button class="b" data-act="habadd">Añadir</button></div>
      <p class="mut">Quitar un check no borra los días que ya marcaste. Si pones tu peso, el check de proteína muestra tu objetivo en gramos.</p></div>
    <div class="card"><h3>Ejercicios cambiados</h3>${Object.keys(a.swaps).length ? `<table>${Object.entries(a.swaps).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(EJ[v]?.nombre || v)}</td><td><button class="b sm" data-act="unswap" data-v="${esc(k)}">Restaurar</button></td></tr>`).join("")}</table>` : `<p class="mut">Ninguno. Puedes cambiar un ejercicio desde el desplegable durante la sesión y la app lo recuerda.</p>`}</div>
    ${IMPORT_PEND ? `<div class="card warn">¿Importar ${IMPORT_PEND.sesiones.length} sesiones y ${(IMPORT_PEND.mediciones || []).length} mediciones? Esto reemplaza todos los datos actuales.
      <div class="row" style="margin-top:6px"><button class="b p" data-act="impok">Importar</button><button class="b" data-act="impno">Cancelar</button></div></div>` : ""}
    <div class="card"><h3>Datos</h3><p class="mut">${MODO === "nube"
      ? "Tus datos se guardan en tu cuenta de Claude y se sincronizan entre el móvil y el PC. Solo tú puedes verlos."
      : "Estás usando la copia local: todo se guarda en este navegador. <b>Exporta una copia cada semana.</b>"} Última copia exportada: ${esc(a.ultimaCopia || "nunca")}.</p>
      <div class="row"><button class="b p" data-act="export">Exportar copia (JSON)</button>
      <label class="b">Importar <input type="file" accept=".json" id="imp" style="display:none"></label>
      <button class="b" data-act="reset">${conf("reset", "Borrar todo")}</button></div></div>`;
}

// ===================== Temporizador de descanso =====================
let TIMER = { fin: 0, h: null };
function startTimer(seg) {
  if (!seg) return;
  TIMER.fin = Date.now() + seg * 1000; $("#timer").style.display = "flex";
  clearInterval(TIMER.h); TIMER.h = setInterval(tick, 250); tick();
}
function tick() {
  const r = Math.max(0, Math.round((TIMER.fin - Date.now()) / 1000));
  $("#tleft").textContent = `${Math.floor(r / 60)}:${pad(r % 60)}`;
  if (r <= 0) { clearInterval(TIMER.h); beep(); setTimeout(() => ($("#timer").style.display = "none"), 4000); }
}
function beep() {
  try { const c = new (window.AudioContext || window.webkitAudioContext)(); const o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); o.stop(c.currentTime + 0.4); } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

// ===================== Eventos =====================
document.addEventListener("click", (ev) => {
  const t = ev.target.closest("[data-act]"); if (!t) return;
  const { act, v, k } = t.dataset; const i = +t.dataset.i, j = +t.dataset.s; const b = S.borrador;
  switch (act) {
    case "tab": TAB = v; break;
    case "empezar": nuevoBorrador(v); break;
    case "val": b[k] = +v; break;
    case "check": b.items[i].hecho = !b.items[i].hecho; break;
    case "setok": { const s = b.items[i].sets[j]; s.ok = !s.ok; if (s.ok) startTimer(b.items[i].obj.desc); break; }
    case "addset": { const ss = b.items[i].sets; const last = ss[ss.length - 1]; ss.push({ kg: last ? last.kg : "", reps: "", rir: "", ok: false }); break; }
    case "delset": b.items[i].sets.pop(); break;
    case "guardar": {
      if (!b.duracion) b.duracion = Math.round((Date.now() - b.inicio) / 60000);
      S.sesiones = S.sesiones.filter((s) => s.id !== b.id); S.sesiones.push(b); S.borrador = null; TAB = "historial";
      // terminar la rutina postural marca su check de ese día
      if (b.sesionId === "POSTURA" && S.ajustes.habitos.some((x) => x.id === "postura")) { marcarHab(b.fecha, "postura", true); TAB = "hoy"; }
      break;
    }
    case "hab": { const f = HAB_DIA || hoy(); marcarHab(f, v, !habDia(f)?.hechos[v]); break; }
    case "habdia": HAB_DIA = v === hoy() ? null : v; break;
    case "habadd": {
      const n = $("#hab_nuevo").value.trim(); if (!n) return estado("Escribe el nombre del check.");
      S.ajustes.habitos = [...S.ajustes.habitos, { id: uid(), nombre: n }]; break;
    }
    case "habdel": if (!seguro("habdel" + v)) return; S.ajustes.habitos = S.ajustes.habitos.filter((x) => x.id !== v); break;
    case "descartar": if (!seguro("descartar")) return; S.borrador = null; break;
    case "editar": {
      if (S.borrador && S.borrador.id !== v && !seguro("editar" + v)) { estado("Tienes una sesión en curso: pulsa otra vez para reemplazarla por esta."); return; }
      S.borrador = JSON.parse(JSON.stringify(S.sesiones.find((s) => s.id === v))); TAB = "hoy"; break;
    }
    case "borrar": if (!seguro("borrar" + v)) return; S.sesiones = S.sesiones.filter((s) => s.id !== v); break;
    case "addtest": {
      const val = num($("#t_valor").value), f = $("#t_fecha").value; if (val == null || !f) return estado("Pon fecha y valor.");
      S.mediciones.push({ id: uid(), fecha: f, test: TEST_SEL, valor: val }); break;
    }
    case "deltest": S.mediciones = S.mediciones.filter((m) => m.id !== v); break;
    case "unswap": delete S.ajustes.swaps[v]; break;
    case "export": exportar(); return;
    case "impok": S = normalizar(IMPORT_PEND); IMPORT_PEND = null; estado("Datos importados."); break;
    case "impno": IMPORT_PEND = null; break;
    case "reset": if (!seguro("reset")) return; S = VACIO(); break;
    case "t+": TIMER.fin += 30000; return;
    case "tstop": clearInterval(TIMER.h); $("#timer").style.display = "none"; return;
    case "rerender": break;
  }
  guardar(true); render();
});

async function exportar() {
  const datos = JSON.stringify({ ...S, borrador: null }, null, 1), nombre = `rutina-copia-${hoy()}.json`;
  const listo = () => { S.ajustes.ultimaCopia = hoy(); guardar(true); render(); };
  const dl = MODO === "nube" ? await window.claude.use("downloads").catch(() => null) : null;
  if (dl) {
    try { await dl.save({ filename: nombre, data: datos }); listo(); }
    catch (e) { if (e && e.code !== "declined") estado("No se pudo guardar el archivo aquí. Prueba desde el ordenador."); }
    return;
  }
  // en el móvil: menú de compartir (Guardar en Archivos, Drive, enviarlo por correo…)
  try {
    const archivo = new File([datos], nombre, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share({ files: [archivo], title: nombre }); listo(); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([datos], { type: "application/json" })); a.download = nombre; a.click(); listo();
}

document.addEventListener("input", (ev) => {
  const t = ev.target; const { f, k } = t.dataset; if (!f) return; const i = +t.dataset.i, j = +t.dataset.s; const b = S.borrador;
  if (f === "set") b.items[i].sets[j][k] = t.value;
  else if (f === "cardio") b.items[i].cardio[k] = t.value;
  else if (f === "ses") b[k] = t.value;
  else if (f === "aj" && (k === "edad" || k === "peso")) S.ajustes[k] = t.value;
  else if (f === "bf" && k === "q") { BF.q = t.value; render(); const q = $("#bq"); q.focus(); q.setSelectionRange(q.value.length, q.value.length); return; }
  else return;
  guardar();
});

document.addEventListener("change", (ev) => {
  const t = ev.target; const { f, k } = t.dataset;
  if (t.id === "imp" && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try { const d = JSON.parse(r.result); if (!Array.isArray(d.sesiones)) throw 0; IMPORT_PEND = d; TAB = "ajustes"; render(); }
      catch (e) { estado("Ese archivo no es una copia de la app."); }
    };
    r.readAsText(t.files[0]); return;
  }
  if (!f) return;
  if (f === "swap") {
    const b = S.borrador; const i = +t.dataset.i; const it = b.items[i];
    const pi = plan().sesiones.find((s) => s.id === b.sesionId).items[it.idx];
    if (t.value === pi.ej) delete S.ajustes.swaps[b.sesionId + ":" + it.idx]; else S.ajustes.swaps[b.sesionId + ":" + it.idx] = t.value;
    b.items[i] = crearItem(pi, t.value, it.idx, b.sesionId);
  } else if (f === "cardio") { /* ya guardado en input; re-render para ritmo y avisos */ }
  else if (f === "aj" && (k === "plan" || k === "fase")) S.ajustes[k] = t.value;
  else if (f === "progej") PROG_EJ = t.value;
  else if (f === "testsel") TEST_SEL = t.value;
  else if (f === "bf" && k !== "q") BF[k] = t.value;
  else return;
  guardar(true); render();
});

iniciar();
