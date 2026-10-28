/* Página 2: diagrama unifilar del sistema de monitoreo y control (BMS), lámina Sinergia.
   Se dibuja solo a partir de niveles, controladores y equipos. Formato según "Diagrama Unifilar de BMS" (insumos). */
(function () {
  const { h, cut } = BMS;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#111', GRIS = '#555';
  const COLOR = { A: '#ff9e7f', B: '#ff0000', C: '#00ffff', D: '#ff00ff' };
  let coloresOn = true;
  const col = (k) => (coloresOn && COLOR[k]) || INK;

  /* ---- primitivas SVG (trazo fino tipo plano) ---- */
  const s = (tag, a, txt) => {
    const e = document.createElementNS(NS, tag);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  };
  const line = (g, x1, y1, x2, y2, o = {}) => g.append(s('line', { x1, y1, x2, y2, stroke: o.color || INK, 'stroke-width': o.w || 1, 'stroke-dasharray': o.dash || null }));
  const rect = (g, x, y, w, hh, o = {}) => g.append(s('rect', { x, y, width: w, height: hh, rx: o.r || 0, fill: o.fill || '#fff', stroke: o.stroke || INK, 'stroke-width': o.w || 1, 'stroke-dasharray': o.dash || null }));
  const txt = (g, x, y, t, o = {}) => g.append(s('text', { x, y, 'font-size': o.size || 9, 'font-weight': o.bold ? 700 : 400, 'text-anchor': o.anchor || 'start', fill: o.fill || INK }, String(t).toUpperCase()));
  const wrap = (t, n) => { const out = []; let cur = ''; String(t).split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; };
  const para = (g, x, y, t, n, o = {}) => { const ls = wrap(t, n); ls.forEach((l, i) => txt(g, x, y + i * (o.lh || 11), l, o)); return ls.length; };
  const clave = (g, x, y, k) => { g.append(s('circle', { cx: x, cy: y, r: 8, fill: '#fff', stroke: INK, 'stroke-width': 1 })); txt(g, x, y + 3.5, k, { size: 10, anchor: 'middle' }); };
  const equipoX = (g, x, y, z = 12) => { rect(g, x, y, z, z, { w: 1.2 }); line(g, x, y, x + z, y + z); line(g, x + z, y, x, y + z); };
  const plug = (g, x, y) => { line(g, x, y, x + 12, y, { w: 1.2 }); line(g, x + 12, y - 6, x + 12, y + 6, { w: 1.8 }); line(g, x + 16, y - 6, x + 16, y + 6, { w: 1.8 }); line(g, x + 16, y, x + 22, y, { w: 1.2 }); };
  const dot = (g, x, y) => g.append(s('circle', { cx: x, cy: y, r: 2.5, fill: INK }));

  /* ---- símbolos ---- */
  const simCP = (g, x, y, w = 128, hh = 64) => { rect(g, x, y, w, hh); rect(g, x + 6, y + 8, w - 12, hh - 16); [0.33, 0.66].forEach((f) => line(g, x + 6 + (w - 12) * f, y + 8, x + 6 + (w - 12) * f, y + hh - 8)); };
  const simCS = (g, x, y, w = 56, hh = 80, marco = true) => { if (marco) rect(g, x - 6, y - 6, w + 12, hh + 12, { stroke: '#bbb', w: 0.6 }); rect(g, x, y, w, hh); rect(g, x + 8, y + 8, w - 20, hh - 16); for (let i = 0; i < 7; i++) line(g, x + w - 10, y + 10 + i * 9, x + w - 4, y + 10 + i * 9); rect(g, x + 14, y + hh - 22, w - 32, 8); };
  const simGW = (g, x, y, w = 110) => { rect(g, x, y, w, 30, { r: 6 }); txt(g, x + w / 2, y + 19, 'GATEWAY', { size: 10, anchor: 'middle' }); };
  const simOtros = (g, x, y, w, t) => { rect(g, x, y, w, 24, { r: 5 }); txt(g, x + w / 2, y + 10, 'OTROS', { size: 7, anchor: 'middle' }); txt(g, x + w / 2, y + 19, 'EQUIPOS', { size: 7, anchor: 'middle' }); };
  const simPC = (g, x, y) => { rect(g, x, y, 56, 36); rect(g, x + 5, y + 5, 46, 26); rect(g, x - 6, y + 38, 68, 10); line(g, x + 10, y + 43, x + 50, y + 43); };
  const simNube = (g, x, y) => g.append(s('path', { d: `M${x} ${y + 40} q-22 0 -22 -22 q0 -22 26 -20 q8 -26 38 -18 q22 -14 42 6 q30 -4 30 24 q0 30 -34 30 z`, fill: '#fff', stroke: INK, 'stroke-width': 1 }));
  const simLaptop = (g, x, y) => { rect(g, x, y, 54, 34); line(g, x - 8, y + 40, x + 62, y + 40); line(g, x - 8, y + 40, x, y + 34); line(g, x + 62, y + 40, x + 54, y + 34); };

  /* ---- textos por marca (columna "igual o superior a") ---- */
  const SIMB = {
    JCI: {
      servidor: 'Servidor de aplicación y datos (ADS/ODS). Ver requerimientos en notas y especificaciones técnicas.',
      cp: 'Controlador primario / motor de red. Ver modelo, requerimientos en notas y especificaciones técnicas. Alimentación eléctrica 24 VCA.',
      cs: 'Controlador de campo con accesorios compatibles con BACnet. Ver requerimientos en notas y especificaciones técnicas.',
      iom: 'Módulos configurables de entrada/salida, 24 VDC. Ver requerimientos en notas y especificaciones técnicas.'
    },
    Honeywell: {
      servidor: 'Supervisor / servidor de estaciones (Niagara). Ver requerimientos en notas y especificaciones técnicas.',
      cp: 'Controlador avanzado Optimizer / motor de red. Ver modelo, requerimientos en notas y especificaciones técnicas.',
      cs: 'Controlador Optimizer con entradas/salidas propias, compatible con BACnet. Ver requerimientos en notas y especificaciones técnicas.',
      iom: 'Módulos Optimizer IO (Modbus RTU / panel bus). Ver requerimientos en notas y especificaciones técnicas.'
    }
  };
  const NOTAS_BASE = 'Se debe coordinar con el departamento de informática las IP fijas requeridas en el sistema para los controladores que se comuniquen bajo el protocolo BACnet IP, Modbus TCP, entre otros.';

  function datos() {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc;
    const res = C.todo(), mot = C.motor(res, P.marca), M = BMS.catCt.marcas[P.marca];
    const det = {}; mot.detalle.forEach((d) => (det[d.c.id] = d));
    return { E, P, C, res, mot, M, det };
  }

  /* Equipos cableados de un controlador agrupados por tipo. */
  function itemsCtrl(res, cid) {
    const g = new Map();
    res.filas.filter((f) => f.ctrlId === cid && f.tipo && f.eq.qty > 0 && !f.tipo.gw).forEach((f) => {
      const k = f.tipo.id; const o = g.get(k) || { tipo: f.tipo, qty: 0, tags: [], t: BMS.calc.vacio() };
      o.qty += f.eq.qty; if (f.eq.tag) o.tags.push(f.eq.tag);
      ['ai', 'ao', 'di', 'do', 'int'].forEach((q) => (o.t[q] += f.t[q])); g.set(k, o);
    });
    return [...g.values()];
  }
  /* Equipos integrados por gateway, agrupados por tipo. */
  function itemsGW(res, gw, nivelDe) {
    const g = new Map(), host = {};
    res.filas.filter((f) => f.tipo && f.tipo.gw === gw && f.eq.qty > 0).forEach((f) => {
      const o = g.get(f.tipo.id) || { tipo: f.tipo, qty: 0, ints: 0, niv: new Set() };
      o.qty += f.eq.qty; o.ints += f.t.int; const n = nivelDe(f.eq.nivel); if (n) o.niv.add(n.codigo); g.set(f.tipo.id, o);
      if (f.ctrlId) host[f.ctrlId] = (host[f.ctrlId] || 0) + f.t.int;
    });
    const hid = Object.keys(host).sort((a, b) => host[b] - host[a])[0];
    return { items: [...g.values()], host: hid || null };
  }
  /* Una fila de equipo colgando del controlador: clave D (cableado) o A (equipo IP directo, solo puntos INT). */
  const ITH = 44;
  const dibujaItem = (g, x, yy, it, n) => {
    const directo = it.t.ai + it.t.ao + it.t.di + it.t.do === 0 && it.t.int > 0;
    clave(g, x + 18, yy - 22, directo ? 'A' : 'D');
    line(g, x, yy - 14, x + 14, yy, { w: 1.8, color: col(directo ? 'A' : 'D') }); equipoX(g, x + 14, yy - 9, 18);
    const nom = etiqueta(it) + (it.tags[0] && !etiqueta(it).toUpperCase().includes(it.tags[0].toUpperCase().replace(/-$/, '')) ? ' ' + it.tags[0] : '') + (it.qty > 1 ? ' ×' + it.qty : '');
    const ls = wrap(nom, n).slice(0, 2);
    ls.forEach((l, i) => txt(g, x + 38, yy - 3 + i * 9.5, i === 1 && wrap(nom, n).length > 2 ? cut(l, n) : l, { size: 8.5 }));
    txt(g, x + 38, yy - 3 + ls.length * 9.5 + 1, directo ? `INT ${it.t.int} · red IP` : `AI ${it.t.ai} AO ${it.t.ao} DI ${it.t.di} DO ${it.t.do}`, { size: 7.5, fill: GRIS });
  };
  const etiqueta = (it) => it.tipo.nombre.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();

  function construir() {
    const { E, P, C, res, mot, M, det } = datos();
    const cfgD = E.diagrama;
    coloresOn = cfgD.colores !== false;
    const W = 2592, COLW = 218, X0 = 330, PORFILA = 10, MAXIT = 8;
    const cps = E.controladores.filter((c) => c.tipo === 'CP');
    const principal = cps[0] || null;
    const resto = E.controladores.filter((c) => c !== principal).sort((a, b) => (C.nivelDe(a.nivel) ? E.niveles.indexOf(C.nivelDe(a.nivel)) : 99) - (C.nivelDe(b.nivel) ? E.niveles.indexOf(C.nivelDe(b.nivel)) : 99) || a.tipo.localeCompare(b.tipo) || a.consec - b.consec);
    const nodos = resto.map((c) => ({ k: 'ctrl', c, its: itemsCtrl(res, c.id) }));
    [...res.gwTodos].sort().forEach((gw, i) => {
      const r = itemsGW(res, gw, C.nivelDe);
      nodos.push({ k: 'gw', gw, n: i + 1, ...r, clave: gw === 'GW-MODBUS' ? 'C' : 'A' });
    });
    const itsP = principal ? itemsCtrl(res, principal.id) : [];
    const altNodo = (n) => n.k === 'ctrl' ? 140 + Math.min(n.its.length, MAXIT + 1) * ITH : 200 + n.items.length * 36;
    const filas = [];
    for (let i = 0; i < Math.max(1, nodos.length); i += PORFILA) filas.push(nodos.slice(i, i + PORFILA));
    const altP = 22 + 70 + 70 + Math.min(itsP.length, MAXIT + 1) * ITH;
    let y = 400;
    const pos = filas.map((f, i) => { const hh = Math.max(i === 0 ? altP : 60, ...f.map(altNodo), 120) + 70; const r = { busY: y + 40, hh }; y += hh; return r; });
    const yLeyenda = y + 10, H = Math.max(1728, yLeyenda + 400);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, xmlns: NS, role: 'img', 'aria-label': 'Diagrama unifilar del sistema de monitoreo y control (BMS)', 'font-family': 'Arial Narrow, Arial, Helvetica, sans-serif' });
    svg.append(s('rect', { width: W, height: H, fill: '#fff' }));
    const g = s('g'); svg.append(g);
    rect(g, 12, 12, W - 24, H - 24, { w: 0.6 });

    /* ---- zona superior: licencias, LAN, internet ---- */
    if (cfgD.licencias) {
      rect(g, 120, 90, 300, 150, { dash: '5 4', w: 0.8 }); simPC(g, 242, 150);
      para(g, 270, 40, 'Licencia para estación de monitoreo fija por contratista de BMS. Software workstation standar', 40, { anchor: 'middle', size: 8.5 });
      line(g, 270, 240, 270, 270, { dash: '4 3', w: 0.8 });
      para(g, 1040, 70, 'Licencia para servidor de clientes web (monitoreo remoto) por contratista de BMS. Software enterprise server solo requerido para dos o más automation server', 44, { anchor: 'middle', size: 8.5 });
      rect(g, 1013, 160, 56, 36, { r: 3 }); line(g, 1040, 196, 1040, 270, { dash: '4 3', w: 0.8 });
      simNube(g, 2060, 235); txt(g, 2108, 262, 'INTERNET', { size: 12, anchor: 'middle' });
      simLaptop(g, 2340, 120); simLaptop(g, 2340, 200);
      line(g, 2290, 240, 2340, 215, { dash: '5 4', w: 0.8 }); line(g, 2290, 250, 2340, 150, { dash: '5 4', w: 0.8 });
      para(g, 2400, 60, '2 licencias para estaciones remotas de monitoreo por contratista de BMS. Software workstation standar', 36, { anchor: 'middle', size: 8.5 });
    }
    line(g, 40, 270, 2056, 270, { w: 2.4 });
    txt(g, 700, 262, 'LAN Ethernet Local Area Network (por otros)', { size: 14 });

    /* ---- controlador principal ---- */
    const busIni = principal ? 192 : 60;
    if (principal) {
      const d = det[principal.id], pBus = pos[0].busY;
      line(g, 108, 270, 108, pBus - 40, { w: 2.4, color: col('A') }); rect(g, 103, 330, 10, 10); clave(g, 128, 352, 'A');
      txt(g, 140, 336, 'Salida de TO, ver láminas T-2XX (por otros)', { size: 8.5 });
      line(g, 108, pBus - 40, 108, pBus + 10, { w: 2.4, color: col('A') });
      simCP(g, 44, pBus + 10);
      txt(g, 120, pBus - 36, C.nombreCtrl(principal), { size: 12, bold: true });
      txt(g, 120, pBus - 24, 'Controlador', { size: 9 }); txt(g, 120, pBus - 13, 'principal', { size: 9 });
      plug(g, 20, pBus + 40); txt(g, 8, pBus + 66, '120 V,', { size: 7.5 }); txt(g, 8, pBus + 75, 'UPS', { size: 7.5 });
      txt(g, 46, pBus + 100, mot.motor ? 'Motor de red ' + mot.motor.cod : 'Motor de red por definir', { size: 8.5 });
      txt(g, 46, pBus + 111, d && d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base : '', { size: 8.5 });
      const cB = (M && M.bus) || 'B';
      line(g, 172, pBus + 40, busIni + 20, pBus + 40, { w: 2.4, color: col(cB) }); line(g, busIni + 20, pBus + 40, busIni + 48, pBus, { w: 2.4, color: col(cB) });
      const kP = Math.min(itsP.length, MAXIT);
      if (kP) line(g, 62, pBus + 74, 62, pBus + 138 + (kP - 1) * ITH - 14, { w: 1.8, color: col('D') });
      itsP.slice(0, MAXIT).forEach((it, i) => dibujaItem(g, 62, pBus + 138 + i * ITH, it, 34));
      if (itsP.length > MAXIT) txt(g, 80, pBus + 138 + MAXIT * ITH, '+ ' + (itsP.length - MAXIT) + ' tipos de equipo más (ver matriz)', { size: 8, fill: GRIS });
    } else {
      rect(g, 44, pos[0].busY, 128, 50, { dash: '5 4' }); txt(g, 108, pos[0].busY + 28, 'Sin controlador principal', { size: 8.5, anchor: 'middle' });
    }

    /* ---- troncales y nodos ---- */
    const busK = M && M.bus ? M.bus : 'B';
    let numG = 0;
    filas.forEach((fila, ri) => {
      const { busY } = pos[ri], n = fila.length;
      const xIni = ri === 0 ? busIni + 30 : 40, xFin = n ? X0 + (n - 1) * COLW + 50 + 60 : xIni + 40;
      const xs0 = ri === 0 && principal ? busIni + 48 : xIni;
      g.append(s('path', { d: `M${xs0} ${busY} ` + fila.map((_, i) => { const c0 = X0 + i * COLW + 50; return `H${c0 - 16} L${c0} ${busY + 22} L${c0 + 16} ${busY}`; }).join(' ') + ` H${xFin}`, fill: 'none', stroke: col(busK), 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
      if (ri > 0) { txt(g, 40, busY - 10, 'Continúa troncal (fila ' + (ri + 1) + ')', { size: 8.5 }); clave(g, 150, busY, busK); }
      fila.forEach((nd, i) => {
        const x = X0 + i * COLW, xs = x + 22, cx = xs + 28;
        if (i > 0) clave(g, cx - COLW / 2, busY, busK);
        if (i === 0 && (ri > 0 || !principal)) clave(g, cx - 56, busY, busK);
        if (nd.k === 'ctrl') {
          const d = det[nd.c.id], t = d.t, esCP = nd.c.tipo === 'CP';
          txt(g, cx, busY - 8, C.nombreCtrl(nd.c), { size: 11, bold: true, anchor: 'middle' });
          simCS(g, xs, busY + 28);
          if (esCP) rect(g, xs + 22, busY + 42, 12, 8, { fill: '#000' });
          plug(g, x - 6, busY + 78); txt(g, x - 8, busY + 100, '120 V,', { size: 7.5 }); txt(g, x - 8, busY + 109, 'UPS', { size: 7.5 });
          const n1 = C.nivelDe(nd.c.nivel);
          txt(g, xs + 68, busY + 40, cut(n1 ? 'Nivel ' + n1.codigo + ' — ' + n1.nombre : '', 22), { size: 8.5, bold: true });
          txt(g, xs + 68, busY + 52, `AI ${t.ai} · AO ${t.ao} · DI ${t.di} · DO ${t.do}`, { size: 8.5 });
          if (t.int) txt(g, xs + 68, busY + 63, `INT ${t.int} (por gateway)`, { size: 8, fill: GRIS });
          const mod = d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base : 'Sin hardware';
          txt(g, xs + 68, busY + 75, cut(mod, 24), { size: 8 });
          const mods = Object.keys(d.cfg.modulos || {}).filter((k) => d.cfg.modulos[k]).map((k) => d.cfg.modulos[k] + '×' + k).join(' + ');
          if (mods) { const ls = wrap(mods, 24); ls.slice(0, 3).forEach((l, q) => txt(g, xs + 68, busY + 86 + q * 10, l, { size: 7.5, fill: GRIS })); }
          if (d.ev.falta) { g.append(s('circle', { cx: xs + 62, cy: busY + 34, r: 5, fill: '#c00' })); }
          const kC = Math.min(nd.its.length, MAXIT);
          if (kC) line(g, cx, busY + 114, cx, busY + 142 + (kC - 1) * ITH - 14, { w: 1.8, color: col('D') });
          nd.its.slice(0, MAXIT).forEach((it, q) => dibujaItem(g, cx, busY + 142 + q * ITH, it, 24));
          if (nd.its.length > MAXIT) txt(g, cx + 38, busY + 142 + MAXIT * ITH, '+ ' + (nd.its.length - MAXIT) + ' tipos más (ver matriz)', { size: 8, fill: GRIS });
        } else {
          numG++;
          txt(g, cx, busY - 8, 'GW-' + nd.n, { size: 11, bold: true, anchor: 'middle' });
          simGW(g, cx - 55, busY + 22);
          txt(g, cx, busY + 66, nd.gw, { size: 9, anchor: 'middle', bold: true });
          const host = nd.host ? E.controladores.find((c) => c.id === nd.host) : null;
          if (host) txt(g, cx, busY + 77, 'Cerca de ' + C.nombreCtrl(host), { size: 7.5, anchor: 'middle', fill: GRIS });
          line(g, cx, busY + 82, cx, busY + 100, { w: 1.8, color: col(nd.clave) }); clave(g, cx, busY + 100, nd.clave);
          g.append(s('path', { d: `M${cx} ${busY + 108} V${busY + 114} H${cx - 108} V${busY + 190} H${cx - 100}`, fill: 'none', stroke: col(nd.clave), 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
          para(g, cx, busY + 124, 'Contratista de BMS debe integrar estos equipos y velar porque sean compatibles con su solución (suministrados e instalados por otros)', 40, { size: 7.5, anchor: 'middle', lh: 9 });
          rect(g, cx - 100, busY + 178, 200, 14 + nd.items.length * 36, { dash: '5 4', w: 0.8 });
          nd.items.forEach((it, q) => {
            const yy = busY + 188 + q * 36;
            simOtros(g, cx - 92, yy, 56);
            txt(g, cx - 30, yy + 9, cut(etiqueta(it) + (it.qty > 1 ? ' ×' + it.qty : ''), 25), { size: 8 });
            txt(g, cx - 30, yy + 20, `INT ${it.ints}` + (it.niv.size ? ' · ' + [...it.niv].join(', ') : ''), { size: 7, fill: GRIS });
          });
        }
      });
    });
    if (!nodos.length) txt(g, X0, pos[0].busY - 12, 'Agregue controladores en la pestaña 1 para completar la troncal', { size: 11, fill: '#c00' });
    if (res.sin.filas) txt(g, 44, yLeyenda - 6, '⚠ ' + res.sin.filas + ' filas de equipos sin controlador (' + C.cable(res.sin) + ' puntos): cree o asigne controladores', { size: 11, fill: '#c00', bold: true });

    /* ---- claves de cableado ---- */
    const L = yLeyenda + 20, awg = cfgD.awg || '16';
    rect(g, 60, L, 560, 190); txt(g, 340, L + 24, 'Claves de cableado', { size: 17, anchor: 'middle' }); line(g, 60, L + 34, 620, L + 34); line(g, 60, L + 52, 620, L + 52); line(g, 120, L + 34, 120, L + 190);
    txt(g, 90, L + 47, 'Clave', { size: 9, anchor: 'middle' }); txt(g, 370, L + 47, 'Descripción', { size: 9, anchor: 'middle' });
    const claves = [['A', 'BACnet IP.', 'Cableado UTP categoría según proyecto hasta salida de telecomunicaciones en EMT o patch cord certificado de fábrica.'],
      ['B', 'BACnet MS/TP.', 'Cableado igual o superior a Belden 9841 en tubería EMT. En exteriores usar Belden 5502G1.'],
      ['C', 'Modbus RTU.', 'Cableado igual o superior a Belden 9841 en tubería EMT. En exteriores usar Belden 5502G1.'],
      ['D', 'Señales analógicas y digitales.', 'Cableado TFFN #' + awg + ' AWG en tubería EMT o multiconductor equivalente en tubería EMT. Cantidad según matriz I/O.']];
    claves.forEach((c, i) => { const yy = L + 52 + i * 34; if (i) line(g, 60, yy, 620, yy); clave(g, 90, yy + 12, c[0]); line(g, 68, yy + 27, 112, yy + 27, { w: 2.6, color: col(c[0]) }); txt(g, 128, yy + 12, c[1], { size: 8.5, bold: true }); para(g, 128, yy + 22, c[2], 92, { size: 7.5, lh: 8 }); });

    /* ---- simbología ---- */
    const sb = SIMB[P.marca] || SIMB.JCI, SX = 700, SW = 1000;
    const cpRef = mot.motor ? mot.motor.cod : '—', csBase = (M && M.bases[0]) ? M.bases.map((b) => b.cod).join(' / ') : '—', iomRef = M ? M.modulos.map((m) => m.cod).slice(0, 4).join(' / ') : '—';
    const filasS = [
      ['srv', sb.servidor, 'Según especificaciones técnicas'], ['cp', sb.cp, 'Igual o superior a ' + cpRef], ['cs', sb.cs, 'Igual o superior a ' + csBase], ['iom', sb.iom, 'Igual o superior a ' + iomRef],
      ['gw', 'Gateway. Pasarela para interconectar protocolos y arquitecturas; debe ser ubicado dentro del gabinete del controlador más próximo.', 'Según equipo a integrar'],
      ['otros', 'Equipos suministrados e instalados por otros, con tarjetas de fábrica compatibles. Contratista de BMS debe incluir cableado, tubería, accesorios y programación necesarios para integrarlos.', ''],
      ['eq', 'Equipo o sensor cableado al controlador (señales analógicas y digitales, clave D).', '']];
    const rh = 40;
    rect(g, SX, L, SW, 34 + filasS.length * rh); txt(g, SX + SW / 2, L + 24, 'Simbología de sistema de monitoreo y control', { size: 17, anchor: 'middle' }); line(g, SX, L + 34, SX + SW, L + 34);
    filasS.forEach((r, i) => {
      const yy = L + 34 + i * rh; if (i) line(g, SX, yy, SX + SW, yy);
      line(g, SX + 100, yy, SX + 100, yy + rh); line(g, SX + 740, yy, SX + 740, yy + rh);
      const cx0 = SX + 14, cy0 = yy + 6;
      if (r[0] === 'srv') simPC(g, cx0 + 8, cy0 - 2); else if (r[0] === 'cp') { simCP(g, cx0 - 2, cy0 + 2, 76, 30); } else if (r[0] === 'cs') { simCS(g, cx0 + 14, cy0 - 2, 36, 36); } else if (r[0] === 'iom') { g.append(s('ellipse', { cx: cx0 + 36, cy: cy0 + 16, rx: 18, ry: 11, fill: '#fff', stroke: INK })); txt(g, cx0 + 36, cy0 + 20, 'IOM', { size: 9, anchor: 'middle' }); }
      else if (r[0] === 'gw') simGW(g, cx0 - 2, cy0 + 4, 76); else if (r[0] === 'otros') simOtros(g, cx0 + 10, cy0 + 4, 54); else equipoX(g, cx0 + 30, cy0 + 12);
      para(g, SX + 110, yy + 14, r[1], 150, { size: 7.5, lh: 9 }); para(g, SX + 750, yy + 14, r[2], 52, { size: 7.5, lh: 9 });
    });

    /* ---- notas y totales ---- */
    const NX = 1760, tt = res.total, rv = C.conReserva(tt, P.reserva);
    txt(g, NX, L + 14, 'Notas:', { size: 11, bold: true });
    let ny = L + 30;
    const notas = [(cfgD.notas || NOTAS_BASE), 'UPS de 4 h para servidor y controladores; reserva de puntos del ' + P.reserva + ' % (dimensionamiento de controladores).',
      'Cantidades según matriz de puntos del proyecto. Los puntos por gateway (INT) no ocupan canales del controlador.',
      'Total del proyecto: AI ' + tt.ai + ' · AO ' + tt.ao + ' · DI ' + tt.di + ' · DO ' + tt.do + ' (' + C.cable(tt) + ' cableados, ' + C.cable(rv) + ' con reserva) · INT ' + tt.int + '.',
      'Marca de controladores: ' + P.marca + '. Selección de modelos según pestaña 5; validar con el integrador.'];
    notas.forEach((t, i) => { const nl = para(g, NX + 12, ny, (i + 1) + '. ' + t, 70, { size: 8.5, lh: 10.5 }); ny += nl * 10.5 + 7; });

    /* ---- cajetín ---- */
    const TY = H - 110;
    line(g, 40, TY, W - 40, TY, { w: 1.2 });
    txt(g, 70, TY + 46, 'Diagrama unifilar del sistema de monitoreo y control (BMS)', { size: 26 });
    txt(g, 72, TY + 66, 'Sin escala', { size: 12 });
    txt(g, 1500, TY + 30, 'Proyecto: ' + (P.nombre || '—'), { size: 11, bold: true }); txt(g, 1500, TY + 46, [P.propietario, P.ubicacion].filter(Boolean).join(' · '), { size: 9 });
    txt(g, 1500, TY + 62, 'Preparó: ' + (P.preparado || '—') + ' · Fecha: ' + (P.fecha || '') + ' · Estado: ' + P.estado, { size: 9 });
    rect(g, W - 260, TY + 14, 200, 60); txt(g, W - 160, TY + 36, 'Lámina', { size: 9, anchor: 'middle' }); txt(g, W - 160, TY + 62, cfgD.lamina || 'BMS-01', { size: 22, anchor: 'middle', bold: true });
    return svg;
  }

  BMS.pDiagrama = (root) => {
    const E = BMS.estado;
    E.diagrama = Object.assign({ lamina: 'BMS-01', awg: '16', licencias: true, colores: true, notas: '' }, E.diagrama || {});
    const D = E.diagrama;
    const campo = (rot, k, w) => h('label', { class: 'f' }, rot, h('input', { class: 'in', style: { width: w || '110px' }, value: D[k] || '', onchange: (e) => { D[k] = e.target.value; BMS.touch(); BMS.rerender(); } }));
    /* Visor con zoom (botones y Ctrl + rueda) y herramienta de mano para arrastrar la lámina. */
    const svg = construir(), HOJA = 2592;
    const visor = h('div', { class: 'diag' + (BMS.ui.mano === false ? '' : ' mano') }, svg);
    const pct = h('span', { class: 'mute', style: { minWidth: '48px', textAlign: 'center' } });
    function aplicarZoom(px, cx, cy) {
      const w0 = svg.getBoundingClientRect().width || px;
      const fx = (visor.scrollLeft + cx) / w0, fy = (visor.scrollTop + cy) / w0;
      const w1 = Math.max(600, Math.min(9000, Math.round(px)));
      BMS.ui.zoomPx = w1; svg.style.width = w1 + 'px'; svg.style.minWidth = '0'; svg.style.maxWidth = 'none';
      pct.textContent = Math.round(w1 / HOJA * 100) + ' %';
      visor.scrollLeft = fx * w1 - cx; visor.scrollTop = fy * w1 - cy;
    }
    const centro = () => [visor.clientWidth / 2, visor.clientHeight / 2];
    const zoomPor = (f) => { const [cx, cy] = centro(); aplicarZoom((BMS.ui.zoomPx || 1500) * f, cx, cy); };
    visor.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); const r = visor.getBoundingClientRect(); aplicarZoom((BMS.ui.zoomPx || 1500) * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    visor.addEventListener('pointerdown', (e) => {
      if (!visor.classList.contains('mano') || e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY, sl = visor.scrollLeft, st = visor.scrollTop;
      visor.setPointerCapture(e.pointerId); visor.classList.add('arr');
      const mover = (m) => { visor.scrollLeft = sl - (m.clientX - x0); visor.scrollTop = st - (m.clientY - y0); };
      const fin = () => { visor.classList.remove('arr'); visor.removeEventListener('pointermove', mover); visor.removeEventListener('pointerup', fin); visor.removeEventListener('pointercancel', fin); };
      visor.addEventListener('pointermove', mover); visor.addEventListener('pointerup', fin); visor.addEventListener('pointercancel', fin);
    });
    const btnMano = h('button', { class: 'b' + (BMS.ui.mano === false ? '' : ' p'), title: 'Mano: arrastre la lámina para moverla', onclick: () => { BMS.ui.mano = BMS.ui.mano === false; visor.classList.toggle('mano', BMS.ui.mano); btnMano.classList.toggle('p', BMS.ui.mano); } }, '✋ Mano');
    const barra = h('div', { class: 'fila noprint' },
      h('button', { class: 'b', title: 'Alejar', onclick: () => zoomPor(1 / 1.25) }, '− Zoom'), pct,
      h('button', { class: 'b', title: 'Acercar', onclick: () => zoomPor(1.25) }, '+ Zoom'),
      h('button', { class: 'b', title: 'Ajustar la lámina al ancho disponible', onclick: () => aplicarZoom((visor.clientWidth || 1500) - 2, 0, 0) }, 'Ajustar'),
      h('button', { class: 'b', title: 'Tamaño real de la lámina (100 %)', onclick: () => aplicarZoom(HOJA, 0, 0) }, '100 %'),
      btnMano, h('span', { class: 'mute', style: { fontSize: '12px' } }, 'Ctrl + rueda del mouse también hace zoom'));
    root.append(h('h2', null, 'Diagrama unifilar del sistema de monitoreo y control'),
      h('p', { class: 'hint' }, 'Lámina estándar Sinergia: servidor y LAN arriba, controlador principal a la izquierda, troncal con controladores secundarios y los equipos que cuelgan de cada uno, gateways con los equipos integrados, y abajo claves de cableado, simbología, notas y cajetín. Se dibuja solo con los datos del proyecto. Un punto rojo marca un controlador cuya selección no cubre los puntos.'),
      h('div', { class: 'fila noprint' }, campo('Lámina', 'lamina'), campo('Calibre señales (AWG)', 'awg', '80px'),
        h('label', { class: 'f' }, 'Licencias y servidor', h('select', { class: 'in', value: D.licencias ? '1' : '0', onchange: (e) => { D.licencias = e.target.value === '1'; BMS.touch(); BMS.rerender(); } }, h('option', { value: '1' }, 'Mostrar'), h('option', { value: '0' }, 'Ocultar'))),
        h('label', { class: 'f' }, 'Colores de cableado', h('select', { class: 'in', value: D.colores !== false ? '1' : '0', onchange: (e) => { D.colores = e.target.value === '1'; BMS.touch(); BMS.rerender(); } }, h('option', { value: '1' }, 'Por clave (como el plano)'), h('option', { value: '0' }, 'Blanco y negro'))),
        h('label', { class: 'f', style: { flex: '1', minWidth: '260px' } }, 'Nota 1 (si se deja vacía se usa la nota estándar de IP fijas)', h('input', { class: 'in', value: D.notas || '', onchange: (e) => { D.notas = e.target.value; BMS.touch(); BMS.rerender(); } }))),
      h('div', { class: 'fila noprint' },
        h('button', { class: 'b', onclick: () => { const c = svg.cloneNode(true); c.removeAttribute('style'); const x = new XMLSerializer().serializeToString(c); BMS.descargar('diagrama-unifilar-bms.svg', x, 'image/svg+xml'); } }, 'Descargar SVG'),
        h('button', { class: 'b', onclick: () => { const st = h('style', { id: 'pgprint' }, '@page { size: 36in 24in landscape; margin: 0 }'); document.head.append(st); window.print(); setTimeout(() => st.remove(), 1500); } }, 'Imprimir / PDF (36×24 in)'),
        h('button', { class: 'b p', onclick: () => BMS.ir('equipos') }, 'Siguiente: equipos por nivel →')),
      barra, visor);
    aplicarZoom(BMS.ui.zoomPx || 1500, 0, 0);
  };
})();
