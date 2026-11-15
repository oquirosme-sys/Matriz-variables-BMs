/* Página 7: GRMS (sistema de gestión de habitaciones, INNCOM / Honeywell). Dispositivos por habitación, por pasillo y por nivel,
   diagramas de habitación, de nivel y de ascenso, integración al BMS (objetos BACnet y licencia) y exportación.
   Fuentes: planos ED-4102 a ED-4112 (modelos de habitación del Hotel Fairfield Guayabos), fichas INNCOM (e7, X47, MCM34, PC-502, B578),
   Generic Network Topologies (Deep Mesh) y selección ajustada del fabricante V3 (objetos BACnet del GRMS). */
(function () {
  const { h, num } = BMS;
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a, ...k) => { const e = document.createElementNS(NS, tag); Object.entries(a || {}).forEach(([n, v]) => e.setAttribute(n, v)); k.flat().forEach((x) => { if (x != null) e.append(x); }); return e; };
  const tx = (x, y, t, o) => { const e = sv('text', Object.assign({ x, y, 'font-size': 9, fill: '#1a1a1b' }, o || {})); e.textContent = t; return e; };
  const clone = (x) => JSON.parse(JSON.stringify(x));

  /* ---------- catálogo de dispositivos ---------- */
  const DISP = [
    { k: 'e7', parte: 'E7', nombre: 'Termostato INNCOM e7, 24 VAC, radio RF 802.15.4, con humedad y salida auxiliar 0-10 VDC', fuente: 'ED-4102; INNCOM e7 Datasheet (2021)' },
    { k: 'x45', parte: 'X45B-X06', nombre: 'Módulo de relés INNCOM X45B-X06: control maestro de iluminación y dampers, 5 relés', fuente: 'ED-4102' },
    { k: 'caja', parte: 'NSYCRN33200P', nombre: 'Caja de registro 300 × 300 × 200 mm para el módulo de relés', fuente: 'ED-4102' },
    { k: 'pir', parte: 'K594C / K594.RF', nombre: 'Sensor de movimiento PIR INNCOM K594C (12 VDC) o K594.RF de pared (inalámbrico, a batería)', fuente: 'ED-4102; Generic Thermostat Motion Sensor Design' },
    { k: 'puerta', parte: 'S241 / S541.RF', nombre: 'Contacto de puerta INNCOM S241 (cableado, empotrado) o S541.RF (transmisor inalámbrico)', fuente: 'ED-4102; Door Integration Brochure' },
    { k: 'pc502', parte: 'PC-502.4g', nombre: 'Repetidor RF / gateway S5bus-RF INNCOM PC-502.4g (solo donde el estudio de RF lo requiera)', fuente: 'PC-502.4g Datasheet v1.5' },
    { k: 'b578', parte: 'B578S', nombre: 'Edge router Deep Mesh B578 (personalidad S, PoE, montaje superficial) en el pasillo', fuente: 'B578 Datasheet; Generic Network Topologies' },
    { k: 'poe', parte: 'Switch PoE', nombre: 'Conmutador PoE de nivel, un puerto por B578 (suministrado por otros)', fuente: 'Generic Network Topologies (Typical Design)' },
    { k: 'ic3', parte: 'IC3 / INNcontrol', nombre: 'Servidor INNCOM (IC3 / INNcontrol) en el cuarto de IT, con interfaz BACnet/IP, PMS y cerradura', fuente: 'ED-4102 (notas); Selección V3 del fabricante' }
  ];
  const POR_HAB = ['e7', 'x45', 'caja', 'pir', 'puerta', 'pc502'];
  const TIPOS_BASE = [
    ['King ADA', 'ED-4102'], ['King ADA V2', 'ED-4103'], ['King Ducto L', 'ED-4104'], ['King Esquinero', 'ED-4105'], ['King Suite ADA', 'ED-4106'], ['King Suite Espejo', 'ED-4107'],
    ['Queen ADA', 'ED-4108'], ['Queen Espejo', 'ED-4109'], ['Queen Suite Espejo', 'ED-4110'], ['Queen Suite', 'ED-4111'], ['King Suite', 'ED-4112']
  ].map(([nombre, plano], i) => ({ id: 't' + (i + 1), nombre, plano, camas: /queen/i.test(nombre) ? 2 : 1, suite: /suite/i.test(nombre), e7: 1, x45: 1, caja: 1, pir: /suite/i.test(nombre) ? 2 : 1, puerta: 1, pc502: 0 }));
  const OBJ_BASE = [
    ['Set_Temp', 'AV-10', 'R/W'], ['Humidity', 'AV-16', 'R'], ['Room_Temp', 'AV-17', 'R'], ['Occupied', 'BI-3', 'R'], ['AC_Mode', 'MV-15', 'R/W'], ['Fan_Speed_Actual', 'MSI-44', 'R'],
    ['Heating_Valve_Actual', 'AV-41', 'R'], ['Cooling_Valve_Actual', 'AV-43', 'R'], ['Window_Open', 'BI-77', 'R'], ['Door_Open', 'BI-75', 'R'], ['Guest Satisfaction Alarm', 'BI-29', 'R'],
    ['Equip Satisfaction Alarm', 'BI-30', 'R'], ['Dirty Filter status', 'BI-42', 'R'], ['Eco Mode', 'BV-60', 'R'], ['Discharge_Air_Temp', 'AV-83', 'R'],
    ['Rented', 'BV-2', 'R/W', 'Lectura habilitada; escritura bloqueada desde el BMS salvo autorización de operación hotelera y PMS'], ['Light_Level', 'AV-53', 'R']
  ].map(([n, id, ac, nota]) => ({ n, id, ac, g: false, on: true, nota: nota || '' }))
    .concat([['Outside Air Temp', 'AV-93', 'R'], ['Peak Demand', 'MI-94', 'R/W'], ['Communicating Rooms', 'AV-95', 'R'], ['Rooms in Eco Mode', 'AV-96', 'R'], ['Percent Rooms in Eco Mode', 'AV-97', 'R'],
      ['Rooms Heating', 'AV-98', 'R'], ['Percent Rooms Heating', 'AV-99', 'R'], ['Rooms Cooling', 'AV-100', 'R'], ['Percent Rooms Cooling', 'AV-101', 'R']].map(([n, id, ac]) => ({ n, id, ac, g: true, on: true, nota: 'Dispositivo global 65999' })));
  const PARAM_BASE = { habsPorB578: 50, coberturaM: 60, reservaPoE: 20, puertosSwitch: 24, reservaLic: 30 };

  const G = () => {
    const E = BMS.estado;
    if (!E.grms) E.grms = { param: clone(PARAM_BASE), tipos: clone(TIPOS_BASE), niveles: {}, objetos: clone(OBJ_BASE) };
    const g = E.grms; g.param = Object.assign(clone(PARAM_BASE), g.param);
    if (!g.tipos || !g.tipos.length) g.tipos = clone(TIPOS_BASE);
    if (!g.objetos) g.objetos = clone(OBJ_BASE);
    return g;
  };
  const cfgNivel = (n) => {
    const g = G();
    const c = g.niveles[n.id] || (g.niveles[n.id] = { tipos: {}, pasillos: [{ id: BMS.uid(), nombre: 'Pasillo 1', largo: 60, habs: 0 }] });
    if (!c.pasillos.length) c.pasillos.push({ id: BMS.uid(), nombre: 'Pasillo 1', largo: 60, habs: 0 });
    if (c.pasillos.length === 1) c.pasillos[0].habs = Math.round(n.habs || 0);
    return c;
  };

  /* ---------- cálculo ---------- */
  function calcular() {
    const E = BMS.estado, g = G(), P = g.param;
    const niveles = E.niveles.map((n) => {
      const c = cfgNivel(n);
      const cant = {}; let suma = 0;
      g.tipos.forEach((t) => { const q = Math.max(0, Math.round(num(c.tipos[t.id]))); if (q) { cant[t.id] = q; suma += q; } });
      const habs = suma > 0 ? suma : Math.round(n.habs || 0);
      let sinTipo = 0;
      if (!suma && habs && g.tipos[0]) { cant[g.tipos[0].id] = habs; sinTipo = habs; }
      const exceso = 0;
      const disp = {}; POR_HAB.forEach((k) => { disp[k] = g.tipos.reduce((a, t) => a + (cant[t.id] || 0) * num(t[k]), 0); });
      const pas = c.pasillos.map((p) => ({ ...p, habs: Math.max(0, Math.round(num(p.habs))), largo: Math.max(0, num(p.largo)), b578: 0 }));
      pas.forEach((p) => { p.b578 = p.habs > 0 ? Math.max(1, Math.ceil(p.largo / Math.max(1, P.coberturaM))) : 0; });
      const porCap = Math.ceil(habs / Math.max(1, P.habsPorB578));
      let b578 = pas.reduce((a, p) => a + p.b578, 0);
      if (b578 < porCap && pas.length) { const pm = pas.reduce((a, p) => (p.habs > a.habs ? p : a), pas[0]); pm.b578 += porCap - b578; b578 = porCap; }
      const puertos = Math.ceil(b578 * (1 + P.reservaPoE / 100)), switches = Math.ceil(puertos / Math.max(1, P.puertosSwitch));
      const sumaP = pas.reduce((a, p) => a + p.habs, 0);
      return { n, c, habs, cant, sinTipo, exceso, disp, pas, b578, puertos, switches, avisoPas: sumaP !== habs, sumaP };
    }).filter((l) => l.habs > 0);
    const tot = { habs: 0, b578: 0, puertos: 0, switches: 0 }; POR_HAB.forEach((k) => { tot[k] = 0; });
    niveles.forEach((l) => { tot.habs += l.habs; tot.b578 += l.b578; tot.puertos += l.puertos; tot.switches += l.switches; POR_HAB.forEach((k) => { tot[k] += l.disp[k]; }); });
    const hab = g.objetos.filter((o) => !o.g && o.on).length, glo = g.objetos.filter((o) => o.g && o.on).length;
    const f = 1 + P.reservaLic / 100;
    const devices = tot.habs ? tot.habs + 1 : 0, puntos = tot.habs * hab + (tot.habs ? glo : 0);
    const devRes = Math.ceil(devices * f), ptsRes = Math.ceil(puntos * f);
    const Mh = BMS.catCt.marcas.Honeywell, L = Mh && Mh.licencias;
    const nucleo = L ? [...L.nucleo].sort((a, b) => a.ptsGlobal - b.ptsGlobal).find((x) => x.disp >= devRes && x.ptsGlobal >= ptsRes) || null : null;
    const bom = [];
    if (tot.habs) {
      DISP.forEach((d) => {
        const q = POR_HAB.includes(d.k) ? tot[d.k] : d.k === 'b578' ? tot.b578 : d.k === 'poe' ? tot.puertos : d.k === 'ic3' ? 1 : 0;
        if (q) bom.push({ ...d, cant: q, unidad: d.k === 'poe' ? 'puertos (' + tot.switches + ' switch de ' + P.puertosSwitch + ')' : 'u' });
      });
    }
    return { niveles, tot, hab, glo, devices, puntos, devRes, ptsRes, nucleo, bom, P };
  }

  /* ---------- diagramas ---------- */
  const PALETA = ['#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2', '#ede9fe', '#cffafe', '#ffedd5', '#e5e7eb', '#fce7f3', '#d9f99d', '#bae6fd'];
  const colorTipo = (id) => PALETA[(G().tipos.findIndex((t) => t.id === id) + PALETA.length) % PALETA.length];
  const marco = (W, H) => sv('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' });

  /* Esquema de conexión de la habitación (como en el plano ED-4102): termostato, módulo de relés y sus salidas, FCU con válvula 24 V y gateway B578 */
  function esquemaHabitacion(sg, x, y, t) {
    const g = sv('g', { transform: `translate(${x},${y})` });
    const T = (px, py, txt, o) => g.append(tx(px, py, txt, Object.assign({ 'font-size': 7 }, o || {})));
    const R = (rx, ry, w, hh, o) => g.append(sv('rect', Object.assign({ x: rx, y: ry, width: w, height: hh, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1 }, o || {})));
    const Ln = (x1, y1, x2, y2, o) => g.append(sv('line', Object.assign({ x1, y1, x2, y2, stroke: '#1a1a1b', 'stroke-width': 1 }, o || {})));
    g.append(tx(0, -6, 'ESQUEMA DE CONEXIÓN DE LA HABITACIÓN', { 'font-weight': 700, 'font-size': 9 }));
    T(0, 30, 'TERMOSTATO INNCOM E7'); Ln(30, 34, 30, 60, { 'marker-end': '' }); Ln(30, 60, 27, 54); Ln(30, 60, 33, 54);
    R(16, 62, 28, 28); T(30, 82, 'T', { 'text-anchor': 'middle', 'font-size': 16 });
    Ln(44, 76, 118, 76); g.append(sv('circle', { cx: 68, cy: 76, r: 8, fill: '#fff', stroke: '#1a1a1b' })); T(68, 79, 'A', { 'text-anchor': 'middle', 'font-size': 9 });
    R(100, 2, 218, 104);
    T(106, 14, 'CAJA REGISTRO 300X300X200', { 'font-weight': 700 }); T(106, 24, 'NSYCRN33200P', { 'font-weight': 700 }); T(106, 34, 'MODULO RELAYS INNCOM X45B-X06', { 'font-weight': 700 });
    R(118, 62, 28, 28);
    Ln(318, 14, 326, 14, { stroke: '#b42318' });
    T(326, 8, 'CONEXIÓN HACIA MÓDULO DE RELÉS', { 'font-size': 6.5 });
    Ln(326, 12, 326, 92, { stroke: '#1a1a1b' });
    [['RELAY DE ILUMINACIÓN', 14], ['DAMPER ZRT', 30], ['DAMPER DF', 46], ['CONTACTO PUERTA S541.RF/S241', 62], ['K594C MINI PIR MOTION SENSOR', 78]].forEach(([n, ly]) => { Ln(318, ly + 5, 332, ly + 5, { stroke: '#b42318' }); R(332, ly - 1, 118, 13); T(336, ly + 8, n, { 'font-size': 6 }); });
    /* termostato a FCU */
    Ln(30, 90, 30, 120); g.append(sv('circle', { cx: 30, cy: 124, r: 8, fill: '#fff', stroke: '#1a1a1b' })); T(30, 127, 'A', { 'text-anchor': 'middle', 'font-size': 9 });
    Ln(30, 132, 30, 150); Ln(30, 150, 150, 150); Ln(30, 166, 150, 166); Ln(30, 150, 30, 166);
    [150, 166].forEach((ly) => { g.append(sv('polygon', { points: `118,${ly - 4} 126,${ly + 4} 126,${ly - 4} 118,${ly + 4}`, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 0.9 })); });
    R(150, 140, 100, 36, { fill: '#fff' }); R(154, 144, 92, 28, { fill: 'none', 'stroke-width': 0.7 }); T(200, 162, 'FCU-HAB', { 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 700 });
    T(0, 190, '24 V VÁLVULA DE AGUA HELADA DESDE'); T(0, 199, 'TERMOSTATO O DEL EQUIPO DE HVAC');
    /* gateway */
    R(270, 150, 26, 26); T(283, 168, 'G', { 'text-anchor': 'middle', 'font-size': 14 });
    T(304, 156, 'GATEWAY B578 UBICADO EN', { 'font-size': 6.5 }); T(304, 165, 'PASILLO DE CADA NIVEL', { 'font-size': 6.5 }); T(304, 174, 'ALIMENTADO DESDE SWITCH POE', { 'font-size': 6.5 });
    sg.append(g);
  }

  /* Habitación sobre el plano real de BMS del modelo (ED-4102 a ED-4112): imagen en gris claro y los dispositivos en las posiciones de los símbolos del plano. */
  function svgHabitacionPlano(t, cant, pl) {
    const a = pl.a, one = (k) => (a[k] && a[k][0]) || null;
    const T = one('T'), ZRT = one('ZRT'), DF = one('DF'), FB = one('FB'), CRN = one('CRN'), V = one('V');
    const pts = ['T', 'ZRT', 'DF', 'CRN', 'V', 'LP'].flatMap((k) => (a[k] || []).map((p) => p[1])).concat(FB ? [FB[1]] : []);
    const y0 = Math.max(0, Math.min(...pts, pl.h) - 150), alto = pl.h - y0;
    const s = Math.min(470 / alto, 520 / pl.w), pw = pl.w * s, ph = alto * s;
    const OX = 30, OY = 52, W = Math.round(OX + pw + 30 + 460), H = Math.round(Math.max(OY + ph + 90, OY + 560));
    const X = (x) => OX + x * s, Y = (y) => OY + (y - y0) * s;
    const sg = sv('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, 'font-family': 'Arial, Helvetica, sans-serif' });
    const halo = { 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' };
    sg.append(marco(W, H), tx(OX, 28, 'HABITACIÓN TIPO ' + t.nombre.toUpperCase() + ' — ' + cant + ' hab. · plano ' + t.plano, { 'font-size': 14, 'font-weight': 700 }));
    const vp = sv('svg', { x: OX, y: OY, width: pw, height: ph, viewBox: `0 ${y0} ${pl.w} ${alto}`, overflow: 'hidden' });
    vp.append(sv('image', { href: pl.img, x: 0, y: 0, width: pl.w, height: pl.h, preserveAspectRatio: 'none' }));
    sg.append(sv('rect', { x: OX, y: OY, width: pw, height: ph, fill: 'none', stroke: '#9ca3af' }), vp);
    const dev = (p, letra, etiq, o) => { sg.append(sv('circle', Object.assign({ cx: X(p[0]), cy: Y(p[1]), r: 10, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.6 }, o || {})), tx(X(p[0]), Y(p[1]) + 3.5, letra, { 'text-anchor': 'middle', 'font-weight': 700 })); if (etiq) sg.append(tx(X(p[0]) + 14, Y(p[1]) + 3.5, etiq, Object.assign({ 'font-size': 8.5 }, halo))); };
    const lin = (p, q, o) => sg.append(sv('line', Object.assign({ x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), stroke: '#1a1a1b', 'stroke-width': 1.2 }, o || {})));
    /* posiciones derivadas de los símbolos del plano */
    const cen = ZRT && DF ? [(ZRT[0] + DF[0]) / 2, (ZRT[1] + DF[1]) / 2] : null;
    const signo = CRN && cen ? (CRN[0] > cen[0] ? 1 : -1) : 1;
    const X45 = cen ? [cen[0] + signo * 40, cen[1] - 58] : (CRN ? [CRN[0] - 49, CRN[1] + 70] : null);
    const BA = cen ? [cen[0] - signo * 15, cen[1] + 60] : null;
    const c = (a.C || []).find((q) => V && Math.abs(q[0] - V[0]) < 30 && Math.abs(q[1] - V[1]) < 30) || (a.C || [])[0] || null;
    const door = c || V;
    const bed = T ? [pl.w * 0.5, Math.max(y0 + 60, T[1] - 170)] : null;
    const bB = door ? [door[0] + 40, pl.h + 10] : [pl.w * 0.5, pl.h + 10];
    /* cableado y señales */
    if (T && BA && num(t.pir) > 0) lin(BA, T, { stroke: '#0b6bcb', 'stroke-width': 1.4 });
    if (T && X45) lin(T, X45, { stroke: '#b42318' });
    if (X45 && door) lin(door, X45, { stroke: '#667085', 'stroke-dasharray': '4 3' });
    if (T && FB) lin(T, [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2], { stroke: '#1b7f3b', 'stroke-width': 1.4 });
    if (T) sg.append(sv('line', { x1: X(T[0]), y1: Y(T[1]), x2: X(bB[0]), y2: Math.min(OY + ph + 40, Y(bB[1])), stroke: '#7c3aed', 'stroke-dasharray': '6 4', 'stroke-width': 1.4 }));
    /* símbolos */
    if (FB) sg.append(sv('rect', { x: X(FB[0]), y: Y(FB[1]), width: (FB[2] - FB[0]) * s, height: (FB[3] - FB[1]) * s, fill: 'none', stroke: '#1b7f3b', 'stroke-width': 2 }), tx(X(FB[0]) + 3, Y(FB[1]) - 3, 'FCU-HAB', Object.assign({ 'font-size': 8.5, 'font-weight': 700, fill: '#1b7f3b' }, halo)));
    [ZRT && ['ZRT', ZRT], DF && ['DF', DF]].filter(Boolean).forEach(([n2, p]) => sg.append(sv('rect', { x: X(p[0]) - 12, y: Y(p[1]) - 7, width: 24, height: 14, fill: '#fff', stroke: '#b42318', 'stroke-width': 1.2 }), tx(X(p[0]), Y(p[1]) + 3, n2, { 'text-anchor': 'middle', 'font-size': 8, fill: '#b42318' })));
    if (X45) { sg.append(sv('rect', { x: X(X45[0]) - 22, y: Y(X45[1]) - 14, width: 44, height: 28, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.6 }), tx(X(X45[0]), Y(X45[1]) - 2, 'X45B', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }), tx(X(X45[0]), Y(X45[1]) + 9, 'X06', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 })); }
    if (T) dev(T, 'T', 'e7');
    if (BA && num(t.pir) > 0) dev(BA, 'S', 'K594C (baño)', { 'stroke-dasharray': '3 2' });
    if (bed && num(t.pir) > 1) dev(bed, 'S', 'K594.RF (dormitorio)');
    if (bed && num(t.pir) === 1 && !BA) dev(bed, 'S', 'K594.RF');
    if (door) dev(door, 'C', 'S241 / S541.RF', { r: 9 });
    sg.append(sv('rect', { x: X(bB[0]) - 30, y: Math.min(OY + ph + 40, Y(bB[1])) - 6, width: 60, height: 26, fill: '#ede9fe', stroke: '#7c3aed', 'stroke-width': 1.5 }), tx(X(bB[0]), Math.min(OY + ph + 40, Y(bB[1])) + 11, 'G · B578', { 'text-anchor': 'middle', 'font-weight': 700, fill: '#5b21b6' }), tx(X(bB[0]) + 36, Math.min(OY + ph + 40, Y(bB[1])) + 11, 'pasillo del nivel', { 'font-size': 8, fill: '#667085' }));
    /* leyenda */
    const lx = OX + pw + 30; let y = OY + 6;
    sg.append(tx(lx, y, 'DISPOSITIVOS POR HABITACIÓN', { 'font-weight': 700 })); y += 18;
    const fila = (cc, tt) => { sg.append(tx(lx, y, cc, { 'font-weight': 700 }), tx(lx + 30, y, tt)); y += 15; };
    fila(num(t.e7) + '×', 'Termostato e7 (T) con humedad');
    fila(num(t.x45) + '×', 'Módulo X45B-X06 + caja NSYCRN33200P');
    fila(num(t.pir) + '×', 'Sensor de movimiento (S)');
    fila(num(t.puerta) + '×', 'Contacto de puerta (C)');
    if (num(t.pc502)) fila(num(t.pc502) + '×', 'Repetidor PC-502.4g');
    fila('1×', 'Damper de extracción (ZRT)* y aire fresco (DF)*');
    fila('1×', 'FCU-HAB y válvula de agua helada 24 V*');
    sg.append(tx(lx, y + 4, '* suministrado por otros', { 'font-size': 8, fill: '#667085' })); y += 28;
    sg.append(tx(lx, y, 'NOTAS', { 'font-weight': 700 })); y += 14;
    ['Plano de fondo: ' + t.plano + ' (BMS). Los símbolos T, X45B,', 'ZRT, DF, FCU y C siguen la ubicación del plano.', 'Los sensores de movimiento van en ubicación', 'indicativa: coordinar con los registros de equipos.', 'Integración con PMS, BMS/BAS y cerradura:', 'la interfaz va incluida en la licencia.', 'B578 en el pasillo de cada nivel, alimentado', 'desde switch PoE; a 1.8 m (6 ft) o más de un', 'punto de acceso Wi-Fi y fuera de gabinete metálico.'].forEach((t2) => { sg.append(tx(lx, y, t2, { 'font-size': 8.5 })); y += 11.5; });
    esquemaHabitacion(sg, lx, y + 26, t);
    return sg;
  }

  function svgHabitacion(t, cant) {
    const pl = (window.BMS_GRMS_PLANTAS || {})[t.plano];
    if (pl) return svgHabitacionPlano(t, cant, pl);
    const W = 800, H = 520, s = sv('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, 'font-family': 'Arial, Helvetica, sans-serif' });
    const L = (x1, y1, x2, y2, o) => sv('line', Object.assign({ x1, y1, x2, y2, stroke: '#1a1a1b', 'stroke-width': 1 }, o || {}));
    s.append(marco(W, H), tx(40, 28, 'HABITACIÓN TIPO ' + t.nombre.toUpperCase() + ' — ' + cant + ' hab.' + (t.plano ? ' · plano ' + t.plano : ''), { 'font-size': 14, 'font-weight': 700 }));
    /* planta */
    s.append(sv('rect', { x: 40, y: 50, width: 500, height: 360, fill: 'none', stroke: '#1a1a1b', 'stroke-width': 2 }));
    s.append(sv('rect', { x: 40, y: 50, width: 150, height: 150, fill: '#f3f4f6', stroke: '#1a1a1b' }), tx(115, 130, 'BAÑO', { 'text-anchor': 'middle', fill: '#667085' }));
    const camas = t.camas === 2 ? [[300, 70, 100, 140], [420, 70, 100, 140]] : [[330, 70, 170, 150]];
    camas.forEach(([x, y, w, hh]) => s.append(sv('rect', { x, y, width: w, height: hh, fill: '#f9fafb', stroke: '#667085' }), tx(x + w / 2, y + hh / 2, t.camas === 2 ? 'QUEEN' : 'KING', { 'text-anchor': 'middle', fill: '#667085' })));
    if (t.suite) s.append(sv('rect', { x: 330, y: 250, width: 190, height: 100, fill: '#f9fafb', stroke: '#667085', 'stroke-dasharray': '4 3' }), tx(425, 305, 'SALA (SUITE)', { 'text-anchor': 'middle', fill: '#667085' }));
    s.append(sv('rect', { x: 60, y: 215, width: 120, height: 34, fill: '#eef2ff', stroke: '#1a1a1b' }), tx(120, 236, 'FCU-HAB', { 'text-anchor': 'middle', 'font-weight': 700 }));
    s.append(sv('rect', { x: 120, y: 405, width: 60, height: 10, fill: '#fff', stroke: '#fff' }), tx(150, 428, 'PUERTA', { 'text-anchor': 'middle', fill: '#667085' }));
    s.append(sv('rect', { x: 0, y: 440, width: 560, height: 56, fill: '#f3f4f6' }), tx(20, 470, 'PASILLO DEL NIVEL', { fill: '#667085' }));
    const dev = (x, y, letra, etiq, o) => { s.append(sv('circle', Object.assign({ cx: x, cy: y, r: 11, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.5 }, o || {})), tx(x, y + 3.5, letra, { 'text-anchor': 'middle', 'font-weight': 700 })); if (etiq) s.append(tx(x + 15, y + 3.5, etiq)); };
    /* cableado y señales */
    const E7 = [215, 340], X45 = [250, 275], PIR = [115, 85], DOOR = [150, 405], BR = [470, 462];
    s.append(L(PIR[0], PIR[1], E7[0], E7[1], { stroke: '#0b6bcb', 'stroke-width': 1.4 }), tx(150, 190, '3 conductores (entrada)', { fill: '#0b6bcb', 'font-size': 8 }));
    s.append(L(E7[0], E7[1], X45[0], X45[1], { stroke: '#b42318' }), tx(225, 305, 'a módulo de relés', { fill: '#b42318', 'font-size': 8 }));
    s.append(L(E7[0], E7[1], 120, 249, { stroke: '#1b7f3b', 'stroke-width': 1.4 }), tx(135, 330, 'válvula 24 V', { fill: '#1b7f3b', 'font-size': 8 }));
    s.append(L(DOOR[0], DOOR[1], X45[0], X45[1], { stroke: '#667085', 'stroke-dasharray': '4 3' }));
    s.append(L(E7[0], E7[1], BR[0], BR[1], { stroke: '#7c3aed', 'stroke-dasharray': '6 4', 'stroke-width': 1.4 }), tx(330, 410, 'RF 802.15.4 Deep Mesh', { fill: '#7c3aed', 'font-size': 8 }));
    s.append(sv('rect', { x: X45[0] - 24, y: X45[1] - 14, width: 48, height: 28, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.5 }), tx(X45[0], X45[1] - 2, 'X45B', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }), tx(X45[0], X45[1] + 9, 'X06', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }));
    s.append(tx(X45[0] + 30, X45[1] - 8, 'caja 300×300×200', { 'font-size': 8, fill: '#667085' }), tx(X45[0] + 30, X45[1] + 4, 'relés: iluminación,', { 'font-size': 8, fill: '#667085' }), tx(X45[0] + 30, X45[1] + 14, 'damper ZRT y DF', { 'font-size': 8, fill: '#667085' }));
    dev(E7[0], E7[1], 'T', 'e7');
    dev(PIR[0], PIR[1], 'S', null, { 'stroke-dasharray': '3 2' }); s.append(tx(PIR[0] + 14, PIR[1] + 3.5, 'K594C (cielo)'));
    if (num(t.pir) > 1) { dev(420, 300, 'S', 'K594.RF (sala)'); }
    if (num(t.pir) > 0 && !t.suite) { dev(470, 250, 'S', 'K594.RF (dormitorio)'); }
    dev(DOOR[0], DOOR[1], 'C', 'S241 / S541.RF', { r: 9 });
    s.append(sv('rect', { x: BR[0] - 28, y: BR[1] - 14, width: 56, height: 28, fill: '#ede9fe', stroke: '#7c3aed', 'stroke-width': 1.5 }), tx(BR[0], BR[1] + 4, 'G · B578', { 'text-anchor': 'middle', 'font-weight': 700, fill: '#5b21b6' }));
    /* leyenda */
    const lx = 575; let y = 60;
    s.append(tx(lx, y, 'DISPOSITIVOS POR HABITACIÓN', { 'font-weight': 700 })); y += 18;
    const fila = (c, tt) => { s.append(tx(lx, y, c, { 'font-weight': 700 }), tx(lx + 30, y, tt)); y += 15; };
    fila(num(t.e7) + '×', 'Termostato e7 (T) con humedad');
    fila(num(t.x45) + '×', 'Módulo X45B-X06 + caja NSYCRN33200P');
    fila(num(t.pir) + '×', 'Sensor de movimiento (S)');
    fila(num(t.puerta) + '×', 'Contacto de puerta (C)');
    if (num(t.pc502)) fila(num(t.pc502) + '×', 'Repetidor PC-502.4g');
    fila('1×', 'Damper de extracción (ZRT)* y aire fresco (DF)*');
    fila('1×', 'FCU-HAB y válvula de agua helada 24 V*');
    s.append(tx(lx, y + 4, '* suministrado por otros', { 'font-size': 8, fill: '#667085' })); y += 28;
    s.append(tx(lx, y, 'NOTAS', { 'font-weight': 700 })); y += 14;
    ['Ubicaciones finales: coordinar con los', 'registros de los equipos.', 'Integración con PMS, BMS/BAS y cerradura:', 'la interfaz va incluida en la licencia.', 'B578 en el pasillo de cada nivel,', 'alimentado desde switch PoE.', 'Cada B578 a 1.8 m (6 ft) o más de un', 'punto de acceso Wi-Fi y fuera de gabinete metálico.'].forEach((t2) => { s.append(tx(lx, y, t2, { 'font-size': 8.5 })); y += 11.5; });
    return s;
  }

  function svgNivel(l) {
    const g = G(), W = 900, H = 400, s = sv('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, 'font-family': 'Arial, Helvetica, sans-serif' });
    s.append(marco(W, H), tx(20, 24, 'NIVEL ' + (l.n.codigo || '') + ' — ' + (l.n.nombre || '') + ' · ' + l.habs + ' habitaciones · ' + l.b578 + ' B578 · ' + l.puertos + ' puertos PoE', { 'font-size': 13, 'font-weight': 700 }));
    const X0 = 190, X1 = 880, Y = 170;
    s.append(sv('rect', { x: 20, y: 120, width: 120, height: 110, fill: '#f3f4f6', stroke: '#1a1a1b' }), tx(80, 140, 'IDF / CUARTO', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }), tx(80, 152, 'DE TELECOM', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }));
    s.append(sv('rect', { x: 35, y: 165, width: 90, height: 30, fill: '#fff', stroke: '#1a1a1b' }), tx(80, 184, 'Switch PoE ×' + l.switches, { 'text-anchor': 'middle', 'font-size': 9 }));
    s.append(tx(80, 215, l.puertos + ' puertos', { 'text-anchor': 'middle', 'font-size': 8, fill: '#667085' }));
    s.append(sv('rect', { x: X0, y: Y - 14, width: X1 - X0, height: 28, fill: '#f3f4f6', stroke: '#9ca3af' }), tx(X0 + 6, Y + 4, 'PASILLO', { fill: '#667085', 'font-size': 9 }));
    s.append(sv('line', { x1: 125, y1: 180, x2: X1, y2: 180, stroke: '#b42318', 'stroke-width': 1.2, 'stroke-dasharray': '7 3 2 3' }), tx(X1 - 4, 196, 'CAT 6 desde el switch PoE', { 'text-anchor': 'end', 'font-size': 8, fill: '#b42318' }));
    const tot = Math.max(1, l.pas.reduce((a, p) => a + p.habs, 0)), ancho = X1 - X0;
    let x = X0, n = 0;
    const lista = []; g.tipos.forEach((t) => { for (let i = 0; i < (l.cant[t.id] || 0); i++) lista.push(t); });
    l.pas.forEach((p) => {
      const w = ancho * (p.habs / tot), cols = Math.ceil(p.habs / 2), cw = cols ? w / cols : w;
      for (let i = 0; i < p.habs; i++) {
        const col = Math.floor(i / 2), arriba = i % 2 === 0, t = lista[n] || g.tipos[0];
        const rx = x + col * cw + 1.5, ry = arriba ? 64 : 200;
        s.append(sv('rect', { x: rx, y: ry, width: Math.max(8, cw - 3), height: 70, fill: colorTipo(t && t.id), stroke: '#6b7280', 'stroke-width': 0.8 }));
        s.append(tx(rx + (cw - 3) / 2, ry + 28, String(n + 1).padStart(2, '0'), { 'text-anchor': 'middle', 'font-size': cw < 28 ? 7 : 9, 'font-weight': 700 }));
        s.append(sv('circle', { cx: rx + (cw - 3) / 2, cy: arriba ? ry + 62 : ry + 8, r: 3, fill: '#fff', stroke: '#1a1a1b' }));
        n++;
      }
      for (let k = 0; k < p.b578; k++) {
        const bx = x + w * (k + 0.5) / p.b578;
        s.append(sv('circle', { cx: bx, cy: Y, r: Math.min(ancho * (G().param.coberturaM / Math.max(l.pas.reduce((a, q) => a + q.largo, 0), G().param.coberturaM)) / 2, 150), fill: 'none', stroke: '#7c3aed', 'stroke-dasharray': '3 4', opacity: 0.35 }));
        s.append(sv('rect', { x: bx - 14, y: Y - 10, width: 28, height: 20, fill: '#ede9fe', stroke: '#7c3aed', 'stroke-width': 1.4 }), tx(bx, Y + 4, 'B578', { 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 700, fill: '#5b21b6' }));
      }
      s.append(tx(x + w / 2, 52, p.nombre + ' · ' + p.habs + ' hab. · ' + p.largo + ' m · ' + p.b578 + ' B578', { 'text-anchor': 'middle', 'font-size': 8.5, fill: '#374151' }));
      x += w;
    });
    let ly = 300; s.append(tx(20, ly, 'TIPOS DE HABITACIÓN', { 'font-weight': 700, 'font-size': 9 })); ly += 14; let lx = 20;
    g.tipos.filter((t) => l.cant[t.id]).forEach((t) => { s.append(sv('rect', { x: lx, y: ly - 9, width: 12, height: 12, fill: colorTipo(t.id), stroke: '#6b7280' }), tx(lx + 16, ly + 1, t.nombre + ' (' + l.cant[t.id] + ')', { 'font-size': 8.5 })); lx += 28 + t.nombre.length * 5 + 22; if (lx > 760) { lx = 20; ly += 16; } });
    ly += 28;
    s.append(tx(20, ly, 'POR NIVEL: ' + POR_HAB.filter((k) => l.disp[k]).map((k) => l.disp[k] + '× ' + DISP.find((d) => d.k === k).parte).join(' · ') + ' · ' + l.b578 + '× B578', { 'font-size': 8.5 }));
    s.append(tx(20, ly + 14, 'El número de B578 se calcula por capacidad y por cobertura RF; debe confirmarse con un estudio de RF (las losas de concreto no dejan pasar la señal).', { 'font-size': 8, fill: '#667085' }));
    return s;
  }

  function svgAscenso(c) {
    const f = c.niveles.slice().reverse(), W = 900, H = 150 + f.length * 52, s = sv('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, 'font-family': 'Arial, Helvetica, sans-serif' });
    s.append(marco(W, H), tx(20, 24, 'DIAGRAMA DE ASCENSO DEL GRMS (DEEP MESH)', { 'font-size': 13, 'font-weight': 700 }));
    s.append(sv('line', { x1: 150, y1: 50, x2: 150, y2: H - 100, stroke: '#b42318', 'stroke-width': 2 }), tx(158, 62, 'Cable CAT 6 de niveles al switch del MDF', { 'font-size': 8, fill: '#b42318' }));
    f.forEach((l, i) => {
      const y = 70 + i * 52;
      s.append(sv('rect', { x: 20, y: y - 20, width: 110, height: 36, fill: '#f3f4f6', stroke: '#1a1a1b' }), tx(75, y - 4, 'NIVEL ' + (l.n.codigo || ''), { 'text-anchor': 'middle', 'font-weight': 700 }), tx(75, y + 9, l.habs + ' hab.', { 'text-anchor': 'middle', 'font-size': 8, fill: '#667085' }));
      s.append(sv('rect', { x: 170, y: y - 18, width: 120, height: 32, fill: '#fff', stroke: '#1a1a1b' }), tx(230, y + 1, 'Switch PoE ×' + l.switches, { 'text-anchor': 'middle' }));
      s.append(sv('line', { x1: 150, y1: y - 2, x2: 170, y2: y - 2, stroke: '#b42318', 'stroke-width': 1.5 }));
      for (let k = 0; k < Math.min(l.b578, 12); k++) s.append(sv('rect', { x: 320 + k * 50, y: y - 16, width: 42, height: 26, fill: '#ede9fe', stroke: '#7c3aed' }), tx(341 + k * 50, y + 1, 'B578', { 'text-anchor': 'middle', 'font-size': 8, fill: '#5b21b6', 'font-weight': 700 }));
      s.append(sv('line', { x1: 290, y1: y - 2, x2: 320, y2: y - 2, stroke: '#b42318' }), tx(W - 20, y + 2, l.b578 + ' B578 · ' + l.puertos + ' puertos', { 'text-anchor': 'end', 'font-size': 8.5, fill: '#374151' }));
    });
    const y0 = H - 80;
    s.append(sv('rect', { x: 20, y: y0, width: 860, height: 60, fill: '#f9fafb', stroke: '#1a1a1b' }), tx(30, y0 + 16, 'MDF / CUARTO DE IT', { 'font-weight': 700 }));
    s.append(sv('rect', { x: 150, y: y0 + 24, width: 170, height: 28, fill: '#fff', stroke: '#1a1a1b' }), tx(235, y0 + 42, 'Switch del hotel (MDF)', { 'text-anchor': 'middle' }));
    s.append(sv('rect', { x: 400, y: y0 + 24, width: 170, height: 28, fill: '#ede9fe', stroke: '#7c3aed' }), tx(485, y0 + 42, 'Servidor INNCOM IC3', { 'text-anchor': 'middle', 'font-weight': 700 }));
    s.append(sv('rect', { x: 640, y: y0 + 24, width: 220, height: 28, fill: '#fff', stroke: '#1a1a1b' }), tx(750, y0 + 42, 'Advanced GRMS (BACnet/IP) → BMS', { 'text-anchor': 'middle' }));
    s.append(sv('line', { x1: 320, y1: y0 + 38, x2: 400, y2: y0 + 38, stroke: '#1a1a1b' }), sv('line', { x1: 570, y1: y0 + 38, x2: 640, y2: y0 + 38, stroke: '#1a1a1b' }));
    s.append(sv('line', { x1: 150, y1: H - 100, x2: 150, y2: y0 + 24, stroke: '#b42318', 'stroke-width': 2 }));
    return s;
  }

  /* ---------- utilidades de salida ---------- */
  const descargaSvg = (svg, nombre) => BMS.descargar(nombre + '.svg', '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg), 'image/svg+xml');
  const nodoPdf = (svg, ancho) => { const c = svg.cloneNode(true), vb = svg.viewBox.baseVal, w = ancho || 156, hh = w * vb.height / vb.width; c.setAttribute('width', w + 'mm'); c.setAttribute('height', hh.toFixed(2) + 'mm'); c.setAttribute('style', 'display:block;max-width:none;width:' + w + 'mm;height:' + hh.toFixed(2) + 'mm'); return c; };
  const tabla = (cols, filas, alin) => h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, cols.map((x) => h('th', null, x)))), h('tbody', null, filas.map((f) => h('tr', null, f.map((v, i) => h('td', { class: (alin && alin[i]) || '' }, v)))))));
  const filasNivel = (c) => c.niveles.map((l) => [l.n.codigo || '', l.habs, ...POR_HAB.map((k) => l.disp[k]), l.b578, l.puertos, l.switches]);
  const COLS_NIVEL = ['Nivel', 'Hab.', ...POR_HAB.map((k) => DISP.find((d) => d.k === k).parte), 'B578', 'Puertos PoE', 'Switch'];

  const exportarXlsx = async (c) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const wb = new ExcelJS.Workbook(), P = BMS.estado.proyecto;
    const hoja = (nombre, cols, filas, anchos) => {
      const ws = wb.addWorksheet(nombre); ws.addRow(cols).font = { bold: true };
      filas.forEach((f) => ws.addRow(f)); (anchos || []).forEach((w, i) => { ws.getColumn(i + 1).width = w; });
      ws.getRow(1).border = { bottom: { style: 'medium' } }; ws.views = [{ state: 'frozen', ySplit: 1 }];
    };
    hoja('Dispositivos por nivel', COLS_NIVEL, filasNivel(c).concat([['TOTAL', c.tot.habs, ...POR_HAB.map((k) => c.tot[k]), c.tot.b578, c.tot.puertos, c.tot.switches]]), [10, 8, 12, 12, 16, 14, 16, 12, 10, 12, 10]);
    const pas = []; c.niveles.forEach((l) => l.pas.forEach((p) => pas.push([l.n.codigo || '', p.nombre, p.habs, p.largo, p.b578])));
    hoja('Pasillos', ['Nivel', 'Pasillo', 'Habitaciones', 'Largo (m)', 'B578'], pas, [10, 24, 14, 12, 8]);
    const tp = []; G().tipos.forEach((t) => tp.push([t.nombre, t.plano, c.niveles.reduce((a, l) => a + (l.cant[t.id] || 0), 0), num(t.e7), num(t.x45), num(t.pir), num(t.puerta), num(t.pc502)]));
    hoja('Tipos de habitación', ['Tipo', 'Plano', 'Cantidad', 'e7', 'X45B-X06', 'Sensor de movimiento', 'Contacto de puerta', 'PC-502'], tp, [26, 12, 10, 8, 12, 20, 18, 10]);
    hoja('Lista de materiales', ['Número de parte', 'Descripción', 'Cantidad', 'Unidad', 'Fuente'], c.bom.map((b) => [b.parte, b.nombre, b.cant, b.unidad, b.fuente]), [20, 90, 10, 28, 50]);
    hoja('Objetos BACnet', ['Parámetro', 'Object ID', 'Acceso', 'Alcance', 'Incluido', 'Nota'], G().objetos.map((o) => [o.n, o.id, o.ac, o.g ? 'Global (65999)' : 'Por habitación', o.on ? 'Sí' : 'No', o.nota]), [30, 12, 10, 18, 10, 70]);
    const buf = await wb.xlsx.writeBuffer();
    BMS.descargar('GRMS_' + (P.nombre || 'proyecto').replace(/[^\w\-]+/g, '_') + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };

  const pdfGrms = (c) => {
    const P = BMS.estado.proyecto, g = G(), nodos = [];
    const sl = () => { const d = document.createElement('div'); d.className = 'pdf-salto'; return d; };
    nodos.push(h('h2', null, 'GRMS — dispositivos por habitación, pasillo y nivel'), h('p', null, 'Proyecto ' + (P.nombre || '—') + '. ' + c.tot.habs + ' habitaciones en ' + c.niveles.length + ' niveles, ' + c.tot.b578 + ' edge routers B578 y ' + c.tot.puertos + ' puertos PoE.'));
    nodos.push(h('h3', null, 'Dispositivos por nivel'), h('div', { class: 'pdf-tabla' }, tabla(COLS_NIVEL, filasNivel(c)).querySelector('table')));
    nodos.push(h('h3', null, 'Lista de materiales'), h('div', { class: 'pdf-tabla' }, tabla(['Parte', 'Descripción', 'Cant.'], c.bom.map((b) => [b.parte, b.nombre, b.cant])).querySelector('table')));
    nodos.push(sl(), h('h3', null, 'Diagrama de ascenso'), nodoPdf(svgAscenso(c)));
    g.tipos.filter((t) => c.niveles.some((l) => l.cant[t.id])).forEach((t) => nodos.push(sl(), nodoPdf(svgHabitacion(t, c.niveles.reduce((a, l) => a + (l.cant[t.id] || 0), 0)))));
    c.niveles.forEach((l) => nodos.push(sl(), nodoPdf(svgNivel(l))));
    return BMS.imprimirPaginado({ nombre: 'GRMS', titulo: 'GRMS ' + (P.nombre || ''), nodos });
  };

  /* ---------- pantalla ---------- */
  BMS.pGrms = (root) => {
    sincronizar();
    const E = BMS.estado, g = G(), c = calcular(), P = g.param;
    const guarda = () => { sincronizar(); BMS.touch(); BMS.rerender(); };
    const nin = (v, f, min) => h('input', { class: 'in n', type: 'number', min: min == null ? 0 : min, value: v, style: { width: '74px' }, onchange: (e) => f(Math.max(min == null ? 0 : min, num(e.target.value))) });
    const vista = BMS.ui.grms || (BMS.ui.grms = { tipo: g.tipos[0] && g.tipos[0].id, nivel: c.niveles[0] && c.niveles[0].n.id });

    root.append(h('h2', null, 'GRMS — gestión de habitaciones (INNCOM / Honeywell)'),
      h('p', { class: 'hint' }, 'Dispositivos por habitación, por pasillo y por nivel, diagramas de habitación, de nivel y de ascenso, e integración al BMS por BACnet/IP. La cantidad y el tipo de habitaciones de cada nivel se definen aquí; este módulo es la fuente del total de habitaciones que debe considerar el controlador principal. Los modelos de habitación y sus dispositivos parten de los planos ED-4102 a ED-4112 y de las fichas INNCOM; ajuste lo que difiera en obra.'));

    /* parámetros */
    root.append(h('div', { class: 'card' }, h('div', { class: 'grid' },
      h('label', { class: 'f' }, 'Habitaciones por B578 (capacidad)', nin(P.habsPorB578, (v) => { P.habsPorB578 = v || 1; guarda(); }, 1)),
      h('label', { class: 'f' }, 'Cobertura RF de un B578 en pasillo (m)', nin(P.coberturaM, (v) => { P.coberturaM = v || 1; guarda(); }, 1)),
      h('label', { class: 'f' }, 'Reserva de puertos PoE (%)', nin(P.reservaPoE, (v) => { P.reservaPoE = v; guarda(); })),
      h('label', { class: 'f' }, 'Puertos por switch PoE', nin(P.puertosSwitch, (v) => { P.puertosSwitch = v || 1; guarda(); }, 1)),
      h('label', { class: 'f' }, 'Reserva para licencia (%)', nin(P.reservaLic, (v) => { P.reservaLic = v; guarda(); })))),
      h('p', { class: 'hint' }, 'Diseño típico del fabricante: 1 B578 por cada 50 habitaciones y por nivel, porque las losas no dejan pasar la señal RF. La cobertura en pasillo (100 ft ≈ 30 m de alcance por lado) es un valor de referencia: confirme con un estudio de RF.'));

    /* tipos de habitación */
    const filasT = g.tipos.map((t, i) => h('tr', null,
      h('td', null, h('input', { class: 'in', value: t.nombre, style: { width: '150px' }, onchange: (e) => { t.nombre = e.target.value; guarda(); } })),
      h('td', null, h('input', { class: 'in', value: t.plano || '', style: { width: '80px' }, onchange: (e) => { t.plano = e.target.value; guarda(); } })),
      ['e7', 'x45', 'caja', 'pir', 'puerta', 'pc502'].map((k) => h('td', { class: 'c' }, nin(num(t[k]), (v) => { t[k] = v; guarda(); }))),
      h('td', { class: 'c' }, h('select', { class: 'in', value: String(t.camas), onchange: (e) => { t.camas = Number(e.target.value); guarda(); } }, h('option', { value: '1' }, '1 cama'), h('option', { value: '2' }, '2 camas'))),
      h('td', { class: 'c' }, h('input', { type: 'checkbox', checked: !!t.suite, onchange: (e) => { t.suite = e.target.checked; guarda(); } })),
      h('td', { class: 'c' }, h('button', { class: 'b x', onclick: () => { if (g.tipos.length > 1) { g.tipos.splice(i, 1); guarda(); } } }, '✕'))));
    root.append(h('h3', null, 'Tipos de habitación y dispositivos por habitación'),
      h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Tipo', 'Plano', 'Termostato e7', 'Módulo X45B-X06', 'Caja', 'Sensor de movimiento', 'Contacto de puerta', 'PC-502', 'Camas', 'Suite', ''].map((x) => h('th', null, x)))), h('tbody', null, filasT))),
      h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => { g.tipos.push({ id: 't' + Date.now(), nombre: 'Nuevo tipo', plano: '', camas: 1, suite: false, e7: 1, x45: 1, caja: 1, pir: 1, puerta: 1, pc502: 0 }); guarda(); } }, '+ Agregar tipo de habitación'),
        h('button', { class: 'b', onclick: () => { if (confirm('Se restablecen los tipos de habitación de los planos ED-4102 a ED-4112. ¿Continuar?')) { g.tipos = clone(TIPOS_BASE); g.niveles = {}; guarda(); } } }, 'Restablecer tipos de los planos')));

    /* por nivel */
    const est = estadoGrms();
    root.append(h('h3', null, 'Habitaciones por tipo, pasillos y nivel'),
      h('div', { class: 'kpis' }, h('div', { class: 'kpi' }, h('b', null, est.total), h('span', null, 'Habitaciones del hotel (total del módulo)')),
        h('div', { class: 'kpi' }, h('b', null, est.cargadas), h('span', null, 'Habitaciones GRMS cargadas en equipos (pestaña 3)'))),
      est.total && est.total !== est.cargadas ? h('div', { class: 'warnbox' }, 'No calzan las cantidades: el módulo suma ' + est.total + ' habitaciones y los equipos «GRMS — habitación» de la pestaña 3 suman ' + est.cargadas + '. Ajuste el equipo en el nivel del controlador principal.') : null);
    const sumaN = (cfg) => g.tipos.reduce((a2, t) => a2 + Math.max(0, Math.round(num(cfg.tipos[t.id]))), 0);
    const hab = (n) => { const l = c.niveles.find((x) => x.n.id === n.id); return l ? l.habs : 0; };
    const nc = (v, f) => h('input', { class: 'in n', type: 'number', min: 0, value: v || 0, style: { width: '54px', padding: '3px 4px', textAlign: 'center' }, onchange: (e) => f(Math.max(0, Math.round(num(e.target.value)))) });
    const totTipo = (t) => E.niveles.reduce((a2, n) => a2 + Math.max(0, Math.round(num(cfgNivel(n).tipos[t.id]))), 0);
    root.append(h('div', { class: 'scroll' }, h('table', { class: 't' },
      h('thead', null, h('tr', null, [h('th', null, 'Nivel'), ...g.tipos.map((t) => h('th', { class: 'c', title: t.plano ? 'Plano ' + t.plano : '' }, t.nombre)), h('th', { class: 'c' }, 'Total'), h('th', { class: 'c' }, 'B578')])),
      h('tbody', null,
        E.niveles.map((n) => {
          const cfg = cfgNivel(n), l = c.niveles.find((x) => x.n.id === n.id);
          return h('tr', null,
            h('td', { style: { whiteSpace: 'nowrap', fontWeight: 600 }, title: n.nombre }, (n.codigo || '') + ' · ' + (n.nombre || '')),
            g.tipos.map((t) => h('td', { class: 'c' }, nc(cfg.tipos[t.id], (v) => { cfg.tipos[t.id] = v; const s2 = sumaN(cfg); if (s2 > 0) n.habs = s2; guarda(); }))),
            h('td', { class: 'c', style: { fontWeight: 700 } }, hab(n), l && l.sinTipo ? h('span', { class: 'chip warn', style: { marginLeft: '6px' }, title: 'Habitaciones sin tipo: se cuentan como ' + g.tipos[0].nombre }, l.sinTipo + ' sin tipo') : null),
            h('td', { class: 'c' }, l ? l.b578 : 0));
        }),
        h('tr', { style: { fontWeight: 700 } }, h('td', null, 'TOTAL'), g.tipos.map((t) => h('td', { class: 'c' }, totTipo(t))), h('td', { class: 'c' }, est.total), h('td', { class: 'c' }, c.tot.b578))))));

    /* pasillos por nivel (tabla compacta) */
    const filasP = [];
    E.niveles.forEach((n) => {
      const cfg = cfgNivel(n), l = c.niveles.find((x) => x.n.id === n.id);
      if (!l) return;
      cfg.pasillos.forEach((p, i) => filasP.push(h('tr', null,
        h('td', { style: { fontWeight: 600 } }, i === 0 ? (n.codigo || '') : ''),
        h('td', null, h('input', { class: 'in', value: p.nombre, style: { width: '130px', padding: '3px 6px' }, onchange: (e) => { p.nombre = e.target.value; guarda(); } })),
        h('td', { class: 'c' }, nc(num(p.largo), (v) => { p.largo = v; guarda(); })),
        h('td', { class: 'c' }, cfg.pasillos.length === 1 ? h('span', null, l.habs) : nc(num(p.habs), (v) => { p.habs = v; guarda(); })),
        h('td', { class: 'c' }, l.pas[i] ? l.pas[i].b578 : 0),
        h('td', { class: 'c', style: { whiteSpace: 'nowrap' } }, i === 0 ? h('button', { class: 'b s', title: 'Agregar pasillo a este nivel', onclick: () => { cfg.pasillos.push({ id: BMS.uid(), nombre: 'Pasillo ' + (cfg.pasillos.length + 1), largo: 40, habs: 0 }); guarda(); } }, '+') : null, cfg.pasillos.length > 1 ? h('button', { class: 'b x s', onclick: () => { cfg.pasillos.splice(i, 1); guarda(); } }, '✕') : null),
        h('td', null, i === 0 && l.avisoPas ? h('span', { class: 'chip bad' }, 'Pasillos suman ' + l.sumaP + ' de ' + l.habs) : null))));
    });
    if (filasP.length) root.append(h('h3', null, 'Pasillos por nivel'), h('div', { class: 'scroll' }, h('table', { class: 't', style: { maxWidth: '760px' } }, h('thead', null, h('tr', null, ['Nivel', 'Pasillo', 'Largo (m)', 'Habitaciones', 'B578', '', ''].map((x, i) => h('th', { class: i > 1 ? 'c' : '' }, x)))), h('tbody', null, filasP))));

    if (!c.niveles.length) { root.append(h('div', { class: 'warnbox' }, 'Ningún nivel tiene habitaciones. Indique la cantidad por tipo en los niveles de arriba.')); return; }

    /* resultados */
    root.append(h('h3', null, 'Dispositivos por nivel'),
      tabla(COLS_NIVEL, filasNivel(c).concat([[h('b', null, 'TOTAL'), h('b', null, c.tot.habs), ...POR_HAB.map((k) => h('b', null, c.tot[k])), h('b', null, c.tot.b578), h('b', null, c.tot.puertos), h('b', null, c.tot.switches)]]), ['', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r']));
    const filasPas = []; c.niveles.forEach((l) => l.pas.forEach((p) => filasPas.push([l.n.codigo || '', p.nombre, p.habs, p.largo + ' m', p.b578])));
    root.append(h('h3', null, 'Dispositivos por pasillo'), tabla(['Nivel', 'Pasillo', 'Habitaciones', 'Largo', 'B578'], filasPas, ['', '', 'r', 'r', 'r']),
      h('p', { class: 'hint' }, 'En cada habitación: termostato e7, módulo de relés X45B-X06 en su caja, sensor de movimiento y contacto de puerta, según el tipo. Los dampers de extracción (ZRT) y aire fresco (DF), el FCU y su válvula los suministran otros.'));

    /* diagramas */
    const tSel = g.tipos.find((t) => t.id === vista.tipo) || g.tipos[0], lSel = c.niveles.find((l) => l.n.id === vista.nivel) || c.niveles[0];
    const sHab = svgHabitacion(tSel, c.niveles.reduce((a, l) => a + (l.cant[tSel.id] || 0), 0)), sNiv = svgNivel(lSel), sAsc = svgAscenso(c);
    const marcoSvg = (s) => { const d = h('div', { style: { overflow: 'auto', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', padding: '6px' } }); s.setAttribute('style', 'width:100%;height:auto;display:block;max-width:1100px'); d.append(s); return d; };
    root.append(h('h3', null, 'Diagrama de habitación'),
      h('div', { class: 'fila' }, h('label', { class: 'f' }, 'Tipo', h('select', { class: 'in', value: tSel.id, onchange: (e) => { vista.tipo = e.target.value; BMS.rerender(); } }, g.tipos.map((t) => h('option', { value: t.id }, t.nombre)))),
        h('button', { class: 'b', onclick: () => descargaSvg(sHab, 'GRMS-habitacion-' + tSel.nombre.replace(/\W+/g, '_')) }, 'Descargar SVG'),
        h('button', { class: 'b', onclick: () => BMS.descargar('GRMS-habitacion-' + tSel.nombre.replace(/\W+/g, '_') + '.dxf', BMS.svgADxf(sHab.cloneNode(true)), 'application/dxf') }, 'Descargar DXF')),
      marcoSvg(sHab),
      h('h3', null, 'Diagrama de nivel (dispositivos por pasillo)'),
      h('div', { class: 'fila' }, h('label', { class: 'f' }, 'Nivel', h('select', { class: 'in', value: lSel.n.id, onchange: (e) => { vista.nivel = e.target.value; BMS.rerender(); } }, c.niveles.map((l) => h('option', { value: l.n.id }, (l.n.codigo || '') + ' · ' + (l.n.nombre || ''))))),
        h('button', { class: 'b', onclick: () => descargaSvg(sNiv, 'GRMS-nivel-' + (lSel.n.codigo || 'x')) }, 'Descargar SVG'),
        h('button', { class: 'b', onclick: () => BMS.descargar('GRMS-nivel-' + (lSel.n.codigo || 'x') + '.dxf', BMS.svgADxf(sNiv.cloneNode(true)), 'application/dxf') }, 'Descargar DXF')),
      marcoSvg(sNiv),
      h('h3', null, 'Diagrama de ascenso'),
      h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => descargaSvg(sAsc, 'GRMS-ascenso') }, 'Descargar SVG'), h('button', { class: 'b', onclick: () => BMS.descargar('GRMS-ascenso.dxf', BMS.svgADxf(sAsc.cloneNode(true)), 'application/dxf') }, 'Descargar DXF')),
      marcoSvg(sAsc));

    /* lista de materiales */
    root.append(h('h3', null, 'Lista de materiales del GRMS'), tabla(['Número de parte', 'Descripción', 'Cantidad', 'Fuente'], c.bom.map((b) => [h('b', null, b.parte), b.nombre, b.cant + ' ' + (b.unidad === 'u' ? '' : b.unidad), b.fuente]), ['', '', 'r', '']),
      h('p', { class: 'hint' }, 'Los números de parte salen de los planos ED-4102 a ED-4112 y de las fichas INNCOM; el integrador deberá confirmarlos con el fabricante (modelos del e7 por tensión, personalidad del B578 y K594C o K594.RF).'));

    /* integración con el BMS */
    const filasObj = g.objetos.map((o) => h('tr', null,
      h('td', { class: 'c' }, h('input', { type: 'checkbox', checked: o.on, onchange: (e) => { o.on = e.target.checked; guarda(); } })), h('td', null, o.n), h('td', null, o.id), h('td', { class: 'c' }, o.ac), h('td', null, o.g ? 'Global (65999)' : 'Por habitación'), h('td', { class: 'mute' }, o.nota)));
    root.append(h('h3', null, 'Integración con el BMS (BACnet/IP)'),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('b', null, c.devices), h('span', null, 'Dispositivos BACnet (habitaciones + global 65999)')),
        h('div', { class: 'kpi' }, h('b', null, c.puntos), h('span', null, 'Puntos de integración (' + c.hab + ' por habitación + ' + c.glo + ' globales)')),
        h('div', { class: 'kpi' }, h('b', null, c.devRes + ' / ' + c.ptsRes), h('span', null, 'Dispositivos y puntos con reserva del ' + P.reservaLic + ' %')),
        h('div', { class: 'kpi' }, h('b', null, c.nucleo ? c.nucleo.cod : '—'), h('span', null, 'Licencia núcleo Advanced que cubre la carga (catálogo Honeywell)'))),
      h('p', { class: 'hint' }, 'El fabricante recomienda un Optimizer Advanced dedicado al GRMS (N-ADV-134-H-C) con licencia N-ADV-10000-255PCA para 140 dispositivos y 2,372 puntos, separado del controlador de integración principal. El PMS no se integra al BMS.'),
      h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Incluir', 'Parámetro', 'Object ID', 'Acceso', 'Alcance', 'Nota'].map((x) => h('th', null, x)))), h('tbody', null, filasObj))));

    root.append(h('div', { class: 'fila noprint' },
      h('button', { class: 'b p', onclick: () => exportarXlsx(c) }, 'Exportar GRMS a Excel'),
      h('button', { class: 'b', title: 'PDF en hojas carta con el membrete Sinergia: tablas, diagrama de ascenso, habitaciones y niveles', onclick: () => pdfGrms(c) }, 'Exportar PDF (formato memoria)')));
  };
  /* total de habitaciones del módulo contra las cargadas como equipos «GRMS — habitación» */
  const estadoGrms = () => {
    const E = BMS.estado, total = calcular().tot.habs;
    const cargadas = E.equipos.filter((q) => q.tipoId === 'grms_hab').reduce((a, q) => a + num(q.qty), 0);
    return { total, cargadas, ok: total === cargadas };
  };
  /* mantiene los tipos de equipo GRMS del catálogo con los objetos BACnet marcados en el módulo */
  const sincronizar = () => {
    const g = G(), cat = BMS.catEq;
    if (!cat || !cat.tipos) return;
    let cambio = false;
    const mk = (id, nombre, tag, glob, nota) => {
      let t = cat.tipos.find((x) => x.id === id);
      if (!t) { t = { id, cat: 'grms', nombre, tag, gw: '', nota, pts: [] }; cat.tipos.push(t); cambio = true; }
      const pts = g.objetos.filter((o) => !!o.g === glob && o.on).map((o, i) => ({ id: id + '_' + (i + 1), n: o.n + ' (' + o.id + ', ' + o.ac + ')', ai: 0, ao: 0, di: 0, do: 0, int: 1, alm: /Alarm|Dirty/.test(o.n) ? 'Aviso' : '', tend: /Temp|Humidity|Level/.test(o.n) ? '15 min' : '', ifc: 'BACnet/IP' }));
      if (JSON.stringify(pts) !== JSON.stringify(t.pts)) { t.pts = pts; cambio = true; }
    };
    mk('grms_hab', 'GRMS — habitación (objetos BACnet del módulo GRMS)', 'GRMS-HAB', false, 'Variables por habitación tomadas del módulo GRMS (pestaña 7). La cantidad debe ser el total de habitaciones del módulo; se cargan en el nivel del controlador principal.');
    mk('grms_glob', 'GRMS — dispositivo global 65999 (módulo GRMS)', 'GRMS-G', true, 'Objetos del dispositivo global del servidor IC3 (módulo GRMS, pestaña 7). Cantidad: 1.');
    if (cambio && BMS.guardarCatEq) BMS.guardarCatEq();
  };
  /* aviso para el nivel del controlador principal; con nivel = null solo informa (pestaña 5) */
  const avisoCP = (nivel) => {
    const E = BMS.estado, cps = E.controladores.filter((c) => c.tipo === 'CP');
    if (nivel && !cps.some((c) => c.nivel === nivel.id)) return null;
    const c = calcular(), est = estadoGrms();
    if (!est.total) return null;
    const nombres = cps.filter((x) => !nivel || x.nivel === nivel.id).map((x) => BMS.calc.nombreCtrl(x)).join(', ') || 'el controlador principal';
    const gl = c.glo;
    const msg = 'GRMS: ' + nombres + ' debe considerar el total de habitaciones del módulo GRMS (pestaña 7): ' + est.total + ' habitaciones, ' + c.devices + ' dispositivos BACnet y ' + c.puntos + ' puntos de integración (' + c.hab + ' por habitación + ' + gl + ' globales). ';
    const el = h('div', { class: 'warnbox', style: est.ok ? {} : { borderColor: 'var(--bad)' } }, h('b', null, msg), est.ok ? '✓ La cantidad cargada en equipos coincide.' : 'No calzan las cantidades: en equipos hay ' + est.cargadas + ' habitaciones GRMS cargadas y el módulo suma ' + est.total + '.');
    if (nivel) {
      const q = E.equipos.find((x) => x.nivel === nivel.id && x.tipoId === 'grms_hab');
      const acc = h('div', { class: 'fila' });
      if (!q) acc.append(h('button', { class: 'b p', onclick: () => { sincronizar(); E.equipos.push({ id: BMS.uid(), nivel: nivel.id, tipoId: 'grms_hab', qty: est.total, tag: 'GRMS-HAB-' + (nivel.codigo || ''), ctrl: 'auto', obs: 'Cantidad tomada del módulo GRMS', excl: [] }); if (!E.equipos.some((x) => x.tipoId === 'grms_glob')) E.equipos.push({ id: BMS.uid(), nivel: nivel.id, tipoId: 'grms_glob', qty: 1, tag: 'GRMS-G', ctrl: 'auto', obs: 'Dispositivo global 65999', excl: [] }); BMS.touch(); BMS.rerender(); } }, 'Agregar «GRMS — habitación» con ' + est.total + ' habitaciones'));
      else if (num(q.qty) !== est.total) acc.append(h('button', { class: 'b p', onclick: () => { q.qty = est.total; BMS.touch(); BMS.rerender(); } }, 'Ajustar «GRMS — habitación» a ' + est.total));
      if (acc.children.length) el.append(acc);
    }
    return el;
  };
  BMS.grms = { calcular, DISP, total: () => calcular().tot.habs, estado: estadoGrms, sincronizar, avisoCP };
})();
