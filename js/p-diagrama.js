/* Página 2: diagrama unifilar del sistema de monitoreo y control (BMS), lámina Sinergia.
   Se dibuja solo a partir de niveles, controladores y equipos. Formato según los diagramas base de Insumos
   (Diagrama Unifilar de BMS, Diagrama muestra, plano EB-6200). Los textos se pueden mover con la herramienta "Mover textos". */
(function () {
  const { h, cut } = BMS;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#111', GRIS = '#555', W = 2592;
  /* Colores del plano EB-6200: A BACnet IP, B BACnet MS/TP, C Modbus RTU, D señales, E Modbus TCP/IP */
  const COLOR = { A: '#ff9e7f', B: '#ff0000', C: '#00ffff', D: '#ff00ff', E: '#00ffff' };
  let coloresOn = true, cfg = {};
  const col = (k) => (coloresOn && COLOR[k]) || INK;

  /* ---- primitivas SVG ---- */
  const s = (tag, a, t) => {
    const e = document.createElementNS(NS, tag);
    for (const k in a || {}) if (a[k] != null) e.setAttribute(k, a[k]);
    if (t != null) e.textContent = t;
    return e;
  };
  const line = (g, x1, y1, x2, y2, o = {}) => g.append(s('line', { x1, y1, x2, y2, stroke: o.color || INK, 'stroke-width': o.w || 1, 'stroke-dasharray': o.dash }));
  const rect = (g, x, y, w, hh, o = {}) => g.append(s('rect', { x, y, width: w, height: hh, rx: o.r || 0, fill: o.fill || '#fff', stroke: o.stroke || INK, 'stroke-width': o.w || 1, 'stroke-dasharray': o.dash }));
  const txt = (g, x, y, t, o = {}) => g.append(s('text', { x, y, 'font-size': o.size || 9, 'font-weight': o.bold ? 700 : 400, 'text-anchor': o.anchor || 'start', fill: o.fill || INK }, String(t).toUpperCase()));
  const wrap = (t, n) => { const out = []; let cur = ''; String(t).split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); if (cur) out.push(cur); return out; };
  const para = (g, x, y, t, n, o = {}) => { const ls = wrap(t, n); ls.forEach((l, i) => txt(g, x, y + i * (o.lh || 11), l, o)); return ls.length; };
  const clave = (g, x, y, k) => { g.append(s('circle', { cx: x, cy: y, r: 8, fill: '#fff', stroke: INK, 'stroke-width': 1 })); txt(g, x, y + 3.5, k, { size: 10, anchor: 'middle' }); };
  const equipoX = (g, x, y, z = 12) => { rect(g, x, y, z, z, { w: 1.2 }); line(g, x, y, x + z, y + z); line(g, x + z, y, x, y + z); };
  const plug = (g, x, y) => { line(g, x, y, x + 12, y, { w: 1.2 }); line(g, x + 12, y - 6, x + 12, y + 6, { w: 1.8 }); line(g, x + 16, y - 6, x + 16, y + 6, { w: 1.8 }); line(g, x + 16, y, x + 22, y, { w: 1.2 }); };
  /* Grupo de texto movible: la posición se guarda en el proyecto (cfg.mv) y viaja con el SVG. */
  const mv = (g, key, fn) => {
    const sg = s('g', { 'data-mv': key }); const o = cfg.mv && cfg.mv[key];
    if (o) sg.setAttribute('transform', `translate(${o[0]} ${o[1]})`);
    g.append(sg); fn(sg);
  };

  /* ---- símbolos ---- */
  const simCP = (g, x, y, w = 128, hh = 64) => { rect(g, x, y, w, hh); rect(g, x + 6, y + 8, w - 12, hh - 16); [0.33, 0.66].forEach((f) => line(g, x + 6 + (w - 12) * f, y + 8, x + 6 + (w - 12) * f, y + hh - 8)); };
  const simCS = (g, x, y, w = 56, hh = 80, marco = true) => { if (marco) rect(g, x - 6, y - 6, w + 12, hh + 12, { stroke: '#bbb', w: 0.6 }); rect(g, x, y, w, hh); rect(g, x + 8, y + 8, w - 20, hh - 16); for (let i = 0; i < 7; i++) line(g, x + w - 10, y + 10 + i * 9, x + w - 4, y + 10 + i * 9); rect(g, x + 14, y + hh - 22, w - 32, 8); };
  const simGW = (g, x, y, w = 110) => { rect(g, x, y, w, 30, { r: 6 }); txt(g, x + w / 2, y + 19, 'GATEWAY', { size: 10, anchor: 'middle' }); };
  const simOtros = (g, x, y, w) => { rect(g, x, y, w, 24, { r: 5 }); txt(g, x + w / 2, y + 10, 'OTROS', { size: 7, anchor: 'middle' }); txt(g, x + w / 2, y + 19, 'EQUIPOS', { size: 7, anchor: 'middle' }); };
  const simPC = (g, x, y) => { rect(g, x, y, 56, 36); rect(g, x + 5, y + 5, 46, 26); rect(g, x - 6, y + 38, 68, 10); line(g, x + 10, y + 43, x + 50, y + 43); };
  const simNube = (g, x, y) => g.append(s('path', { d: `M${x} ${y + 40} q-22 0 -22 -22 q0 -22 26 -20 q8 -26 38 -18 q22 -14 42 6 q30 -4 30 24 q0 30 -34 30 z`, fill: '#fff', stroke: INK, 'stroke-width': 1 }));
  const simLaptop = (g, x, y) => { rect(g, x, y, 54, 34); line(g, x - 8, y + 40, x + 62, y + 40); line(g, x - 8, y + 40, x, y + 34); line(g, x + 62, y + 40, x + 54, y + 34); };
  const simPanel = (g, x, y, w = 70, hh = 40) => { rect(g, x, y, w, hh, { dash: '5 3', w: 0.9 }); rect(g, x + 14, y + 10, w - 28, 8, { w: 0.8 }); rect(g, x + 14, y + 24, w - 28, 8, { w: 0.8 }); };

  const NOTAS_BASE = 'Se debe coordinar con el departamento de informática las IP fijas requeridas en el sistema para los controladores que se comuniquen bajo el protocolo BACnet IP, Modbus TCP, entre otros.';

  function datos() {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc;
    const res = C.todo(), mot = C.motor(res, P.marca), M = BMS.catCt.marcas[P.marca];
    const det = {}; mot.detalle.forEach((d) => (det[d.c.id] = d));
    return { E, P, C, res, mot, M, det };
  }
  const etiqueta = (it) => {
    let n = it.tipo.nombre.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
    if (n.length > 34 && n.includes(' / ')) n = n.split(' / ')[0];
    return n;
  };
  /* El tag solo se muestra si aporta: no si es un prefijo de numeración (ACH-C-) ni si repite el nombre (UPS / UPS-01). */
  const tagUtil = (it, nom) => { const t = (it.tags[0] || '').trim(); if (!t || /-$/.test(t)) return ''; const w = nom.toUpperCase().split(' ')[0]; return t.toUpperCase().startsWith(w) || nom.toUpperCase().includes(t.toUpperCase()) ? '' : t; };

  /* Equipos cableados de un controlador agrupados por tipo. */
  function itemsCtrl(res, cid) {
    const g = new Map();
    res.filas.filter((f) => f.ctrlId === cid && f.tipo && f.eq.qty > 0 && !f.tipo.gw).forEach((f) => {
      const o = g.get(f.tipo.id) || { tipo: f.tipo, qty: 0, tags: [], t: BMS.calc.vacio() };
      o.qty += f.eq.qty; if (f.eq.tag) o.tags.push(f.eq.tag);
      ['ai', 'ao', 'di', 'do', 'int'].forEach((q) => (o.t[q] += f.t[q])); g.set(f.tipo.id, o);
    });
    return [...g.values()];
  }
  /* Gateways: BACnet IP y Modbus TCP entran por la red IP; Modbus RTU por gateway sobre la troncal. */
  function gateways(res, nivelDe) {
    const out = new Map();
    res.filas.filter((f) => f.tipo && f.tipo.gw && f.eq.qty > 0).forEach((f) => {
      let k = 'A';
      if (f.tipo.gw === 'GW-MODBUS') k = /RTU|Modbus \/ BACnet/i.test(f.tipo.pts.map((p) => p.ifc).join(' ')) ? 'C' : 'E';
      const id = f.tipo.gw + '|' + k;
      const o = out.get(id) || { gw: f.tipo.gw, clave: k, items: new Map(), host: {} };
      const it = o.items.get(f.tipo.id) || { tipo: f.tipo, qty: 0, ints: 0, niv: new Set() };
      it.qty += f.eq.qty; it.ints += f.t.int; const n = nivelDe(f.eq.nivel); if (n) it.niv.add(n.codigo); o.items.set(f.tipo.id, it);
      if (f.ctrlId) o.host[f.ctrlId] = (o.host[f.ctrlId] || 0) + f.t.int;
      out.set(id, o);
    });
    return [...out.values()].sort((a, b) => a.gw.localeCompare(b.gw) || a.clave.localeCompare(b.clave)).map((o) => {
      const hid = Object.keys(o.host).sort((a, b) => o.host[b] - o.host[a])[0];
      return { k: 'gw', gw: o.gw, clave: o.clave, items: [...o.items.values()], host: hid || null };
    });
  }

  function construir() {
    const { E, P, C, res, mot, M, det } = datos();
    cfg = E.diagrama; coloresOn = cfg.colores !== false; cfg.mv = cfg.mv || {};
    E.gabDim = E.gabDim || {};
    const trunk = cfg.troncal === 'A' || cfg.troncal === 'B' ? cfg.troncal : ((M && M.bus) || 'B');
    const COLW = 238, X0 = 330, PORFILA = 9, MAXIT = 8, ITH = 44, IT0 = 156, awg = cfg.awg || '16';
    const cps = E.controladores.filter((c) => c.tipo === 'CP');
    const principal = cps[0] || null;
    const nivIdx = (c) => { const n = C.nivelDe(c.nivel); return n ? E.niveles.indexOf(n) : 99; };
    const clv = (c) => (c.gab ? 'a' + c.gab : 'b' + c.tipo + String(c.consec).padStart(3, '0'));
    const resto = E.controladores.filter((c) => c !== principal).sort((a, b) => nivIdx(a) - nivIdx(b) || clv(a).localeCompare(clv(b)));
    const nodosC = resto.map((c) => ({ k: 'ctrl', c, gab: c.gab || '', its: itemsCtrl(res, c.id) }));
    const gws = gateways(res, C.nivelDe).map((g, i) => ({ ...g, n: i + 1 }));
    const nodosT = [...nodosC, ...gws.filter((g) => g.clave === 'C')];
    const nodosIP = gws.filter((g) => g.clave !== 'C');
    const itsP = principal ? itemsCtrl(res, principal.id) : [];
    const kmax = (n) => Math.min(n, MAXIT + 1);
    const altNodo = (n) => (n.k === 'ctrl' ? IT0 + kmax(n.its.length) * ITH + 20 : 220 + n.items.length * 36);

    /* filas de la troncal: un gabinete nunca se parte entre dos filas */
    const grupos = [];
    nodosT.forEach((n) => { const u = grupos[grupos.length - 1]; if (n.gab && u && u[0].gab === n.gab) u.push(n); else grupos.push([n]); });
    const filas = []; let cur = [];
    grupos.forEach((gr) => { if (cur.length && cur.length + gr.length > PORFILA) { filas.push({ nodes: cur }); cur = []; } cur.push(...gr); });
    if (cur.length || !filas.length) filas.push({ nodes: cur });
    for (let i = 0; i < nodosIP.length; i += PORFILA) filas.push({ nodes: nodosIP.slice(i, i + PORFILA), ip: true });

    const altP = 150 + kmax(itsP.length) * ITH;
    let y = 400;
    const pos = filas.map((f, i) => { const hh = Math.max(i === 0 ? altP : 80, ...f.nodes.map(altNodo), 120) + 90; const r = { busY: y + 50, hh }; y += hh; return r; });

    /* ---- leyendas (se miden antes para ajustar la altura de la hoja) ---- */
    const sb = M || { bases: [], modulos: [], motores: [] };
    const bom = mot.bom || {};
    const modTxt = (m) => m.cod + (m.desc ? ' — ' + cut(m.desc.replace(/\s*\[.*?\]/g, ''), 52) : '');
    const usados = (arr) => { const u = arr.filter((m) => bom[m.cod]); return (u.length ? u : arr.slice(0, 3)).map(modTxt).join(' / '); };
    const cpRef = mot.motor ? modTxt(mot.motor) : 'Por definir';
    const gwsUsados = [...new Set(gws.map((g) => g.gw))].join(', ');
    const protos = [
      ['A', 'UTP Cat 6a hasta salida de telecomunicaciones, en EMT o patch cord certificado de fábrica.', 'BACnet IP'],
      ['B', 'Cable multipar blindado Belden 9841 o superior en tubería EMT. En exteriores usar Belden 5502G1.', 'BACnet MS/TP'],
      ['C', 'Cable multipar blindado Belden 9841 o superior en tubería EMT. En exteriores usar Belden 5502G1.', 'Modbus RTU'],
      ['D', 'Cableado TFFN #' + awg + ' AWG en tubería EMT o multiconductor equivalente en tubería EMT. Cantidad según matriz I/O.', 'Señales analógicas y digitales'],
      ['E', 'UTP Cat 6a hasta salida de telecomunicaciones, en EMT o patch cord certificado de fábrica.', 'Modbus TCP/IP']];
    const simbs = [
      ['srv', 'Servidor y estación de monitoreo del BMS con interfaz web y software de administración. Ver requerimientos en notas y especificaciones técnicas.', 'Según especificaciones técnicas. Licencias por contratista de BMS.'],
      ['cp', 'Controlador principal / motor de red. Ver requerimientos en notas y en especificaciones técnicas. Entradas y salidas según aplicación; ver matriz I/O.', 'Igual o superior a ' + cpRef],
      ['cs', 'Controlador secundario de campo con accesorios compatibles con BACnet. Ver requerimientos en notas y en especificaciones técnicas. Entradas y salidas según aplicación; ver matriz I/O.', 'Igual o superior a ' + usados(sb.bases)],
      ['iom', 'Módulos de expansión de entradas y salidas del controlador. Ver requerimientos en notas y en especificaciones técnicas.', 'Igual o superior a ' + usados(sb.modulos)],
      ['gw', 'Gateway. Pasarela para interconectar protocolos y arquitecturas; debe ser ubicado dentro del gabinete del controlador más próximo.', gwsUsados ? 'Según equipo a integrar (' + gwsUsados + ')' : 'Según equipo a integrar'],
      ['pan', 'Gabinete (panel) para la instalación de los controladores y gateways. Controladores del mismo cuarto comparten gabinete (recuadro punteado). Dimensión indicada sobre cada panel.', 'NEMA 1 en interiores; NEMA 3R en zonas expuestas a la intemperie o cuartos mecánicos.'],
      ['spd', 'Módulo supresor de sobretensiones compatible con la aplicación; debe incluir adecuada conexión a tierra para descarga en conduit separado.', 'Igual o superior a PROT485. Modelo según aplicación.'],
      ['otros', 'Equipos suministrados e instalados por otros, con tarjetas de fábrica compatibles. Contratista de BMS debe incluir cableado, tubería, accesorios y programación necesarios para integrarlos. Ver notas y especificaciones.', ''],
      ['eq', 'Equipo o sensor cableado al controlador (señales analógicas y digitales, clave D).', '']];
    const hProt = protos.map((r) => Math.max(34, wrap(r[1], 70).length * 9.5 + 16));
    const hSimb = simbs.map((r) => Math.max(46, Math.max(wrap(r[1], 96).length, wrap(r[2], 58).length) * 9.5 + 16));
    const tTot = res.total, rv = C.conReserva(tTot, P.reserva);
    const notas = [(cfg.notas || NOTAS_BASE), 'UPS de 4 h para servidor y controladores; reserva de puntos del ' + P.reserva + ' % (dimensionamiento de controladores).',
      'Cantidades según matriz de puntos del proyecto. Los puntos por gateway (INT) no ocupan canales del controlador.',
      'Total del proyecto: AI ' + tTot.ai + ' · AO ' + tTot.ao + ' · DI ' + tTot.di + ' · DO ' + tTot.do + ' (' + C.cable(tTot) + ' cableados, ' + C.cable(rv) + ' con reserva) · INT ' + tTot.int + '.',
      'Marca de controladores: ' + P.marca + '. Selección de modelos según pestaña 5; validar con el integrador.',
      'Se debe suministrar un gabinete para cada controlador o grupo de controladores y gateways del mismo cuarto.'];
    const hNotas = notas.reduce((a, t) => a + wrap(t, 64).length * 10.5 + 7, 24);
    const legH = Math.max(52 + hProt.reduce((a, b) => a + b, 0), 36 + hSimb.reduce((a, b) => a + b, 0), hNotas);
    const yLeyenda = y + 10, H = Math.max(1100, Math.round(yLeyenda + legH + 150));

    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, xmlns: NS, role: 'img', 'aria-label': 'Diagrama unifilar del sistema de monitoreo y control (BMS)', 'font-family': 'Arial Narrow, Arial, Helvetica, sans-serif' });
    svg.append(s('rect', { width: W, height: H, fill: '#fff' }));
    const g = s('g'); svg.append(g);
    rect(g, 12, 12, W - 24, H - 24, { w: 0.6 });

    /* ---- zona superior: licencias, LAN, internet ---- */
    if (cfg.licencias) {
      rect(g, 120, 90, 300, 150, { dash: '5 4', w: 0.8 }); simPC(g, 242, 150);
      mv(g, 'lic1', (sg) => para(sg, 270, 56, 'Licencia para estación de monitoreo fija por contratista de BMS. Software workstation standar', 44, { anchor: 'middle', size: 9 }));
      line(g, 270, 240, 270, 270, { dash: '4 3', w: 0.8 });
      mv(g, 'lic2', (sg) => para(sg, 1040, 70, 'Licencia para servidor de clientes web (monitoreo remoto) por contratista de BMS. Software enterprise server solo requerido para dos o más automation server', 46, { anchor: 'middle', size: 9 }));
      rect(g, 1013, 160, 56, 36, { r: 3 }); line(g, 1040, 196, 1040, 270, { dash: '4 3', w: 0.8 });
      simNube(g, 2060, 235); txt(g, 2108, 262, 'INTERNET', { size: 12, anchor: 'middle' });
      simLaptop(g, 2340, 120); simLaptop(g, 2340, 200);
      line(g, 2290, 240, 2340, 215, { dash: '5 4', w: 0.8 }); line(g, 2290, 250, 2340, 150, { dash: '5 4', w: 0.8 });
      mv(g, 'lic3', (sg) => para(sg, 2400, 60, '2 licencias para estaciones remotas de monitoreo por contratista de BMS. Software workstation standar', 38, { anchor: 'middle', size: 9 }));
    }
    line(g, 40, 270, 2056, 270, { w: 2.4 });
    mv(g, 'lan', (sg) => txt(sg, 700, 262, 'LAN Ethernet Local Area Network (por otros)', { size: 14 }));

    /* ---- controlador principal ---- */
    const busIni = principal ? 192 : 60;
    const dimDe = (c) => E.gabDim[c.gab || c.id] || '';
    if (principal) {
      const d = det[principal.id], pBus = pos[0].busY;
      line(g, 108, 270, 108, pBus - 40, { w: 2.4, color: col('A') }); rect(g, 103, 330, 10, 10); clave(g, 128, 352, 'A');
      mv(g, 'to', (sg) => txt(sg, 140, 336, 'Salida de TO, ver láminas T-2XX (por otros)', { size: 9 }));
      line(g, 108, pBus - 40, 108, pBus + 10, { w: 2.4, color: col('A') });
      simCP(g, 44, pBus + 10);
      mv(g, 'cp:label', (sg) => { txt(sg, 120, pBus - 36, C.nombreCtrl(principal), { size: 12, bold: true }); txt(sg, 120, pBus - 24, 'Controlador', { size: 9 }); txt(sg, 120, pBus - 13, 'principal', { size: 9 }); if (dimDe(principal)) txt(sg, 44, pBus + 3, 'Panel ' + dimDe(principal), { size: 9, bold: true }); });
      plug(g, 20, pBus + 40); txt(g, 8, pBus + 66, '120 V,', { size: 7.5 }); txt(g, 8, pBus + 75, 'UPS', { size: 7.5 });
      mv(g, 'cp:info', (sg) => { txt(sg, 46, pBus + 92, mot.motor ? 'Motor de red ' + mot.motor.cod : 'Motor de red por definir', { size: 8.5 }); if (d && d.cfg.base) txt(sg, 46, pBus + 103, d.cfg.baseQty + '×' + d.cfg.base, { size: 8.5 }); });
      line(g, 172, pBus + 40, busIni + 20, pBus + 40, { w: 2.4, color: col(trunk) }); line(g, busIni + 20, pBus + 40, busIni + 48, pBus, { w: 2.4, color: col(trunk) });
      const kP = Math.min(itsP.length, MAXIT);
      if (kP) line(g, 62, pBus + 114, 62, pBus + 140 + (kP - 1) * ITH - 14, { w: 1.8, color: col('D') });
      itsP.slice(0, MAXIT).forEach((it, i) => dibujaItem(g, 62, pBus + 140 + i * ITH, it, 34, 'cp:i' + i));
      if (itsP.length > MAXIT) txt(g, 80, pBus + 140 + MAXIT * ITH, '+ ' + (itsP.length - MAXIT) + ' tipos de equipo más (ver matriz)', { size: 8, fill: GRIS });
    } else {
      rect(g, 44, pos[0].busY, 128, 50, { dash: '5 4' }); txt(g, 108, pos[0].busY + 28, 'Sin controlador principal', { size: 8.5, anchor: 'middle' });
    }

    /* ---- troncales y nodos ---- */
    filas.forEach((fila, ri) => {
      const { busY } = pos[ri], nodes = fila.nodes, n = nodes.length, kk = fila.ip ? 'A' : trunk;
      const xIni = ri === 0 && principal ? busIni + 48 : 40, xFin = n ? X0 + (n - 1) * COLW + 50 + 60 : xIni + 40;
      g.append(s('path', { d: `M${xIni} ${busY} ` + nodes.map((_, i) => { const c0 = X0 + i * COLW + 50; return `H${c0 - 16} L${c0} ${busY + 22} L${c0 + 16} ${busY}`; }).join(' ') + ` H${xFin}`, fill: 'none', stroke: col(kk), 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
      if (fila.ip) { mv(g, 'iplab' + ri, (sg) => txt(sg, 40, busY - 14, 'Red IP (LAN por otros) — BACnet/IP y Modbus TCP', { size: 9 })); clave(g, 280, busY, 'A'); }
      else if (ri > 0) { mv(g, 'trlab' + ri, (sg) => txt(sg, 40, busY - 14, 'Continúa troncal (fila ' + (ri + 1) + ')', { size: 9 })); clave(g, 280, busY, kk); }
      /* gabinetes con 2 o más controladores */
      if (!fila.ip) {
        let i = 0;
        while (i < n) {
          const nd = nodes[i]; let j = i;
          if (nd.k === 'ctrl' && nd.gab) { while (j + 1 < n && nodes[j + 1].k === 'ctrl' && nodes[j + 1].gab === nd.gab) j++; }
          if (j > i) {
            const x1 = X0 + i * COLW - 16, x2 = X0 + j * COLW + COLW - 34, hh = Math.max(...nodes.slice(i, j + 1).map(altNodo));
            rect(g, x1, busY - 58, x2 - x1, hh + 52, { dash: '6 4', w: 0.9, fill: 'none' });
            mv(g, 'gab:' + nd.gab, (sg) => { txt(sg, (x1 + x2) / 2, busY - 64, 'Gabinete ' + nd.gab + (dimDe(nd.c) ? ' — Panel ' + dimDe(nd.c) : ''), { size: 9, bold: true, anchor: 'middle' }); });
          }
          i = j + 1;
        }
      }
      nodes.forEach((nd, i) => {
        const x = X0 + i * COLW, xs = x + 22, cx = xs + 28;
        if (i > 0) clave(g, cx - COLW / 2, busY, kk);
        if (nd.k === 'ctrl') {
          const c = nd.c, d = det[c.id], t = d.t, esCP = c.tipo === 'CP', n1 = C.nivelDe(c.nivel);
          mv(g, 'n:' + c.id + ':tag', (sg) => {
            txt(sg, cx, busY - 8, C.nombreCtrl(c), { size: 11, bold: true, anchor: 'middle' });
            if (!nd.gab && dimDe(c)) txt(sg, cx, busY - 22, 'Panel ' + dimDe(c), { size: 8.5, bold: true, anchor: 'middle' });
          });
          simCS(g, xs, busY + 28);
          if (esCP) rect(g, xs + 22, busY + 42, 12, 8, { fill: '#000' });
          plug(g, x - 6, busY + 78); txt(g, x - 8, busY + 100, '120 V,', { size: 7.5 }); txt(g, x - 8, busY + 109, 'UPS', { size: 7.5 });
          mv(g, 'n:' + c.id + ':info', (sg) => {
            let yq = busY + 40; const L = (tt, o = {}) => { txt(sg, xs + 68, yq, tt, o); yq += 10.5; };
            L('Nivel ' + (n1 ? n1.codigo : '—'), { size: 9, bold: true });
            if (n1 && n1.nombre) L(cut(n1.nombre, 32), { size: 8 });
            L(`AI ${t.ai} · AO ${t.ao} · DI ${t.di} · DO ${t.do}`, { size: 8 });
            if (t.int) L(`INT ${t.int} (por gateway)`, { size: 7.5, fill: GRIS });
            L(d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base : 'Sin hardware', { size: 8 });
            const mods = Object.keys(d.cfg.modulos || {}).filter((k) => d.cfg.modulos[k]).map((k) => d.cfg.modulos[k] + '×' + k).join(' + ');
            const ls = wrap(mods, 30); ls.slice(0, 2).forEach((l, q) => L(q === 1 && ls.length > 2 ? l + ' …' : l, { size: 7.5, fill: GRIS }));
          });
          if (d.ev.falta) g.append(s('circle', { cx: xs + 62, cy: busY + 34, r: 5, fill: '#c00' }));
          const kC = Math.min(nd.its.length, MAXIT);
          if (kC) line(g, cx, busY + 114, cx, busY + IT0 + (kC - 1) * ITH - 14, { w: 1.8, color: col('D') });
          nd.its.slice(0, MAXIT).forEach((it, q) => dibujaItem(g, cx, busY + IT0 + q * ITH, it, 24, 'n:' + c.id + ':i' + q));
          if (nd.its.length > MAXIT) txt(g, cx + 38, busY + IT0 + MAXIT * ITH, '+ ' + (nd.its.length - MAXIT) + ' tipos más (ver matriz)', { size: 8, fill: GRIS });
        } else {
          const kid = 'g:' + nd.gw + nd.clave;
          mv(g, kid + ':tag', (sg) => txt(sg, cx, busY - 8, 'GW-' + nd.n, { size: 11, bold: true, anchor: 'middle' }));
          simGW(g, cx - 55, busY + 22);
          const host = nd.host ? E.controladores.find((c) => c.id === nd.host) : null;
          mv(g, kid + ':txt', (sg) => {
            txt(sg, cx, busY + 66, nd.gw + (nd.clave === 'E' ? ' (TCP)' : nd.clave === 'C' ? ' (RTU)' : ''), { size: 9, anchor: 'middle', bold: true });
            if (host) txt(sg, cx, busY + 77, 'Cerca de ' + C.nombreCtrl(host), { size: 7.5, anchor: 'middle', fill: GRIS });
          });
          line(g, cx, busY + 82, cx, busY + 100, { w: 1.8, color: col(nd.clave) }); clave(g, cx, busY + 100, nd.clave);
          g.append(s('path', { d: `M${cx} ${busY + 108} V${busY + 114} H${cx - 108} V${busY + 200} H${cx - 100}`, fill: 'none', stroke: col(nd.clave), 'stroke-width': 1.8, 'stroke-linejoin': 'round' }));
          mv(g, kid + ':para', (sg) => para(sg, cx, busY + 128, 'Contratista de BMS debe integrar estos equipos y velar porque sean compatibles con su solución (suministrados e instalados por otros)', 42, { size: 8, anchor: 'middle', lh: 9.5 }));
          rect(g, cx - 100, busY + 186, 200, 14 + nd.items.length * 36, { dash: '5 4', w: 0.8 });
          nd.items.forEach((it, q) => {
            const yy = busY + 196 + q * 36;
            simOtros(g, cx - 92, yy, 56);
            mv(g, kid + ':i' + q, (sg) => {
              txt(sg, cx - 30, yy + 9, cut(etiqueta(it) + (it.qty > 1 ? ' ×' + it.qty : ''), 27), { size: 8.5 });
              txt(sg, cx - 30, yy + 20, `INT ${it.ints}` + (it.niv.size ? ' · ' + [...it.niv].join(', ') : ''), { size: 7.5, fill: GRIS });
            });
          });
        }
      });
    });
    if (!nodosT.length && !nodosIP.length) txt(g, X0, pos[0].busY - 12, 'Agregue controladores en la pestaña 1 para completar la troncal', { size: 11, fill: '#c00' });
    if (res.sin.filas) txt(g, 44, yLeyenda - 6, '⚠ ' + res.sin.filas + ' filas de equipos sin controlador (' + C.cable(res.sin) + ' puntos): cree o asigne controladores', { size: 11, fill: '#c00', bold: true });

    /* ---- simbología de protocolos de comunicación (claves de cableado) ---- */
    const L0 = yLeyenda + 20, PX = 60, PW = 700;
    rect(g, PX, L0, PW, 52 + hProt.reduce((a, b) => a + b, 0));
    txt(g, PX + PW / 2, L0 + 24, 'Simbología de protocolos de comunicación', { size: 17, anchor: 'middle' });
    line(g, PX, L0 + 34, PX + PW, L0 + 34); line(g, PX, L0 + 52, PX + PW, L0 + 52);
    const cx1 = PX + 70, cx2 = PX + 480;
    txt(g, PX + 35, L0 + 47, 'Clave', { size: 9, anchor: 'middle' }); txt(g, (cx1 + cx2) / 2, L0 + 47, 'Capa física', { size: 9, anchor: 'middle' }); txt(g, (cx2 + PX + PW) / 2, L0 + 47, 'Capa de comunicación', { size: 9, anchor: 'middle' });
    let py = L0 + 52;
    protos.forEach((r, i) => {
      if (i) line(g, PX, py, PX + PW, py);
      clave(g, PX + 35, py + hProt[i] / 2 - 6, r[0]); line(g, PX + 12, py + hProt[i] / 2 + 8, PX + 58, py + hProt[i] / 2 + 8, { w: 2.6, color: col(r[0]) });
      para(g, cx1 + 8, py + 14, r[1], 70, { size: 8.5, lh: 9.5 }); para(g, cx2 + 8, py + 14, r[2], 34, { size: 8.5, lh: 9.5 });
      py += hProt[i];
    });
    line(g, cx1, L0 + 34, cx1, py); line(g, cx2, L0 + 34, cx2, py);

    /* ---- simbología de sistema de monitoreo y control, con los modelos de la marca ---- */
    const SX = 800, SW = 1180, sc1 = SX + 120, sc2 = SX + 800;
    rect(g, SX, L0, SW, 36 + hSimb.reduce((a, b) => a + b, 0));
    txt(g, SX + SW / 2, L0 + 24, 'Simbología de sistema de monitoreo y control — ' + (P.marca || ''), { size: 17, anchor: 'middle' });
    line(g, SX, L0 + 34, SX + SW, L0 + 34);
    let sy = L0 + 34;
    simbs.forEach((r, i) => {
      if (i) line(g, SX, sy, SX + SW, sy);
      const mid = sy + hSimb[i] / 2, cx0 = SX + 12;
      if (r[0] === 'srv') simPC(g, cx0 + 24, mid - 24);
      else if (r[0] === 'cp') simCP(g, cx0 + 6, mid - 16, 88, 32);
      else if (r[0] === 'cs') simCS(g, cx0 + 30, mid - 20, 36, 40);
      else if (r[0] === 'iom') { g.append(s('ellipse', { cx: cx0 + 48, cy: mid, rx: 20, ry: 12, fill: '#fff', stroke: INK })); txt(g, cx0 + 48, mid + 3.5, 'IOM', { size: 9, anchor: 'middle' }); }
      else if (r[0] === 'gw') simGW(g, cx0 + 8, mid - 15, 84);
      else if (r[0] === 'pan') simPanel(g, cx0 + 14, mid - 20, 70, 40);
      else if (r[0] === 'spd') { rect(g, cx0 + 28, mid - 11, 42, 22); txt(g, cx0 + 49, mid + 4, 'SPD', { size: 10, anchor: 'middle' }); }
      else if (r[0] === 'otros') simOtros(g, cx0 + 22, mid - 12, 56);
      else equipoX(g, cx0 + 36, mid - 9, 18);
      para(g, sc1 + 8, sy + 15, r[1], 96, { size: 8, lh: 9.5 }); para(g, sc2 + 8, sy + 15, r[2], 58, { size: 8, lh: 9.5 });
      sy += hSimb[i];
    });
    line(g, sc1, L0 + 34, sc1, sy); line(g, sc2, L0 + 34, sc2, sy);

    /* ---- notas ---- */
    mv(g, 'notas', (sg) => {
      const NX = 2040; txt(sg, NX, L0 + 14, 'Notas:', { size: 11, bold: true });
      let ny = L0 + 32;
      notas.forEach((t, i) => { const nl = para(sg, NX + 12, ny, (i + 1) + '. ' + t, 64, { size: 8.5, lh: 10.5 }); ny += nl * 10.5 + 7; });
    });

    /* ---- cajetín ---- */
    const TY = H - 110;
    line(g, 40, TY, W - 40, TY, { w: 1.2 });
    mv(g, 'cajetin', (sg) => {
      txt(sg, 70, TY + 46, 'Diagrama unifilar del sistema de monitoreo y control (BMS)', { size: 26 }); txt(sg, 72, TY + 66, 'Sin escala', { size: 12 });
      txt(sg, 1500, TY + 30, 'Proyecto: ' + (P.nombre || '—'), { size: 11, bold: true }); txt(sg, 1500, TY + 46, [P.propietario, P.ubicacion].filter(Boolean).join(' · '), { size: 9 });
      txt(sg, 1500, TY + 62, 'Preparó: ' + (P.preparado || '—') + ' · Fecha: ' + (P.fecha || '') + ' · Estado: ' + P.estado, { size: 9 });
    });
    rect(g, W - 260, TY + 14, 200, 60); txt(g, W - 160, TY + 36, 'Lámina', { size: 9, anchor: 'middle' }); txt(g, W - 160, TY + 62, cfg.lamina || 'BMS-01', { size: 22, anchor: 'middle', bold: true });
    return svg;
  }

  /* Una fila de equipo colgando del controlador: clave D (cableado) o A (equipo IP directo, solo puntos INT). */
  function dibujaItem(g, x, yy, it, n, key) {
    const directo = it.t.ai + it.t.ao + it.t.di + it.t.do === 0 && it.t.int > 0;
    clave(g, x + 18, yy - 22, directo ? 'A' : 'D');
    line(g, x, yy - 14, x + 14, yy, { w: 1.8, color: col(directo ? 'A' : 'D') }); equipoX(g, x + 14, yy - 9, 18);
    const nom = etiqueta(it) + (tagUtil(it, etiqueta(it)) ? ' ' + tagUtil(it, etiqueta(it)) : '') + (it.qty > 1 ? ' ×' + it.qty : '');
    const all = wrap(nom, n), ls = all.slice(0, 2);
    mv(g, key, (sg) => {
      ls.forEach((l, i) => txt(sg, x + 38, yy - 3 + i * 9.5, i === 1 && all.length > 2 ? cut(l, n) : l, { size: 8.5 }));
      txt(sg, x + 38, yy - 3 + ls.length * 9.5 + 1, directo ? `INT ${it.t.int} · red IP` : `AI ${it.t.ai} AO ${it.t.ao} DI ${it.t.di} DO ${it.t.do}`, { size: 7.5, fill: GRIS });
    });
  }

  BMS.pDiagrama = (root) => {
    const E = BMS.estado;
    E.diagrama = Object.assign({ lamina: 'BMS-01', awg: '16', licencias: true, colores: true, troncal: 'auto', notas: '', mv: {} }, E.diagrama || {});
    const D = E.diagrama;
    const campo = (rot, k, w) => h('label', { class: 'f' }, rot, h('input', { class: 'in', style: { width: w || '110px' }, value: D[k] || '', onchange: (e) => { D[k] = e.target.value; BMS.touch(); BMS.rerender(); } }));
    const sel = (rot, k, opts, val) => h('label', { class: 'f' }, rot, h('select', { class: 'in', value: val, onchange: (e) => { D[k] = k === 'licencias' || k === 'colores' ? e.target.value === '1' : e.target.value; BMS.touch(); BMS.rerender(); } }, opts.map(([v, t]) => h('option', { value: v }, t))));
    /* Visor con zoom (botones y Ctrl + rueda), mano para desplazar y mover textos. */
    const svg = construir(), VB = svg.viewBox.baseVal, HOJA = VB.width;
    BMS.ui.modo = BMS.ui.modo || 'mano';
    const visor = h('div', { class: 'diag ' + BMS.ui.modo }, svg);
    const pct = h('span', { class: 'mute', style: { minWidth: '48px', textAlign: 'center' } });
    function aplicarZoom(px, cx, cy) {
      const w0 = svg.getBoundingClientRect().width || px;
      const fx = (visor.scrollLeft + cx) / w0, fy = (visor.scrollTop + cy) / w0;
      const w1 = Math.max(500, Math.min(9000, Math.round(px)));
      BMS.ui.zoomPx = w1; svg.style.width = w1 + 'px'; svg.style.height = Math.round(w1 * VB.height / VB.width) + 'px'; svg.style.minWidth = '0'; svg.style.maxWidth = 'none';
      pct.textContent = Math.round(w1 / HOJA * 100) + ' %';
      visor.scrollLeft = fx * w1 - cx; visor.scrollTop = fy * w1 - cy;
    }
    const ajustar = () => { const w = (visor.clientWidth || 1400) - 4, hh = (visor.clientHeight || 700) - 4; aplicarZoom(Math.min(w, hh * VB.width / VB.height), 0, 0); visor.scrollLeft = 0; visor.scrollTop = 0; };
    const zoomPor = (f) => aplicarZoom((BMS.ui.zoomPx || 1500) * f, visor.clientWidth / 2, visor.clientHeight / 2);
    visor.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); const r = visor.getBoundingClientRect(); aplicarZoom((BMS.ui.zoomPx || 1500) * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    visor.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY;
      if (BMS.ui.modo === 'mano') {
        const sl = visor.scrollLeft, st = visor.scrollTop;
        visor.setPointerCapture(e.pointerId); visor.classList.add('arr');
        const mover = (m) => { visor.scrollLeft = sl - (m.clientX - x0); visor.scrollTop = st - (m.clientY - y0); };
        const fin = () => { visor.classList.remove('arr'); visor.removeEventListener('pointermove', mover); visor.removeEventListener('pointerup', fin); visor.removeEventListener('pointercancel', fin); };
        visor.addEventListener('pointermove', mover); visor.addEventListener('pointerup', fin); visor.addEventListener('pointercancel', fin);
      } else if (BMS.ui.modo === 'texto') {
        const gt = e.target.closest && e.target.closest('[data-mv]'); if (!gt) return;
        e.preventDefault(); const key = gt.getAttribute('data-mv'), k = svg.getBoundingClientRect().width / HOJA, o = D.mv[key] || [0, 0];
        visor.setPointerCapture(e.pointerId);
        const mover = (m) => gt.setAttribute('transform', `translate(${Math.round((o[0] + (m.clientX - x0) / k) * 10) / 10} ${Math.round((o[1] + (m.clientY - y0) / k) * 10) / 10})`);
        const fin = (m) => { D.mv[key] = [Math.round((o[0] + (m.clientX - x0) / k) * 10) / 10, Math.round((o[1] + (m.clientY - y0) / k) * 10) / 10]; BMS.touch(); visor.removeEventListener('pointermove', mover); visor.removeEventListener('pointerup', fin); };
        visor.addEventListener('pointermove', mover); visor.addEventListener('pointerup', fin);
      }
    });
    const modos = [['mano', '✋ Mano', 'Arrastre la lámina para desplazarla'], ['texto', '✥ Mover textos', 'Arrastre cualquier texto (rótulos, datos del controlador, nombres de equipos, notas) para acomodarlo']];
    const botones = modos.map(([m, t, tip]) => h('button', { class: 'b' + (BMS.ui.modo === m ? ' p' : ''), title: tip, onclick: () => { BMS.ui.modo = BMS.ui.modo === m && m === 'texto' ? 'mano' : m; visor.className = 'diag ' + BMS.ui.modo; botones.forEach((b, i) => b.classList.toggle('p', BMS.ui.modo === modos[i][0])); } }, t));
    const barra = h('div', { class: 'fila noprint' },
      h('button', { class: 'b', title: 'Alejar', onclick: () => zoomPor(1 / 1.25) }, '− Zoom'), pct,
      h('button', { class: 'b', title: 'Acercar', onclick: () => zoomPor(1.25) }, '+ Zoom'),
      h('button', { class: 'b', title: 'Ajustar la lámina completa a la zona visible', onclick: ajustar }, 'Ajustar'),
      h('button', { class: 'b', title: 'Tamaño real de la lámina (100 %)', onclick: () => aplicarZoom(HOJA, 0, 0) }, '100 %'),
      ...botones,
      h('button', { class: 'b', title: 'Devuelve todos los textos movidos a su posición original', onclick: () => { if (Object.keys(D.mv).length && !confirm('¿Devolver todos los textos movidos a su posición original?')) return; D.mv = {}; BMS.touch(); BMS.rerender(); } }, 'Restablecer textos'),
      h('span', { class: 'mute', style: { fontSize: '12px' } }, 'Ctrl + rueda del mouse también hace zoom'));
    root.append(h('h2', null, 'Diagrama unifilar del sistema de monitoreo y control'),
      h('p', { class: 'hint' }, 'Lámina estándar Sinergia, dibujada con los datos del proyecto. Entre controladores va la troncal (clave B, BACnet MS/TP); la red IP (clave A) llega solo al controlador principal y a los gateways BACnet/IP y Modbus TCP. Los controladores del mismo cuarto se agrupan en un gabinete (pestaña 1). Un punto rojo marca un controlador cuya selección no cubre los puntos.'),
      h('div', { class: 'fila noprint' }, campo('Lámina', 'lamina'), campo('Calibre señales (AWG)', 'awg', '80px'),
        sel('Troncal entre controladores', 'troncal', [['auto', 'Según la marca'], ['B', 'BACnet MS/TP (B)'], ['A', 'BACnet IP (A)']], D.troncal || 'auto'),
        sel('Licencias y servidor', 'licencias', [['1', 'Mostrar'], ['0', 'Ocultar']], D.licencias ? '1' : '0'),
        sel('Colores de cableado', 'colores', [['1', 'Por clave (como el plano)'], ['0', 'Blanco y negro']], D.colores !== false ? '1' : '0'),
        h('label', { class: 'f', style: { flex: '1', minWidth: '260px' } }, 'Nota 1 (vacía = nota estándar de IP fijas)', h('input', { class: 'in', value: D.notas || '', onchange: (e) => { D.notas = e.target.value; BMS.touch(); BMS.rerender(); } }))),
      h('div', { class: 'fila noprint' },
        h('button', { class: 'b', onclick: () => { const c = svg.cloneNode(true); c.removeAttribute('style'); BMS.descargar('diagrama-unifilar-bms.svg', new XMLSerializer().serializeToString(c), 'image/svg+xml'); } }, 'Descargar SVG'),
        h('button', { class: 'b', title: 'Archivo DXF para AutoCAD con capas por tipo de cableado. En AutoCAD use Guardar como… DWG.', onclick: () => { const c = svg.cloneNode(true); BMS.descargar('diagrama-unifilar-bms.dxf', BMS.svgADxf(c), 'application/dxf'); } }, 'Descargar DXF (AutoCAD / DWG)'),
        h('button', { class: 'b', onclick: () => { const st = h('style', { id: 'pgprint' }, '@page { size: 36in ' + Math.round(36 * VB.height / VB.width * 10) / 10 + 'in; margin: 0 }'); document.head.append(st); window.print(); setTimeout(() => st.remove(), 1500); } }, 'Imprimir / PDF (36 in de ancho)'),
        h('button', { class: 'b p', onclick: () => BMS.ir('equipos') }, 'Siguiente: equipos por nivel →')),
      barra, visor);
    if (BMS.ui.zoomPx) aplicarZoom(BMS.ui.zoomPx, 0, 0); else setTimeout(ajustar, 0);
  };
})();
