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
    { k: 'e7', parte: 'E7', nombre: 'Termostato digital INNCOM e7, 24 VAC, radio RF de 20 dB, con humedad y salida auxiliar 0-10 VDC (solo por software), color negro', fuente: 'ED-4102 (simbología GRMS); INNCOM e7 Datasheet (2021)' },
    { k: 'd528', parte: 'D1-528-24', nombre: 'Termostato INNCOM Direct D1-528, 24 VAC, 5 relés a bordo, E/S digitales y analógicas, sensores de temperatura, humedad, movimiento y luz, RF Deep Mesh 802.15.4', fuente: 'INNCOM D1-528 Datasheet 31-00716-01 (rev. 06-24)' },
    { k: 'd529', parte: 'D1-529-6V', nombre: 'Termostato INNCOM Direct D1-529, inalámbrico a batería (6 VDC, 4 pilas AA), con sensores de temperatura, humedad, movimiento y luz; requiere el controlador D-X47', fuente: 'INNCOM D1-529 Datasheet 31-00717-01 (rev. 06-24)' },
    { k: 'dx47', parte: 'D-X47-24', nombre: 'Controlador HVAC INNCOM Direct D-X47, 24 VAC, 5 relés de salida y E/S digitales y analógicas (compañero del D1-529)', fuente: 'INNCOM DX47 Datasheet 31-00719-01' },
    { k: 'x45', parte: 'X45B-X06', nombre: 'Módulo de relés INNCOM X45B-X06: control maestro de iluminación y dampers, 5 relés', fuente: 'ED-4102' },
    { k: 'caja', parte: 'NSYCRN33200P', nombre: 'Caja de registro 300 × 300 × 200 mm para el módulo de relés', fuente: 'ED-4102' },
    { k: 'pirC', parte: 'K594C', nombre: 'Sensor de movimiento PIR INNCOM K594C, 12 VDC, en el cielo del baño; 3 conductores de entrada al e7', fuente: 'ED-4102 (esquema); Generic Thermostat Motion Sensor Design' },
    { k: 'pirRF', parte: 'K594.RF', nombre: 'Sensor de movimiento INNCOM K594.RF de pared, RF (TX/RX), a batería, en dormitorio y sala', fuente: 'ED-4102 (simbología GRMS)' },
    { k: 'puerta', parte: 'S241 / S541.RF', nombre: 'Contacto de puerta INNCOM S241 (cableado, empotrado) o S541.RF (transmisor inalámbrico)', fuente: 'ED-4102; Door Integration Brochure' },
    { k: 'pc502', parte: 'PC-502.4g', nombre: 'Repetidor RF / gateway S5bus-RF INNCOM PC-502.4g (solo donde el estudio de RF lo requiera)', fuente: 'PC-502.4g Datasheet v1.5' },
    { k: 'b578', parte: 'B578S', nombre: 'Edge router Deep Mesh B578 (personalidad S, PoE, montaje superficial) en el pasillo', fuente: 'B578 Datasheet; Generic Network Topologies' },
    { k: 'd578', parte: 'D1-578-12', nombre: 'Edge router INNCOM Direct D-578 (módulo PoE 02-9499 o fuente 12 VDC) en el pasillo, para los termostatos D1; hasta 200 habitaciones por router en servicio limitado según el fabricante', fuente: 'INNCOM D578 Datasheet 31-00718-01 (rev. 06-24)' },
    { k: 'poe', parte: 'Switch PoE', nombre: 'Conmutador PoE de nivel, un puerto por B578 (suministrado por otros)', fuente: 'Generic Network Topologies (Typical Design)' },
    { k: 'dash', parte: 'INNCOM Direct', nombre: 'Panel INNCOM Direct (en la nube) o INNcontrol 5 para los termostatos D1; el fabricante muestra la integración al BMS por una pasarela Niagara', fuente: 'IN-SS-INNCOMDirect brochure (jun-2024); D578 y D1 datasheets' },
    { k: 'ic3', parte: 'IC3 / INNcontrol', nombre: 'Servidor INNCOM (IC3 / INNcontrol) en el cuarto de IT, con interfaz BACnet/IP, PMS y cerradura', fuente: 'ED-4102 (notas); Selección V3 del fabricante' }
  ];
  const POR_HAB = ['e7', 'd528', 'd529', 'dx47', 'x45', 'caja', 'pirC', 'pirRF', 'puerta', 'pc502'];
  /* modelos de termostato disponibles: INNCOM e7 (Deep Mesh con B578 y servidor IC3) e INNCOM Direct D1 (D578 y panel INNCOM Direct) */
  const TERMOS = { e7: { n: 'INNCOM e7', corto: 'e7', router: 'B578' }, d1_528: { n: 'INNCOM D1-528 (24 VAC)', corto: 'D1-528', router: 'D578' }, d1_529: { n: 'INNCOM D1-529 (batería) + D-X47', corto: 'D1-529', router: 'D578' } };
  const termoDe = (t) => (t && TERMOS[t.termo] ? t.termo : 'e7');
  const esD1 = (t) => /^d1/.test(termoDe(t));
  /* cantidad por habitación de cada dispositivo según el modelo de termostato elegido */
  const cantDisp = (t, k) => {
    const m = termoDe(t), q = num(t.e7);
    if (k === 'e7') return m === 'e7' ? q : 0;
    if (k === 'd528') return m === 'd1_528' ? q : 0;
    if (k === 'd529') return m === 'd1_529' ? q : 0;
    if (k === 'dx47') return m === 'd1_529' ? q : 0;
    return num(t[k]);
  };
  const TIPOS_BASE = [
    ['King ADA', 'ED-4102'], ['King ADA V2', 'ED-4103'], ['King Ducto L', 'ED-4104'], ['King Esquinero', 'ED-4105'], ['King Suite ADA', 'ED-4106'], ['King Suite Espejo', 'ED-4107'],
    ['Queen ADA', 'ED-4108'], ['Queen Espejo', 'ED-4109'], ['Queen Suite Espejo', 'ED-4110'], ['Queen Suite', 'ED-4111'], ['King Suite', 'ED-4112']
  ].map(([nombre, plano], i) => ({ id: 't' + (i + 1), nombre, plano, camas: /queen/i.test(nombre) ? 2 : 1, suite: /suite/i.test(nombre), termo: 'e7', e7: 1, x45: 1, caja: 1, pirC: 1, pirRF: /suite/i.test(nombre) ? 2 : 1, puerta: 1, pc502: 0 }));
  const OBJ_BASE = [
    ['Set_Temp', 'AV-10', 'R/W'], ['Humidity', 'AV-16', 'R'], ['Room_Temp', 'AV-17', 'R'], ['Occupied', 'BI-3', 'R'], ['AC_Mode', 'MV-15', 'R/W'], ['Fan_Speed_Actual', 'MSI-44', 'R'],
    ['Heating_Valve_Actual', 'AV-41', 'R'], ['Cooling_Valve_Actual', 'AV-43', 'R'], ['Window_Open', 'BI-77', 'R'], ['Door_Open', 'BI-75', 'R'], ['Guest Satisfaction Alarm', 'BI-29', 'R'],
    ['Equip Satisfaction Alarm', 'BI-30', 'R'], ['Dirty Filter status', 'BI-42', 'R'], ['Eco Mode', 'BV-60', 'R'], ['Discharge_Air_Temp', 'AV-83', 'R'],
    ['Rented', 'BV-2', 'R/W', 'Lectura habilitada; escritura bloqueada desde el BMS salvo autorización de operación hotelera y PMS'], ['Light_Level', 'AV-53', 'R']
  ].map(([n, id, ac, nota]) => ({ n, id, ac, g: false, on: true, nota: nota || '' }))
    .concat([['Outside Air Temp', 'AV-93', 'R'], ['Peak Demand', 'MI-94', 'R/W'], ['Communicating Rooms', 'AV-95', 'R'], ['Rooms in Eco Mode', 'AV-96', 'R'], ['Percent Rooms in Eco Mode', 'AV-97', 'R'],
      ['Rooms Heating', 'AV-98', 'R'], ['Percent Rooms Heating', 'AV-99', 'R'], ['Rooms Cooling', 'AV-100', 'R'], ['Percent Rooms Cooling', 'AV-101', 'R']].map(([n, id, ac]) => ({ n, id, ac, g: true, on: true, nota: 'Dispositivo global 65999' })));
  const NOTAS_BASE = [
    'Plano de fondo: {plano} (BMS). Los símbolos T, X45B, ZRT, DF, FCU, C y V siguen la ubicación del plano.',
    'Los sensores de movimiento van en ubicación indicativa: coordinar con los registros de equipos.',
    'Cada número encerrado liga un cableado entre la planta, el esquema y la tabla de cableados.',
    'Tubería A: 25 mm. Tubería B: 13 mm (simbología del plano).',
    'Integración con PMS, BMS/BAS y con la cerradura de la habitación: la interfaz va incluida en la licencia.',
    'B578 en el pasillo de cada nivel, alimentado desde switch PoE; a 1.8 m (6 ft) o más de un punto de acceso Wi-Fi y fuera de gabinete metálico.'
  ].join('\n');
  const PARAM_BASE = { habsPorB578: 50, coberturaM: 60, reservaPoE: 20, puertosSwitch: 24, reservaLic: 30 };

  const G = () => {
    const E = BMS.estado;
    if (!E.grms) E.grms = { param: clone(PARAM_BASE), tipos: clone(TIPOS_BASE), niveles: {}, objetos: clone(OBJ_BASE) };
    const g = E.grms; g.param = Object.assign(clone(PARAM_BASE), g.param);
    if (!g.tipos || !g.tipos.length) g.tipos = clone(TIPOS_BASE);
    g.tipos.forEach((t) => { if (!t.termo) t.termo = 'e7'; if (t.pirC === undefined) { t.pirC = 1; t.pirRF = t.suite ? 2 : 1; } delete t.pir; });
    if (g.notas === undefined) g.notas = NOTAS_BASE;
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
      const disp = {}; POR_HAB.forEach((k) => { disp[k] = g.tipos.reduce((a2, t) => a2 + (cant[t.id] || 0) * cantDisp(t, k), 0); });
      const habsD1 = g.tipos.reduce((a2, t) => a2 + (cant[t.id] || 0) * (esD1(t) ? 1 : 0), 0), habsE7 = habs - habsD1, rD = habs ? habsD1 / habs : 0;
      const pas = c.pasillos.map((p) => { const hh = Math.max(0, Math.round(num(p.habs))), hD = Math.round(hh * rD); return { ...p, habs: hh, hE: hh - hD, hD, largo: Math.max(0, num(p.largo)), b578: 0, d578: 0 }; });
      const nR = (p, hx) => (hx > 0 ? Math.max(1, Math.ceil(p.largo / Math.max(1, P.coberturaM))) : 0);
      pas.forEach((p) => { p.b578 = nR(p, p.hE); p.d578 = nR(p, p.hD); });
      const cap = Math.max(1, P.habsPorB578);
      const completa = (key, habsF) => { const porCap = Math.ceil(habsF / cap); let sm = pas.reduce((a2, p) => a2 + p[key], 0); if (sm < porCap && pas.length) { const pm = pas.reduce((a2, p) => (p.habs > a2.habs ? p : a2), pas[0]); pm[key] += porCap - sm; sm = porCap; } return sm; };
      const b578 = completa('b578', habsE7), d578 = completa('d578', habsD1);
      const puertos = Math.ceil((b578 + d578) * (1 + P.reservaPoE / 100)), switches = Math.ceil(puertos / Math.max(1, P.puertosSwitch));
      const sumaP = pas.reduce((a2, p) => a2 + p.habs, 0);
      return { n, c, habs, cant, sinTipo, exceso, disp, pas, b578, d578, habsD1, habsE7, puertos, switches, avisoPas: sumaP !== habs, sumaP };
    }).filter((l) => l.habs > 0);
    const tot = { habs: 0, b578: 0, d578: 0, habsD1: 0, habsE7: 0, puertos: 0, switches: 0 }; POR_HAB.forEach((k) => { tot[k] = 0; });
    niveles.forEach((l) => { tot.habs += l.habs; tot.habsD1 += l.habsD1; tot.habsE7 += l.habsE7; tot.d578 += l.d578; tot.b578 += l.b578; tot.puertos += l.puertos; tot.switches += l.switches; POR_HAB.forEach((k) => { tot[k] += l.disp[k]; }); });
    const hab = g.objetos.filter((o) => !o.g && o.on).length, glo = g.objetos.filter((o) => o.g && o.on).length;
    const f = 1 + P.reservaLic / 100;
    const devices = tot.habs ? tot.habs + 1 : 0, puntos = tot.habs * hab + (tot.habs ? glo : 0);
    const devRes = Math.ceil(devices * f), ptsRes = Math.ceil(puntos * f);
    const Mh = BMS.catCt.marcas.Honeywell, L = Mh && Mh.licencias;
    const nucleo = L ? [...L.nucleo].sort((a, b) => a.ptsGlobal - b.ptsGlobal).find((x) => x.disp >= devRes && x.ptsGlobal >= ptsRes) || null : null;
    const bom = [];
    if (tot.habs) {
      DISP.forEach((d) => {
        const q = POR_HAB.includes(d.k) ? tot[d.k] : d.k === 'b578' ? tot.b578 : d.k === 'd578' ? tot.d578 : d.k === 'poe' ? tot.puertos : d.k === 'ic3' ? (tot.habsE7 > 0 ? 1 : 0) : d.k === 'dash' ? (tot.habsD1 > 0 ? 1 : 0) : 0;
        if (q) bom.push({ ...d, cant: q, unidad: d.k === 'poe' ? 'puertos (' + tot.switches + ' switch de ' + P.puertosSwitch + ')' : 'u' });
      });
    }
    return { niveles, tot, hab, glo, devices, puntos, devRes, ptsRes, nucleo, bom, P };
  }

  /* ---------- diagramas ---------- */
  const PALETA = ['#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2', '#ede9fe', '#cffafe', '#ffedd5', '#e5e7eb', '#fce7f3', '#d9f99d', '#bae6fd'];
  const colorTipo = (id) => PALETA[(G().tipos.findIndex((t) => t.id === id) + PALETA.length) % PALETA.length];
  const marco = (W, H) => sv('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' });

  /* ---- Cableados numerados: ligan la planta, el esquema, la leyenda y la tabla ---- */
  let TA = null; /* tipo de habitación en curso: define los nombres del termostato y del router */
  const termoTxt = () => (TA && TERMOS[termoDe(TA)] ? 'Termostato ' + TERMOS[termoDe(TA)].corto : 'Termostato e7');
  const routerTxt = () => (TA && esD1(TA) ? 'D578' : 'B578');
  const cables = () => [
    { n: 1, de: termoTxt() + ' (T)', a: 'Módulo X45B-X06', c: 'Tubería A 25 mm; cable de control (por el integrador)', k: ['e7', 'x45'] },
    { n: 2, de: termoTxt() + ' (T)', a: 'Válvula de agua helada 24 V (FCU-HAB)', c: 'Tubería A 25 mm; 18 AWG, 8 conductores (18-8)', k: ['e7', 'valvula', 'fcu'] },
    { n: 3, de: 'Módulo X45B-X06', a: 'Relé de iluminación', c: 'Tubería B 13 mm; circuito del plano de iluminación', k: ['x45', 'luz'] },
    { n: 4, de: 'Módulo X45B-X06', a: 'Damper ZRT (extracción)', c: 'Tubería B 13 mm', k: ['x45', 'zrt'] },
    { n: 5, de: 'Módulo X45B-X06', a: 'Damper DF (aire fresco)', c: 'Tubería B 13 mm', k: ['x45', 'df'] },
    { n: 6, de: 'Contacto de puerta (C)', a: 'Módulo X45B-X06', c: 'Tubería B 13 mm; S241 cableado', k: ['puerta', 'x45'] },
    { n: 7, de: 'Sensor K594C (baño)', a: termoTxt(), c: '3 conductores de entrada, 18 AWG', k: ['pirC', 'e7'] },
    { n: 8, de: 'Sensor K594.RF (pared)', a: termoTxt(), c: 'RF a batería, sin cable', k: ['pirRF', 'e7'] },
    { n: 9, de: termoTxt(), a: 'Gateway ' + routerTxt(), c: 'RF 802.15.4 Deep Mesh, sin cable', k: ['e7', 'b578'] },
    { n: 10, de: 'Gateway ' + routerTxt(), a: 'Switch PoE del nivel', c: 'UTP Cat 6A, canalización de 19 mm; alimenta al ' + routerTxt(), k: ['b578', 'poe'] },
    { n: 11, de: 'Cerradura VingCard (CELS)', a: termoTxt() + ' / ' + routerTxt(), c: 'RF; suministra otros; interfaz en la licencia', k: ['vingcard', 'e7'] }
  ].concat(TA && termoDe(TA) === 'd1_529' ? [{ n: 12, de: 'Controlador D-X47', a: termoTxt(), c: 'RF 802.15.4 Deep Mesh, sin cable; 24 VAC al D-X47', k: ['dx47', 'e7'] }] : []);
  const nCab = (k) => cables().filter((c) => c.k.includes(k)).map((c) => c.n);
  /* leyenda: cada fila lleva la cantidad por habitación, las claves de dispositivo que dibuja y los cableados que la tocan */
  const LEYENDA = (t) => [
    { k: ['e7'], q: num(t.e7), t: ({ e7: 'Termostato e7 (T), 24 VAC, RF, con humedad', d1_528: 'Termostato D1-528-24 (T), 24 VAC, 5 relés, RF, con humedad', d1_529: 'Termostato D1-529-6V (T), a batería, RF, con humedad' })[termoDe(t)] },
    ...(termoDe(t) === 'd1_529' ? [{ k: ['dx47'], q: num(t.e7), t: 'Controlador D-X47-24, 5 relés (del D1-529)' }] : []),
    { k: ['x45'], q: num(t.x45), t: 'Módulo X45B-X06 en caja NSYCRN33200P' },
    { k: ['pirC'], q: num(t.pirC), t: 'Sensor K594C mini PIR, baño (S punteado)' },
    { k: ['pirRF'], q: num(t.pirRF), t: 'Sensor K594.RF de pared (S)' },
    { k: ['puerta'], q: num(t.puerta), t: 'Contacto de puerta S241 / S541.RF (C)' },
    { k: ['vingcard'], q: 1, t: 'Cerradura VingCard (V), por otros', otros: true },
    { k: ['zrt', 'df'], q: 1, t: 'Dampers de extracción (ZRT) y aire fresco (DF), por otros', otros: true },
    { k: ['fcu', 'valvula'], q: 1, t: 'FCU-HAB con válvula de agua helada 24 V, por otros', otros: true },
    { k: ['luz'], q: 1, t: 'Relé de iluminación (circuito del plano de iluminación), por otros', otros: true },
    { k: ['b578', 'poe'], q: 1, t: 'Gateway ' + (esD1(t) ? 'D578' : 'B578') + ' en el pasillo (1 por nivel) y switch PoE del nivel, por otros' }
  ].concat(num(t.pc502) ? [{ k: ['pc502'], q: num(t.pc502), t: 'Repetidor PC-502.4g (solo si el estudio de RF lo pide)' }] : []);
  const wrap = (txt, n) => { const out = []; String(txt || '').split('\n').forEach((l) => { let cur = ''; l.split(/\s+/).forEach((w) => { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }); out.push(cur); }); return out; };
  const badge = (sg, x, y, n, dev) => { sg.append(sv('circle', Object.assign({ cx: x, cy: y, r: 7.5, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.2 }, dev ? { 'data-cab': n } : { 'data-cab': n })), tx(x, y + 3, String(n), { 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 700 })); };

  /* Esquema de conexión de la habitación (como en el plano ED-4102), con flechas y cableados numerados */
  function esquemaHabitacion(sg, x, y, t) {
    const g = sv('g', { transform: `translate(${x},${y})` });
    const T = (px, py, txt, o) => g.append(tx(px, py, txt, Object.assign({ 'font-size': 7.5 }, o || {})));
    const R = (rx, ry, w, hh, dv, o) => g.append(sv('rect', Object.assign({ x: rx, y: ry, width: w, height: hh, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.3 }, dv ? { 'data-esq': dv } : {}, o || {})));
    const Ln = (x1, y1, x2, y2, o) => g.append(sv('line', Object.assign({ x1, y1, x2, y2, stroke: '#1a1a1b', 'stroke-width': 1.3 }, o || {})));
    const flecha = (x1, y1, x2, y2, o) => { Ln(x1, y1, x2, y2, o); const a = Math.atan2(y2 - y1, x2 - x1), L = 6; g.append(sv('polygon', { points: `${x2},${y2} ${x2 - L * Math.cos(a - 0.4)},${y2 - L * Math.sin(a - 0.4)} ${x2 - L * Math.cos(a + 0.4)},${y2 - L * Math.sin(a + 0.4)}`, fill: (o && o.stroke) || '#1a1a1b' })); };
    const B = (bx, by, n) => badge(g, bx, by, n);
    g.append(tx(0, -4, 'ESQUEMA DE CONEXIÓN DE LA HABITACIÓN', { 'font-weight': 700, 'font-size': 10 }));
    T(0, 38, 'TERMOSTATO INNCOM ' + TERMOS[termoDe(t)].corto.toUpperCase()); flecha(30, 42, 30, 62);
    if (termoDe(t) === 'd1_529') { R(62, 96, 52, 18, 'dx47'); T(88, 108, 'D-X47', { 'text-anchor': 'middle', 'font-size': 7.5, 'font-weight': 700 }); Ln(44, 88, 62, 102, { stroke: '#7c3aed', 'stroke-dasharray': '3 2' }); B(70, 90, 12); }
    R(16, 62, 28, 28, 'e7'); T(30, 82, 'T', { 'text-anchor': 'middle', 'font-size': 17 });
    Ln(44, 76, 118, 76); g.append(sv('circle', { cx: 68, cy: 76, r: 8, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.2 })); T(68, 79, 'A', { 'text-anchor': 'middle', 'font-size': 9 }); B(96, 66, 1);
    R(100, 6, 214, 104, null);
    T(106, 18, 'CAJA REGISTRO 300X300X200', { 'font-weight': 700 }); T(106, 28, 'NSYCRN33200P', { 'font-weight': 700 }); T(106, 38, 'MODULO RELAYS INNCOM X45B-X06', { 'font-weight': 700 });
    R(118, 62, 28, 28, 'x45');
    T(338, 6, 'CONEXIÓN HACIA MÓDULO DE RELÉS', { 'font-size': 7 });
    Ln(318, 12, 318, 100);
    [['RELÉ DE ILUMINACIÓN', 3, 'luz', 0], ['DAMPER ZRT', 4, 'zrt', 0], ['DAMPER DF', 5, 'df', 0], ['CONTACTO PUERTA S541.RF / S241', 6, 'puerta', 0], ['K594C MINI PIR (BAÑO)', 7, 'pirC', 0], ['K594.RF PARED (RF)', 8, 'pirRF', 1]].forEach(([n, nc, dv, rf], i) => {
      const ly = 14 + i * 17;
      flecha(318, ly + 7, 340, ly + 7, rf ? { stroke: '#7c3aed', 'stroke-dasharray': '3 2' } : {}); B(330, ly + 2, nc);
      R(342, ly, 118, 14, dv, { 'stroke-width': 1 }); T(346, ly + 10, n, { 'font-size': 6.5 });
    });
    /* termostato a FCU */
    Ln(30, 90, 30, 124); g.append(sv('circle', { cx: 30, cy: 132, r: 8, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.2 })); T(30, 135, 'A', { 'text-anchor': 'middle', 'font-size': 9 });
    Ln(30, 140, 30, 172); Ln(30, 156, 150, 156, { 'data-esq': 'valvula' }); Ln(30, 172, 150, 172);
    [156, 172].forEach((ly) => g.append(sv('polygon', { points: `116,${ly - 5} 126,${ly + 5} 126,${ly - 5} 116,${ly + 5}`, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1, 'data-esq': 'valvula' })));
    B(76, 146, 2);
    R(150, 144, 104, 36, 'fcu'); R(154, 148, 96, 28, null, { fill: 'none', 'stroke-width': 0.8 }); T(202, 166, 'FCU-HAB', { 'text-anchor': 'middle', 'font-size': 8.5, 'font-weight': 700 });
    T(0, 196, '24 V VÁLVULA DE AGUA HELADA DESDE'); T(0, 206, 'TERMOSTATO O DEL EQUIPO DE HVAC');
    /* gateway, switch PoE y cerradura */
    const y0 = 222;
    R(16, y0, 28, 28, 'b578'); T(30, y0 + 20, 'G', { 'text-anchor': 'middle', 'font-size': 15 });
    T(50, y0 + 9, 'GATEWAY ' + (esD1(t) ? 'D578' : 'B578') + ' UBICADO EN', { 'font-size': 6.5 }); T(50, y0 + 18, 'PASILLO DE CADA NIVEL', { 'font-size': 6.5 }); T(50, y0 + 27, 'ALIMENTADO DESDE SWITCH POE', { 'font-size': 6.5 });
    R(214, y0, 104, 28, 'poe'); T(266, y0 + 12, 'SWITCH PoE DEL NIVEL', { 'text-anchor': 'middle', 'font-size': 7, 'font-weight': 700 }); T(266, y0 + 22, 'UTP Cat 6A', { 'text-anchor': 'middle', 'font-size': 6.5 });
    R(340, y0, 120, 28, 'vingcard'); T(400, y0 + 12, 'CERRADURA VINGCARD', { 'text-anchor': 'middle', 'font-size': 7, 'font-weight': 700 }); T(400, y0 + 22, '(CELS, por otros)', { 'text-anchor': 'middle', 'font-size': 6.5 });
    Ln(30, y0 + 28, 30, y0 + 40, { stroke: '#1a1a1b' }); Ln(30, y0 + 40, 266, y0 + 40); flecha(266, y0 + 40, 266, y0 + 29); B(150, y0 + 40, 10);
    /* RF: e7 a B578 y cerradura */
    Ln(16, 76, 4, 76, { stroke: '#7c3aed', 'stroke-dasharray': '4 3' }); Ln(4, 76, 4, y0 + 14, { stroke: '#7c3aed', 'stroke-dasharray': '4 3' }); flecha(4, y0 + 14, 15, y0 + 14, { stroke: '#7c3aed' }); B(4, 150, 9);
    Ln(400, y0 + 28, 400, y0 + 52, { stroke: '#7c3aed', 'stroke-dasharray': '4 3' }); Ln(400, y0 + 52, 22, y0 + 52, { stroke: '#7c3aed', 'stroke-dasharray': '4 3' }); flecha(22, y0 + 52, 22, y0 + 29, { stroke: '#7c3aed', 'stroke-dasharray': '4 3' }); B(300, y0 + 52, 11);
    sg.append(g);
  }

  /* Tabla de cableados del diagrama */
  function tablaCables(sg, x, y, w) {
    const g = sv('g', { transform: `translate(${x},${y})` });
    g.append(tx(0, -4, 'CABLEADOS', { 'font-weight': 700, 'font-size': 10 }));
    cables().forEach((c, i) => {
      const ry = 6 + i * 24;
      g.append(sv('line', { x1: 0, y1: ry - 6, x2: w, y2: ry - 6, stroke: '#d1d5db', 'stroke-width': 0.6 }));
      badge(g, 9, ry + 5, c.n);
      g.append(tx(24, ry + 4, c.de + ' → ' + c.a, { 'font-size': 8, 'font-weight': 700 }), tx(24, ry + 14, c.c, { 'font-size': 7.5, fill: '#4b5563' }));
    });
    sg.append(g);
  }

  /* Leyenda de dispositivos y notas (editables) a la derecha de la planta. Devuelve la altura usada. */
  function leyendaHabitacion(sg, lx, y0, t, W) {
    const g = G();
    let y = y0 + 6;
    sg.append(tx(lx, y, 'DISPOSITIVOS POR HABITACIÓN', { 'font-weight': 700, 'font-size': 10 })); y += 18;
    LEYENDA(t).forEach((f) => {
      sg.append(tx(lx, y, (f.otros ? '' : f.q) + (f.otros ? '' : '×'), { 'font-weight': 700 }), tx(lx + 28, y, f.t, { 'data-lis': f.k.join(' ') }));
      const cab = [...new Set(f.k.flatMap(nCab))].sort((a, b) => a - b);
      if (cab.length) sg.append(tx(lx + 400, y, 'cableados ' + cab.join('·'), { 'text-anchor': 'end', 'font-size': 7.5, fill: '#667085' }));
      y += 15;
    });
    sg.append(tx(lx, y + 2, '* Los equipos «por otros» los suministra otro contratista.', { 'font-size': 8, fill: '#667085' }));
    const yd = y + 14;
    /* notas a la derecha (texto del módulo, editable) */
    const nx = lx + 440; let yn = y0 + 6;
    sg.append(tx(nx, yn, 'NOTAS', { 'font-weight': 700, 'font-size': 10 })); yn += 15;
    wrap(String(g.notas || '').replace(/\{plano\}/g, t.plano || ''), 66).forEach((l) => { sg.append(tx(nx, yn, l, { 'font-size': 8.5 })); yn += 11.5; });
    return Math.max(yd, yn + 4);
  }

  /* Habitación sobre el plano real de BMS del modelo (ED-4102 a ED-4112) o, sin plano, sobre una planta esquemática */
  function svgHabitacionPlano(t, cant, pl) {
    TA = t;
    const a = pl.a, one = (k) => (a[k] && a[k][0]) || null;
    const T = one('T'), ZRT = one('ZRT'), DF = one('DF'), FB = one('FB'), CRN = one('CRN'), V = one('V');
    const pts = ['T', 'ZRT', 'DF', 'CRN', 'V', 'LP'].flatMap((k) => (a[k] || []).map((p) => p[1])).concat(FB ? [FB[1]] : []);
    const y0 = pl.img ? Math.max(0, Math.min(...pts, pl.h) - 150) : 0, alto = pl.h - y0;
    const s = Math.min(470 / alto, 480 / pl.w), pw = pl.w * s, ph = alto * s;
    const OX = 30, OY = 52, lx = OX + pw + 30, RW = 900, W = Math.round(lx + RW + 20);
    const X = (x) => OX + x * s, Y = (y) => OY + (y - y0) * s;
    const sg = sv('svg', { xmlns: NS, viewBox: '0 0 ' + W + ' 1', 'font-family': 'Arial, Helvetica, sans-serif' });
    const halo = { 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' };
    sg.append(marco(W, 2000), tx(OX, 28, 'HABITACIÓN TIPO ' + t.nombre.toUpperCase() + ' — ' + cant + ' hab.' + (t.plano ? ' · plano ' + t.plano : ''), { 'font-size': 14, 'font-weight': 700 }));
    if (pl.img) {
      const vp = sv('svg', { x: OX, y: OY, width: pw, height: ph, viewBox: `0 ${y0} ${pl.w} ${alto}`, overflow: 'hidden' });
      vp.append(sv('image', { href: pl.img, x: 0, y: 0, width: pl.w, height: pl.h, preserveAspectRatio: 'none' }));
      sg.append(sv('rect', { x: OX, y: OY, width: pw, height: ph, fill: 'none', stroke: '#9ca3af' }), vp);
    } else {
      sg.append(sv('rect', { x: OX, y: OY, width: pw, height: ph, fill: '#fafafa', stroke: '#1a1a1b', 'stroke-width': 2 }), tx(OX + 8, OY + 16, 'PLANTA ESQUEMÁTICA (sin plano de referencia)', { 'font-size': 8.5, fill: '#667085' }));
    }
    const dev = (p, letra, etiq, dv, o) => { sg.append(sv('circle', Object.assign({ cx: X(p[0]), cy: Y(p[1]), r: 10, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.6, 'data-dev': dv }, o || {})), tx(X(p[0]), Y(p[1]) + 3.5, letra, { 'text-anchor': 'middle', 'font-weight': 700 })); if (etiq) sg.append(tx(X(p[0]) + 14, Y(p[1]) + 3.5, etiq, Object.assign({ 'font-size': 8.5 }, halo))); };
    const lin = (p, q, n, o) => { sg.append(sv('line', Object.assign({ x1: X(p[0]), y1: Y(p[1]), x2: X(q[0]), y2: Y(q[1]), stroke: '#1a1a1b', 'stroke-width': 1.3 }, o || {}))); return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, n]; };
    /* posiciones derivadas de los símbolos del plano */
    const cen = ZRT && DF ? [(ZRT[0] + DF[0]) / 2, (ZRT[1] + DF[1]) / 2] : null;
    const signo = CRN && cen ? (CRN[0] > cen[0] ? 1 : -1) : 1;
    const X45 = cen ? [cen[0] + signo * 40, cen[1] - 58] : (CRN ? [CRN[0] - 49, CRN[1] + 70] : null);
    const BA = cen ? [cen[0] - signo * 15, cen[1] + 60] : null;
    const c = (a.C || []).find((q) => V && Math.abs(q[0] - V[0]) < 30 && Math.abs(q[1] - V[1]) < 30) || (a.C || [])[0] || null;
    const door = c || V;
    const bed1 = T ? [pl.w * 0.5, Math.max(y0 + 50, T[1] - 150)] : null;
    const bed2 = bed1 ? [Math.min(pl.w - 40, bed1[0] + 90), bed1[1] + 70] : null;
    const bB = door ? [door[0] + 40, pl.h + 10] : [pl.w * 0.5, pl.h + 10];
    const yB = OY + ph + 30;
    const marcas = [];
    /* cableados con su número */
    if (T && BA && num(t.pirC) > 0) marcas.push(lin(BA, T, 7, { stroke: '#0b6bcb', 'stroke-width': 1.5 }));
    if (T && X45) marcas.push(lin(T, X45, 1, { stroke: '#b42318' }));
    if (X45 && ZRT) marcas.push(lin(X45, ZRT, 4, { stroke: '#b42318', 'stroke-width': 1 }));
    if (X45 && DF) marcas.push(lin(X45, DF, 5, { stroke: '#b42318', 'stroke-width': 1 }));
    if (X45 && door) marcas.push(lin(door, X45, 6, { stroke: '#667085', 'stroke-dasharray': '4 3' }));
    if (T && FB) { const el = lin(T, [(FB[0] + FB[2]) / 2, (FB[1] + FB[3]) / 2], 2, { stroke: '#1b7f3b', 'stroke-width': 1.5, 'data-dev': 'valvula' }); marcas.push(el); }
    if (T && bed1 && num(t.pirRF) > 0) marcas.push(lin(bed1, T, 8, { stroke: '#7c3aed', 'stroke-dasharray': '3 3', 'stroke-width': 1 }));
    if (T && V) marcas.push(lin(V, T, 11, { stroke: '#7c3aed', 'stroke-dasharray': '2 3', 'stroke-width': 1 }));
    if (T) { sg.append(sv('line', { x1: X(T[0]), y1: Y(T[1]), x2: X(bB[0]), y2: yB, stroke: '#7c3aed', 'stroke-dasharray': '6 4', 'stroke-width': 1.5 })); marcas.push([(T[0] + bB[0]) / 2, T[1] + (pl.h + 10 - T[1]) * 0.75, 9, true]); }
    if (X45) { const rx = [X45[0] + 30, X45[1]]; sg.append(sv('line', { x1: X(X45[0]) + 22, y1: Y(X45[1]), x2: X(X45[0]) + 52, y2: Y(X45[1]), stroke: '#b42318', 'stroke-width': 1.3, 'data-dev': 'luz' }), tx(X(X45[0]) + 56, Y(X45[1]) + 3, 'relé ilum.', Object.assign({ 'font-size': 7.5 }, halo))); marcas.push([X45[0] + 40, X45[1] - 6, 3]); }
    /* símbolos */
    if (FB) sg.append(sv('rect', { x: X(FB[0]), y: Y(FB[1]), width: (FB[2] - FB[0]) * s, height: (FB[3] - FB[1]) * s, fill: 'none', stroke: '#1b7f3b', 'stroke-width': 2, 'data-dev': 'fcu' }), tx(X(FB[0]) + 3, Y(FB[1]) - 3, 'FCU-HAB', Object.assign({ 'font-size': 8.5, 'font-weight': 700, fill: '#1b7f3b' }, halo)));
    [ZRT && ['ZRT', ZRT, 'zrt'], DF && ['DF', DF, 'df']].filter(Boolean).forEach(([n2, p, dv]) => sg.append(sv('rect', { x: X(p[0]) - 12, y: Y(p[1]) - 7, width: 24, height: 14, fill: '#fff', stroke: '#b42318', 'stroke-width': 1.2, 'data-dev': dv }), tx(X(p[0]), Y(p[1]) + 3, n2, { 'text-anchor': 'middle', 'font-size': 8, fill: '#b42318' })));
    if (X45) { sg.append(sv('rect', { x: X(X45[0]) - 22, y: Y(X45[1]) - 14, width: 44, height: 28, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.6, 'data-dev': 'x45' }), tx(X(X45[0]), Y(X45[1]) - 2, 'X45B', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 }), tx(X(X45[0]), Y(X45[1]) + 9, 'X06', { 'text-anchor': 'middle', 'font-weight': 700, 'font-size': 8 })); }
    if (T) dev(T, 'T', TERMOS[termoDe(t)].corto, 'e7');
    if (T && termoDe(t) === 'd1_529') { const dp = [T[0] - 52, T[1] + 34]; sg.append(sv('line', { x1: X(T[0]), y1: Y(T[1]), x2: X(dp[0]), y2: Y(dp[1]), stroke: '#7c3aed', 'stroke-dasharray': '3 2', 'stroke-width': 1 }), sv('rect', { x: X(dp[0]) - 18, y: Y(dp[1]) - 8, width: 36, height: 16, fill: '#fff', stroke: '#1a1a1b', 'stroke-width': 1.4, 'data-dev': 'dx47' }), tx(X(dp[0]), Y(dp[1]) + 3.5, 'D-X47', { 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 700 })); marcas.push([(T[0] + dp[0]) / 2, (T[1] + dp[1]) / 2 - 8, 12]); }
    if (BA && num(t.pirC) > 0) dev(BA, 'S', 'K594C (baño)', 'pirC', { 'stroke-dasharray': '3 2' });
    if (bed1 && num(t.pirRF) > 0) dev(bed1, 'S', 'K594.RF (dormitorio)', 'pirRF');
    if (bed2 && num(t.pirRF) > 1) dev(bed2, 'S', 'K594.RF (sala)', 'pirRF');
    if (door) dev(door, 'C', 'S241 / S541.RF', 'puerta', { r: 9 });
    if (V) dev(V, 'V', 'VingCard', 'vingcard', { r: 8 });
    sg.append(sv('rect', { x: X(bB[0]) - 30, y: yB - 6, width: 60, height: 26, fill: '#ede9fe', stroke: '#7c3aed', 'stroke-width': 1.5, 'data-dev': 'b578' }), tx(X(bB[0]), yB + 11, 'G · ' + (esD1(t) ? 'D578' : 'B578'), { 'text-anchor': 'middle', 'font-weight': 700, fill: '#5b21b6' }));
    sg.append(sv('line', { x1: X(bB[0]), y1: yB + 20, x2: X(bB[0]), y2: yB + 38, stroke: '#1a1a1b', 'stroke-width': 1.3, 'data-dev': 'poe' }), tx(X(bB[0]) + 6, yB + 38, 'a switch PoE', Object.assign({ 'font-size': 8 }, halo)));
    marcas.push([bB[0] - 0, pl.h + 10 + 0, 10, false, true]);
    marcas.forEach((m) => { if (m[4]) badge(sg, X(bB[0]) + 16, yB + 29, 10); else badge(sg, X(m[0]), m[3] ? Math.min(Y(m[1]), yB - 20) : Y(m[1]), m[2]); });
    /* leyenda, notas, esquema y cableados */
    const yEnd = leyendaHabitacion(sg, lx, OY - 10, t, W);
    const yE = Math.max(yEnd + 34, OY + 40);
    esquemaHabitacion(sg, lx, yE, t);
    tablaCables(sg, lx + 490, yE, 410);
    const H = Math.round(Math.max(OY + ph + 80, yE + 270));
    sg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    sg.firstChild.setAttribute('height', H);
    return sg;
  }

  /* Verifica que cada dispositivo calce entre la lista, la planta, el esquema y los cableados */
  function verificar(t, svg) {
    TA = t;
    const tiene = (sel) => !!svg.querySelector(sel);
    const ESQ = {};
    const filas = [
      ['e7', 'Termostato ' + TERMOS[termoDe(t)].corto + ' (T)', num(t.e7)], ['dx47', 'Controlador D-X47', termoDe(t) === 'd1_529' ? num(t.e7) : 0], ['x45', 'Módulo X45B-X06 y caja', num(t.x45)], ['pirC', 'Sensor K594C (baño)', num(t.pirC)], ['pirRF', 'Sensor K594.RF (pared)', num(t.pirRF)],
      ['puerta', 'Contacto de puerta (C)', num(t.puerta)], ['vingcard', 'Cerradura VingCard (V), por otros', 1], ['zrt', 'Damper ZRT, por otros', 1], ['df', 'Damper DF, por otros', 1],
      ['fcu', 'FCU-HAB, por otros', 1], ['valvula', 'Válvula de agua helada 24 V, por otros', 1], ['luz', 'Relé de iluminación, por otros', 1], ['b578', 'Gateway ' + (esD1(t) ? 'D578' : 'B578') + ' (1 por nivel)', 1], ['poe', 'Switch PoE del nivel, por otros', 1]
    ];
    return filas.map(([k, nombre, q]) => {
      const lis = q > 0 ? tiene('[data-lis~="' + k + '"]') : true, pl = q > 0 ? tiene('[data-dev="' + k + '"]') : true, esq = q > 0 ? tiene('[data-esq="' + k + '"]') : true, cab = nCab(k);
      return { k, nombre, q, lis, pl, esq, cab, ok: lis && pl && esq && (cab.length > 0 || q === 0) };
    });
  }

  function svgHabitacion(t, cant) {
    const pl = (window.BMS_GRMS_PLANTAS || {})[t.plano];
    if (pl) return svgHabitacionPlano(t, cant, pl);
    /* sin plano de referencia: planta esquemática con las mismas posiciones relativas que los planos ED-41xx */
    return svgHabitacionPlano(t, cant, { w: 520, h: 500, img: null, a: { T: [[300, 250]], ZRT: [[250, 360]], DF: [[320, 365]], CRN: [[400, 300]], V: [[150, 460]], C: [[160, 450]], FB: [[70, 330, 190, 380]], FCU: [[90, 320]] } });
  }

  function svgNivel(l) {
    const g = G(), W = 900, H = 400, s = sv('svg', { xmlns: NS, viewBox: `0 0 ${W} ${H}`, 'font-family': 'Arial, Helvetica, sans-serif' });
    s.append(marco(W, H), tx(20, 24, 'NIVEL ' + (l.n.codigo || '') + ' — ' + (l.n.nombre || '') + ' · ' + l.habs + ' habitaciones · ' + l.b578 + ' B578' + (l.d578 ? ' · ' + l.d578 + ' D578' : '') + ' · ' + l.puertos + ' puertos PoE', { 'font-size': 13, 'font-weight': 700 }));
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
      const nRt = p.b578 + p.d578;
      for (let k = 0; k < nRt; k++) {
        const bx = x + w * (k + 0.5) / nRt, esD = k >= p.b578;
        s.append(sv('circle', { cx: bx, cy: Y, r: Math.min(ancho * (G().param.coberturaM / Math.max(l.pas.reduce((a, q) => a + q.largo, 0), G().param.coberturaM)) / 2, 150), fill: 'none', stroke: esD ? '#b45309' : '#7c3aed', 'stroke-dasharray': '3 4', opacity: 0.35 }));
        s.append(sv('rect', { x: bx - 14, y: Y - 10, width: 28, height: 20, fill: esD ? '#fef3c7' : '#ede9fe', stroke: esD ? '#b45309' : '#7c3aed', 'stroke-width': 1.4 }), tx(bx, Y + 4, esD ? 'D578' : 'B578', { 'text-anchor': 'middle', 'font-size': 8, 'font-weight': 700, fill: esD ? '#92400e' : '#5b21b6' }));
      }
      s.append(tx(x + w / 2, 52, p.nombre + ' · ' + p.habs + ' hab. · ' + p.largo + ' m · ' + p.b578 + ' B578' + (p.d578 ? ' + ' + p.d578 + ' D578' : ''), { 'text-anchor': 'middle', 'font-size': 8.5, fill: '#374151' }));
      x += w;
    });
    let ly = 300; s.append(tx(20, ly, 'TIPOS DE HABITACIÓN', { 'font-weight': 700, 'font-size': 9 })); ly += 14; let lx = 20;
    g.tipos.filter((t) => l.cant[t.id]).forEach((t) => { s.append(sv('rect', { x: lx, y: ly - 9, width: 12, height: 12, fill: colorTipo(t.id), stroke: '#6b7280' }), tx(lx + 16, ly + 1, t.nombre + ' (' + l.cant[t.id] + ')', { 'font-size': 8.5 })); lx += 28 + t.nombre.length * 5 + 22; if (lx > 760) { lx = 20; ly += 16; } });
    ly += 28;
    s.append(tx(20, ly, 'POR NIVEL: ' + POR_HAB.filter((k) => l.disp[k]).map((k) => l.disp[k] + '× ' + DISP.find((d) => d.k === k).parte).join(' · ') + ' · ' + l.b578 + '× B578' + (l.d578 ? ' · ' + l.d578 + '× D578' : ''), { 'font-size': 8.5 }));
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
      for (let k = 0; k < Math.min(l.b578 + l.d578, 12); k++) { const esD = k >= l.b578; s.append(sv('rect', { x: 320 + k * 50, y: y - 16, width: 42, height: 26, fill: esD ? '#fef3c7' : '#ede9fe', stroke: esD ? '#b45309' : '#7c3aed' }), tx(341 + k * 50, y + 1, esD ? 'D578' : 'B578', { 'text-anchor': 'middle', 'font-size': 8, fill: esD ? '#92400e' : '#5b21b6', 'font-weight': 700 })); }
      s.append(sv('line', { x1: 290, y1: y - 2, x2: 320, y2: y - 2, stroke: '#b42318' }), tx(W - 20, y + 2, l.b578 + ' B578' + (l.d578 ? ' + ' + l.d578 + ' D578' : '') + ' · ' + l.puertos + ' puertos', { 'text-anchor': 'end', 'font-size': 8.5, fill: '#374151' }));
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
  const filasNivel = (c) => c.niveles.map((l) => [l.n.codigo || '', l.habs, ...POR_HAB.map((k) => l.disp[k]), l.b578, l.d578, l.puertos, l.switches]);
  const COLS_NIVEL = ['Nivel', 'Hab.', ...POR_HAB.map((k) => DISP.find((d) => d.k === k).parte), 'B578', 'D578', 'Puertos PoE', 'Switch'];

  const exportarXlsx = async (c) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const wb = new ExcelJS.Workbook(), P = BMS.estado.proyecto;
    const hoja = (nombre, cols, filas, anchos) => {
      const ws = wb.addWorksheet(nombre); ws.addRow(cols).font = { bold: true };
      filas.forEach((f) => ws.addRow(f)); (anchos || []).forEach((w, i) => { ws.getColumn(i + 1).width = w; });
      ws.getRow(1).border = { bottom: { style: 'medium' } }; ws.views = [{ state: 'frozen', ySplit: 1 }];
    };
    hoja('Dispositivos por nivel', COLS_NIVEL, filasNivel(c).concat([['TOTAL', c.tot.habs, ...POR_HAB.map((k) => c.tot[k]), c.tot.b578, c.tot.d578, c.tot.puertos, c.tot.switches]]), [10, 8, 12, 12, 12, 12, 12, 16, 14, 16, 12, 10, 10, 12, 10]);
    const pas = []; c.niveles.forEach((l) => l.pas.forEach((p) => pas.push([l.n.codigo || '', p.nombre, p.habs, p.largo, p.b578, p.d578])));
    hoja('Pasillos', ['Nivel', 'Pasillo', 'Habitaciones', 'Largo (m)', 'B578', 'D578'], pas, [10, 24, 14, 12, 8, 8]);
    const tp = []; G().tipos.forEach((t) => tp.push([t.nombre, t.plano, c.niveles.reduce((a, l) => a + (l.cant[t.id] || 0), 0), TERMOS[termoDe(t)].corto + ' × ' + num(t.e7), num(t.x45), num(t.pirC), num(t.pirRF), num(t.puerta), num(t.pc502)]));
    hoja('Tipos de habitación', ['Tipo', 'Plano', 'Cantidad', 'Termostato', 'X45B-X06', 'K594C (baño)', 'K594.RF (pared)', 'Contacto de puerta', 'PC-502'], tp, [26, 12, 10, 8, 12, 14, 16, 18, 10]);
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
    /* Cada bloque (título h3) queda en una sección que se puede cerrar; el estado se recuerda al volver a pintar la pestaña. */
    const plegar = () => {
      const ab = BMS.ui.grmsAb || (BMS.ui.grmsAb = {});
      const out = [], fin = [], dets = [];
      let cur = null;
      const abre = (titulo, def) => {
        const d = document.createElement('details'); d.className = 'grms-sec'; d.open = ab[titulo] !== undefined ? ab[titulo] : def;
        const sm = document.createElement('summary'); sm.textContent = titulo; d.append(sm);
        d.addEventListener('toggle', () => { ab[titulo] = d.open; });
        out.push(d); dets.push([d, titulo]); cur = d;
      };
      [...root.children].forEach((n, i) => {
        if (i < 2 && (n.tagName === 'H2' || n.classList.contains('hint'))) { out.push(n); return; }
        if (n.classList && n.classList.contains('noprint')) { fin.push(n); return; }
        if (n.tagName === 'H3') { abre(n.textContent, true); return; }
        if (!cur) abre('Parámetros del cálculo', true);
        cur.append(n);
      });
      const barra = h('div', { class: 'fila noprint' }, h('button', { class: 'b s', onclick: () => { dets.forEach(([d, t]) => { d.open = false; ab[t] = false; }); } }, 'Cerrar todas las secciones'), h('button', { class: 'b s', onclick: () => { dets.forEach(([d, t]) => { d.open = true; ab[t] = true; }); } }, 'Abrir todas'));
      out.splice(Math.min(2, out.length), 0, barra);
      root.replaceChildren(...out, ...fin);
    };
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
      h('td', { class: 'c' }, h('select', { class: 'in', value: termoDe(t), title: 'Modelo de termostato del GRMS: INNCOM e7 (Deep Mesh, router B578, servidor IC3) o INNCOM D1 (INNCOM Direct, router D578)', onchange: (e) => { t.termo = e.target.value; guarda(); } }, Object.keys(TERMOS).map((k) => h('option', { value: k }, TERMOS[k].n)))),
      ['e7', 'x45', 'caja', 'pirC', 'pirRF', 'puerta', 'pc502'].map((k) => h('td', { class: 'c' }, nin(num(t[k]), (v) => { t[k] = v; guarda(); }))),
      h('td', { class: 'c' }, h('select', { class: 'in', value: String(t.camas), onchange: (e) => { t.camas = Number(e.target.value); guarda(); } }, h('option', { value: '1' }, '1 cama'), h('option', { value: '2' }, '2 camas'))),
      h('td', { class: 'c' }, h('input', { type: 'checkbox', checked: !!t.suite, onchange: (e) => { t.suite = e.target.checked; guarda(); } })),
      h('td', { class: 'c' }, h('button', { class: 'b x', onclick: () => { if (g.tipos.length > 1) { g.tipos.splice(i, 1); guarda(); } } }, '✕'))));
    root.append(h('h3', null, 'Tipos de habitación y dispositivos por habitación'),
      h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Tipo', 'Plano', 'Modelo de termostato', 'Termostatos por habitación', 'Módulo X45B-X06', 'Caja', 'Sensor K594C (baño)', 'Sensor K594.RF (pared)', 'Contacto de puerta', 'PC-502', 'Camas', 'Suite', ''].map((x) => h('th', null, x)))), h('tbody', null, filasT))),
      h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => { g.tipos.push({ id: 't' + Date.now(), nombre: 'Nuevo tipo', plano: '', camas: 1, suite: false, termo: 'e7', e7: 1, x45: 1, caja: 1, pirC: 1, pirRF: 1, puerta: 1, pc502: 0 }); guarda(); } }, '+ Agregar tipo de habitación'),
        h('button', { class: 'b', onclick: () => { if (confirm('Se restablecen los tipos de habitación de los planos ED-4102 a ED-4112. ¿Continuar?')) { g.tipos = clone(TIPOS_BASE); g.niveles = {}; guarda(); } } }, 'Restablecer tipos de los planos')));

    /* por nivel */
    const est = estadoGrms();
    root.append(h('h3', null, 'Habitaciones por nivel y tipo'),
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

    /* pasillos por nivel (tabla compacta): cada pasillo se liga a un nivel con su selector de nivel */
    const filasP = [];
    const selNivel = (valor, onch, w) => h('select', { class: 'in', value: valor, style: { width: w || '110px', padding: '3px 6px' }, onchange: onch }, E.niveles.map((n) => h('option', { value: n.id }, (n.codigo || '') + ' · ' + (n.nombre || ''))));
    E.niveles.forEach((n) => {
      const cfg = cfgNivel(n), l = c.niveles.find((x) => x.n.id === n.id);
      if (!l && cfg.pasillos.length < 2) return;
      cfg.pasillos.forEach((p, i) => filasP.push(h('tr', null,
        h('td', null, selNivel(n.id, (e) => { const dest = cfgNivel(E.niveles.find((x) => x.id === e.target.value)); cfg.pasillos.splice(i, 1); dest.pasillos.push(p); guarda(); })),
        h('td', null, h('input', { class: 'in', value: p.nombre, style: { width: '130px', padding: '3px 6px' }, onchange: (e) => { p.nombre = e.target.value; guarda(); } })),
        h('td', { class: 'c' }, nc(num(p.largo), (v) => { p.largo = v; guarda(); })),
        h('td', { class: 'c' }, cfg.pasillos.length === 1 && l ? h('span', null, l.habs) : nc(num(p.habs), (v) => { p.habs = v; guarda(); })),
        h('td', { class: 'c' }, l && l.pas[i] ? l.pas[i].b578 : 0),
        h('td', { class: 'c' }, cfg.pasillos.length > 1 ? h('button', { class: 'b x s', title: 'Quitar este pasillo', onclick: () => { cfg.pasillos.splice(i, 1); guarda(); } }, '✕') : null),
        h('td', null, i === 0 && l && l.avisoPas ? h('span', { class: 'chip bad' }, 'Pasillos suman ' + l.sumaP + ' de ' + l.habs) : null))));
    });
    const nuevoNivel = { v: (BMS.ui.grmsPasNivel && E.niveles.find((n) => n.id === BMS.ui.grmsPasNivel) ? BMS.ui.grmsPasNivel : (c.niveles[0] ? c.niveles[0].n.id : E.niveles[0].id)) };
    const agregar = h('div', { class: 'fila' },
      h('label', { class: 'f' }, 'Agregar pasillo al nivel', selNivel(nuevoNivel.v, (e) => { nuevoNivel.v = e.target.value; BMS.ui.grmsPasNivel = e.target.value; }, '180px')),
      h('button', { class: 'b p', onclick: () => { const nn = E.niveles.find((x) => x.id === nuevoNivel.v), cf = cfgNivel(nn); cf.pasillos.push({ id: BMS.uid(), nombre: 'Pasillo ' + (cf.pasillos.length + 1), largo: 40, habs: 0 }); BMS.ui.grmsPasNivel = nn.id; guarda(); } }, '+ Agregar pasillo'));
    root.append(h('h3', null, 'Pasillos por nivel'), agregar,
      filasP.length ? h('div', { class: 'scroll' }, h('table', { class: 't', style: { maxWidth: '860px' } }, h('thead', null, h('tr', null, ['Nivel', 'Pasillo', 'Largo (m)', 'Habitaciones', 'B578', '', ''].map((x, i) => h('th', { class: i > 1 ? 'c' : '' }, x)))), h('tbody', null, filasP))) : h('p', { class: 'hint' }, 'Los niveles con habitaciones aparecen aquí con su pasillo. Con más de un pasillo en un nivel, indique cuántas habitaciones atiende cada uno; el selector «Nivel» de cada fila permite pasarlo a otro nivel.'));

    if (!c.niveles.length) { root.append(h('div', { class: 'warnbox' }, 'Ningún nivel tiene habitaciones. Indique la cantidad por tipo en la tabla de arriba.')); plegar(); return; }

    /* resultados */
    root.append(h('h3', null, 'Dispositivos por nivel'),
      tabla(COLS_NIVEL, filasNivel(c).concat([[h('b', null, 'TOTAL'), h('b', null, c.tot.habs), ...POR_HAB.map((k) => h('b', null, c.tot[k])), h('b', null, c.tot.b578), h('b', null, c.tot.d578), h('b', null, c.tot.puertos), h('b', null, c.tot.switches)]]), ['', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r']));
    const filasPas = []; c.niveles.forEach((l) => l.pas.forEach((p) => filasPas.push([l.n.codigo || '', p.nombre, p.habs, p.largo + ' m', p.b578, p.d578])));
    root.append(h('h3', null, 'Dispositivos por pasillo'), tabla(['Nivel', 'Pasillo', 'Habitaciones', 'Largo', 'B578', 'D578'], filasPas, ['', '', 'r', 'r', 'r', 'r']),
      h('p', { class: 'hint' }, 'En cada habitación: termostato (INNCOM e7 o D1, según el tipo; los e7 usan routers B578 y los D1 routers D578), módulo de relés X45B-X06 en su caja, sensor de movimiento y contacto de puerta, según el tipo. Los dampers de extracción (ZRT) y aire fresco (DF), el FCU y su válvula los suministran otros.'));

    /* diagramas */
    const tSel = g.tipos.find((t) => t.id === vista.tipo) || g.tipos[0], lSel = c.niveles.find((l) => l.n.id === vista.nivel) || c.niveles[0];
    const sHab = svgHabitacion(tSel, c.niveles.reduce((a, l) => a + (l.cant[tSel.id] || 0), 0)), sNiv = svgNivel(lSel), sAsc = svgAscenso(c);
    const ver = verificar(tSel, sHab), nBad = ver.filter((v) => !v.ok).length;
    const marcoSvg = (s) => { const d = h('div', { style: { overflow: 'auto', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', padding: '6px' } }); s.setAttribute('style', 'width:100%;height:auto;display:block;max-width:1100px'); d.append(s); return d; };
    root.append(h('h3', null, 'Diagrama de habitación'),
      h('div', { class: 'fila' }, h('label', { class: 'f' }, 'Tipo', h('select', { class: 'in', value: tSel.id, onchange: (e) => { vista.tipo = e.target.value; BMS.rerender(); } }, g.tipos.map((t) => h('option', { value: t.id }, t.nombre)))),
        h('button', { class: 'b', onclick: () => descargaSvg(sHab, 'GRMS-habitacion-' + tSel.nombre.replace(/\W+/g, '_')) }, 'Descargar SVG'),
        h('button', { class: 'b', onclick: () => BMS.descargar('GRMS-habitacion-' + tSel.nombre.replace(/\W+/g, '_') + '.dxf', BMS.svgADxf(sHab.cloneNode(true)), 'application/dxf') }, 'Descargar DXF')),
      h('label', { class: 'f', style: { maxWidth: '900px' } }, 'Notas del diagrama de habitación (se imprimen a la derecha de la planta; use {plano} para el número de plano)',
        h('textarea', { class: 'in', rows: 6, style: { width: '100%', fontFamily: 'inherit' }, onchange: (e) => { g.notas = e.target.value; BMS.touch(); BMS.rerender(); } }, g.notas || ''),
        h('span', null, h('button', { class: 'b s', onclick: () => { g.notas = NOTAS_BASE; BMS.touch(); BMS.rerender(); } }, 'Restablecer notas'))),
      marcoSvg(sHab),
      h('h4', { style: { margin: '14px 0 6px' } }, 'Verificación de dispositivos: lista, planta, esquema y cableados ', nBad ? h('span', { class: 'chip bad' }, nBad + ' sin calzar') : h('span', { class: 'chip ok' }, 'todo calza')),
      tabla(['Dispositivo', 'Cant. por habitación', 'Lista', 'Planta', 'Esquema', 'Cableados', 'Estado'], ver.map((v) => [v.nombre, v.q, v.lis ? '✓' : '✗', v.pl ? '✓' : '✗', v.esq ? '✓' : '✗', v.cab.join(' · ') || '—', v.ok ? '✓' : '⚠']), ['', 'r', 'c', 'c', 'c', 'c', 'c']),
      h('p', { class: 'hint' }, 'Cada dispositivo debe aparecer en la lista de dispositivos, en la planta, en el esquema y en al menos un cableado numerado. Los números de los cableados son los mismos en la planta, el esquema y la tabla de cableados del diagrama. Las posiciones de los sensores de movimiento son indicativas.'),
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
    plegar();
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
