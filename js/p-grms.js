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
    const niveles = E.niveles.filter((n) => n.habs > 0).map((n) => {
      const c = cfgNivel(n), habs = Math.round(n.habs);
      const cant = {}; let suma = 0;
      g.tipos.forEach((t) => { const q = Math.max(0, Math.round(num(c.tipos[t.id]))); if (q) { cant[t.id] = q; suma += q; } });
      const sinTipo = Math.max(0, habs - suma);
      if (sinTipo && g.tipos[0]) cant[g.tipos[0].id] = (cant[g.tipos[0].id] || 0) + sinTipo;
      const exceso = Math.max(0, suma - habs);
      const disp = {}; POR_HAB.forEach((k) => { disp[k] = g.tipos.reduce((a, t) => a + (cant[t.id] || 0) * num(t[k]), 0); });
      const pas = c.pasillos.map((p) => ({ ...p, habs: Math.max(0, Math.round(num(p.habs))), largo: Math.max(0, num(p.largo)), b578: 0 }));
      pas.forEach((p) => { p.b578 = p.habs > 0 ? Math.max(1, Math.ceil(p.largo / Math.max(1, P.coberturaM))) : 0; });
      const porCap = Math.ceil(habs / Math.max(1, P.habsPorB578));
      let b578 = pas.reduce((a, p) => a + p.b578, 0);
      if (b578 < porCap && pas.length) { const pm = pas.reduce((a, p) => (p.habs > a.habs ? p : a), pas[0]); pm.b578 += porCap - b578; b578 = porCap; }
      const puertos = Math.ceil(b578 * (1 + P.reservaPoE / 100)), switches = Math.ceil(puertos / Math.max(1, P.puertosSwitch));
      const sumaP = pas.reduce((a, p) => a + p.habs, 0);
      return { n, c, habs, cant, sinTipo, exceso, disp, pas, b578, puertos, switches, avisoPas: sumaP !== habs, sumaP };
    });
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

  function svgHabitacion(t, cant) {
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
    const E = BMS.estado, g = G(), c = calcular(), P = g.param;
    const guarda = () => { BMS.touch(); BMS.rerender(); };
    const nin = (v, f, min) => h('input', { class: 'in n', type: 'number', min: min == null ? 0 : min, value: v, style: { width: '74px' }, onchange: (e) => f(Math.max(min == null ? 0 : min, num(e.target.value))) });
    const vista = BMS.ui.grms || (BMS.ui.grms = { tipo: g.tipos[0] && g.tipos[0].id, nivel: c.niveles[0] && c.niveles[0].n.id });

    root.append(h('h2', null, 'GRMS — gestión de habitaciones (INNCOM / Honeywell)'),
      h('p', { class: 'hint' }, 'Dispositivos por habitación, por pasillo y por nivel, diagramas de habitación, de nivel y de ascenso, e integración al BMS por BACnet/IP. Las habitaciones de cada nivel salen de la pestaña 1. Los modelos de habitación y sus dispositivos parten de los planos ED-4102 a ED-4112 y de las fichas INNCOM; ajuste lo que difiera en obra.'));
    if (!c.niveles.length) { root.append(h('div', { class: 'warnbox' }, 'Ningún nivel tiene habitaciones definidas. Indique las habitaciones de cada nivel en la pestaña 1 (columna Hab.).')); return; }

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
    root.append(h('h3', null, 'Habitaciones y pasillos por nivel'));
    c.niveles.forEach((l) => {
      const cfg = l.c;
      root.append(h('div', { class: 'card' },
        h('h4', { style: { margin: '0 0 6px' } }, 'Nivel ' + (l.n.codigo || '') + ' · ' + (l.n.nombre || '') + ' · ' + l.habs + ' habitaciones',
          l.sinTipo ? h('span', { class: 'chip warn', style: { marginLeft: '8px' } }, l.sinTipo + ' sin tipo (se cuentan como ' + g.tipos[0].nombre + ')') : null,
          l.exceso ? h('span', { class: 'chip bad', style: { marginLeft: '8px' } }, 'Sobran ' + l.exceso + ' en los tipos') : null),
        h('div', { class: 'fila', style: { flexWrap: 'wrap', gap: '8px' } }, g.tipos.map((t) => h('label', { class: 'f', style: { minWidth: '110px' } }, t.nombre, nin(cfg.tipos[t.id] || 0, (v) => { cfg.tipos[t.id] = v; guarda(); })))),
        h('table', { class: 'mini', style: { marginTop: '8px' } }, h('tr', null, ['Pasillo', 'Largo (m)', 'Habitaciones', 'B578', ''].map((x) => h('th', null, x))),
          cfg.pasillos.map((p, i) => h('tr', null,
            h('td', null, h('input', { class: 'in', value: p.nombre, style: { width: '130px' }, onchange: (e) => { p.nombre = e.target.value; guarda(); } })),
            h('td', null, nin(num(p.largo), (v) => { p.largo = v; guarda(); })),
            h('td', null, cfg.pasillos.length === 1 ? h('span', null, l.habs) : nin(num(p.habs), (v) => { p.habs = v; guarda(); })),
            h('td', { class: 'r' }, l.pas[i] ? l.pas[i].b578 : 0),
            h('td', null, cfg.pasillos.length > 1 ? h('button', { class: 'b x', onclick: () => { cfg.pasillos.splice(i, 1); guarda(); } }, '✕') : null)))),
        l.avisoPas ? h('div', { class: 'warnbox' }, 'Las habitaciones de los pasillos suman ' + l.sumaP + ' y el nivel tiene ' + l.habs + '.') : null,
        h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => { cfg.pasillos.push({ id: BMS.uid(), nombre: 'Pasillo ' + (cfg.pasillos.length + 1), largo: 40, habs: 0 }); guarda(); } }, '+ Agregar pasillo'),
          h('span', { class: 'mute' }, 'Por nivel: ' + l.b578 + ' B578 · ' + l.puertos + ' puertos PoE (' + l.switches + ' switch) · ' + POR_HAB.filter((k) => l.disp[k]).map((k) => l.disp[k] + '× ' + DISP.find((d) => d.k === k).parte).join(' · ')))));
    });

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
  BMS.grms = { calcular, DISP };
})();
