/* Cálculos: puntos por equipo, nivel y controlador; reserva; selección de controladores y motor de red. */
(function () {
  const { num } = BMS;
  const CLASES = ['ai', 'ao', 'di', 'do'];

  const nivelDe = (id) => BMS.estado.niveles.find((n) => n.id === id);
  const tipoDe = (id) => BMS.catEq.tipos.find((t) => t.id === id);
  const catDe = (id) => BMS.catEq.categorias.find((c) => c.id === id);
  const nombreCtrl = (c) => {
    const n = nivelDe(c.nivel);
    return c.tipo + '-' + (n ? n.codigo : '??') + '-' + String(c.consec || 0).padStart(2, '0');
  };
  const ctrlDe = (id) => BMS.estado.controladores.find((c) => c.id === id);
  const vacio = () => ({ ai: 0, ao: 0, di: 0, do: 0, int: 0, eq: 0, filas: 0 });
  const sumar = (a, b) => { for (const k of [...CLASES, 'int']) a[k] += b[k]; a.eq += b.eq; a.filas += 1; };
  const cable = (t) => t.ai + t.ao + t.di + t.do;
  const conReserva = (t, pct) => {
    const f = 1 + num(pct) / 100, r = {};
    for (const k of CLASES) r[k] = Math.ceil(t[k] * f - 1e-9);
    return r;
  };

  /* Paneles (gabinetes) estándar y unidades equivalentes que admiten:
     controlador base = 2, módulo IO = 1, más 2 de fuente y protecciones (y 2 del motor de red en el principal). Valores de referencia editables por controlador. */
  /* Cajas plásticas con tapa transparente de Schneider Electric (Thalassa): PLA en ABS/policarbonato hasta 50 x 40 cm y PLM en poliéster desde 70 x 50 cm.
     Las dimensiones son de referencia y la referencia comercial exacta se confirma con el catálogo vigente. */
  const PANELES = [
    ['24 x 18 cm', 4, 'Schneider Thalassa PLA — caja plástica con tapa transparente'],
    ['40 x 30 cm', 8, 'Schneider Thalassa PLA — caja plástica con tapa transparente'],
    ['50 x 40 cm', 12, 'Schneider Thalassa PLA — caja plástica con tapa transparente'],
    ['70 x 50 cm', 20, 'Schneider Thalassa PLM — caja de poliéster con tapa transparente'],
    ['100 x 80 cm', 40, 'Schneider Thalassa PLM — caja de poliéster con tapa transparente'],
    ['120 x 100 cm', 70, 'Schneider Thalassa PLM — caja de poliéster con tapa transparente']
  ];
  const panelCanon = (dim) => { const q = String(dim || '').replace(/\s/g, '').toLowerCase(); const p = PANELES.find((x) => x[0].replace(/\s/g, '').toLowerCase() === q); return p ? p[0] : dim; };
  const panelModelo = (dim) => { const p = PANELES.find((x) => x[0] === panelCanon(dim)); return p ? p[2] : 'Caja a medida (' + dim + ')'; };
  const panelSugerido = (u) => (PANELES.find((p) => p[1] >= u) || PANELES[PANELES.length - 1])[0];
  /* Gabinete: el que se escribió a mano; si no, los controladores del mismo nivel y del mismo cuarto comparten un gabinete automático. */
  const gabDe = (c) => {
    if (c.gab) return c.gab;
    const E = BMS.estado, cuarto = (x) => String(x.ubicacion || '').trim().toLowerCase();
    if (!cuarto(c)) return '';
    const mismos = E.controladores.filter((x) => !x.gab && x.nivel === c.nivel && cuarto(x) === cuarto(c));
    if (mismos.length < 2) return '';
    const niv = E.niveles.find((n) => n.id === c.nivel), cod = niv ? niv.codigo : '';
    const cuartos = []; E.controladores.forEach((x) => { if (!x.gab && x.nivel === c.nivel && cuarto(x) && E.controladores.filter((y) => !y.gab && y.nivel === c.nivel && cuarto(y) === cuarto(x)).length > 1 && !cuartos.includes(cuarto(x))) cuartos.push(cuarto(x)); });
    return 'GAB-' + cod + '-' + String(cuartos.indexOf(cuarto(c)) + 1).padStart(2, '0');
  };
  const unidadesPanel = (c, detMap) => {
    const E = BMS.estado, uno = (x) => { const d = detMap[x.id]; return d && d.cfg ? 2 * (d.cfg.baseQty || 0) + Object.values(d.cfg.modulos || {}).reduce((a, y) => a + y, 0) : 0; };
    const g = gabDe(c), miembros = g ? E.controladores.filter((x) => gabDe(x) === g) : [c];
    return miembros.reduce((a, x) => a + uno(x), 0) + 2 + (c.tipo === 'CP' ? 2 : 0);
  };

  /* Panel o equipo con BACnet/IP: sus señales son internas del panel y llegan al BMS por la red (INT), no por cable. */
  /* Comunicación del equipo: D señales cableadas, A BACnet/IP, B BACnet MS/TP, C Modbus RTU, E Modbus TCP/IP.
     Distinta de D = el equipo es un dispositivo de red: sus señales son internas y llegan al BMS como INT. */
  const comDe = (eq, tipo) => {
    if (!tipo) return 'D';
    if (eq.com) return eq.com;
    if (eq.ip != null) return eq.ip ? 'A' : 'D';
    return tipo.com || (tipo.ip ? 'A' : 'D');
  };
  const esIP = (eq, tipo) => comDe(eq, tipo) !== 'D';

  /* Calcula todo el proyecto: filas de equipos con asignación de controlador y totales agrupados. */
  /* Equipos que se repiten en cada habitación: su cantidad es el número de habitaciones del nivel (si el nivel lo tiene definido). */
  const CANT_HAB = new Set(['fcu', 'fcu_simple']);
  /* el tag que lleva el código del nivel (FCU-HAB-N2) sigue al equipo cuando cambia de nivel o se renombra el nivel */
  const tagConNivel = (tag, a, b) => String(tag || '').replace(new RegExp('(^|[-_\\s])' + a + '(?=$|[-_\\s])', 'i'), (m, p) => p + b);
  const habsDe = (nivelId) => { const n = nivelDe(nivelId); return n && n.habs > 0 ? Math.round(n.habs) : 0; };
  const porHabCant = (eq) => CANT_HAB.has(eq.tipoId) && habsDe(eq.nivel) > 0;
  function todo() {
    const E = BMS.estado;
    E.equipos.forEach((eq) => { if (porHabCant(eq)) eq.qty = habsDe(eq.nivel); });
    const ctrlTotales = {}; E.controladores.forEach((c) => (ctrlTotales[c.id] = vacio()));
    const sin = vacio(), porNivel = {}, porCat = {}, filas = [];
    E.niveles.forEach((n) => (porNivel[n.id] = vacio()));
    BMS.catEq.categorias.forEach((c) => (porCat[c.id] = vacio()));
    const gwCtrl = {}; E.controladores.forEach((c) => (gwCtrl[c.id] = new Set()));
    const gwTodos = new Set();

    for (const eq of E.equipos) {
      const tipo = tipoDe(eq.tipoId);
      const qty = num(eq.qty);
      const f = { eq, tipo, ctrlId: null, auto: false, t: vacio(), puntos: [] };
      if (tipo) {
        const ip = esIP(eq, tipo);
        f.ip = ip; f.com = comDe(eq, tipo);
        for (const p of tipo.pts) {
          const incl = !(eq.excl || []).includes(p.id);
          const pt = { p, incl, ai: p.ai * qty, ao: p.ao * qty, di: p.di * qty, do: p.do * qty, int: p.int * qty };
          if (ip) { pt.int = pt.ai + pt.ao + pt.di + pt.do + pt.int; pt.ai = pt.ao = pt.di = pt.do = 0; }
          f.puntos.push(pt);
          if (incl) for (const k of [...CLASES, 'int']) f.t[k] += pt[k];
        }
        f.t.eq = qty;
      }
      /* Asignación de controlador */
      if (eq.ctrl && eq.ctrl !== 'auto' && ctrlDe(eq.ctrl)) f.ctrlId = eq.ctrl;
      else {
        f.auto = true;
        const cand = E.controladores.filter((c) => c.nivel === eq.nivel);
        const cs = cand.filter((c) => c.tipo === 'CS');
        let lista = cs.length ? cs : cand;
        /* Equipos que solo entran por gateway (INT) no necesitan controlador en su nivel: si no hay, van al principal. */
        if (!lista.length && cable(f.t) === 0 && f.t.int > 0) lista = E.controladores.filter((x) => x.tipo === 'CP');
        if (lista.length) f.ctrlId = lista.reduce((a, b) => (cable(ctrlTotales[b.id]) < cable(ctrlTotales[a.id]) ? b : a)).id;
      }
      const destino = f.ctrlId ? ctrlTotales[f.ctrlId] : sin;
      sumar(destino, f.t);
      if (porNivel[eq.nivel]) sumar(porNivel[eq.nivel], f.t);
      if (tipo && porCat[tipo.cat]) sumar(porCat[tipo.cat], f.t);
      if (tipo && tipo.gw && qty > 0) { gwTodos.add(tipo.gw); if (f.ctrlId) gwCtrl[f.ctrlId].add(tipo.gw); }
      filas.push(f);
    }
    const total = vacio(); Object.values(porNivel).forEach((t) => sumar(total, t));
    return { filas, ctrlTotales, sin, porNivel, porCat, total, gwCtrl, gwTodos };
  }

  /* ---- Selección de controladores ---- */
  const CANALES = ['ui', 'bi', 'co', 'bo', 'ao', 'uio'];
  const capVacia = () => ({ ui: 0, bi: 0, co: 0, bo: 0, ao: 0, uio: 0 });
  const capSumar = (c, m, q) => { const r = { ...c }; for (const k of CANALES) r[k] += (m[k] || 0) * q; return r; };
  const canalesDe = (m) => CANALES.reduce((s, k) => s + (m[k] || 0), 0);
  const falta = (r) => r.ai + r.ao + r.di + r.do;

  /* Reparte los requerimientos en los canales disponibles; devuelve lo que no cabe. */
  function asignar(req, cap) {
    const c = { ...cap }, n = { ai: req.ai, ao: req.ao, di: req.di, do: req.do };
    const tomar = (cl, ca) => { const t = Math.min(n[cl], c[ca]); n[cl] -= t; c[ca] -= t; };
    tomar('ai', 'ui');
    tomar('ao', 'ao'); tomar('ao', 'co');
    tomar('do', 'bo'); tomar('do', 'co');
    tomar('di', 'bi'); tomar('di', 'ui');
    /* Universales (UIO): cubren lo que falte de cualquier clase */
    tomar('ai', 'uio'); tomar('ao', 'uio'); tomar('do', 'uio'); tomar('di', 'uio');
    return n;
  }

  function resolver(req, M, base) {
    let nBase = 1, cap = capSumar(capVacia(), base, 1), mods = {}, nMods = 0, guard = 0;
    while (guard++ < 400) {
      const sin = asignar(req, cap);
      if (!falta(sin)) return { base: base.cod, baseQty: nBase, modulos: mods };
      if (nMods >= (base.maxMod || M.maxModulosPorBase) * nBase) { nBase++; cap = capSumar(cap, base, 1); continue; }
      let mejor = null;
      for (const m of M.modulos) {
        const r = falta(asignar(req, capSumar(cap, m, 1)));
        const red = falta(sin) - r;
        if (red <= 0) continue;
        const ok = r === 0;
        if (!mejor || (ok && !mejor.ok) || (ok === mejor.ok && (ok ? canalesDe(m) < canalesDe(mejor.m) : red > mejor.red || (red === mejor.red && (canalesDe(m) < canalesDe(mejor.m) || (canalesDe(m) === canalesDe(mejor.m) && (m.ui || 0) + (m.uio || 0) < (mejor.m.ui || 0) + (mejor.m.uio || 0)))))))
          mejor = { m, red, ok };
      }
      if (!mejor) break;
      mods[mejor.m.cod] = (mods[mejor.m.cod] || 0) + 1; nMods++;
      cap = capSumar(cap, mejor.m, 1);
    }
    return { base: base.cod, baseQty: nBase, modulos: mods };
  }

  /* Sugerencia automática: prueba cada controlador base y se queda con la que menos canales compra. */
  function sugerir(req, marcaId) {
    const M = BMS.catCt.marcas[marcaId];
    if (!M || !falta(req)) return { base: null, baseQty: 0, modulos: {} };
    let mejor = null, mejorOk = null, mejorTope = null;
    const mas = (a, b) => !b || a.score[0] < b.score[0] || (a.score[0] === b.score[0] && (a.score[1] < b.score[1] || (a.score[1] === b.score[1] && a.score[2] < b.score[2])));
    const proto = (BMS.estado.proyecto.protocolo || 'ip');
    const bases = M.bases.filter((b) => !b.com || b.com === proto);
    for (const b of (bases.length ? bases : M.bases)) {
      const s = resolver(req, M, b);
      const ev = evaluar(s, marcaId, req);
      const cand = { s, score: [ev.falta, ev.canales, Object.values(s.modulos).reduce((a, x) => a + x, 0) + s.baseQty] };
      if (mas(cand, mejor)) mejor = cand;
      /* Un controlador base con tope (maxBases) tiene prioridad mientras el panel quepa en esa cantidad; si no cabe se pasa a los demás. */
      if (!ev.falta && b.maxBases && s.baseQty <= b.maxBases && mas(cand, mejorTope)) mejorTope = cand;
      else if (!ev.falta && !b.maxBases && mas(cand, mejorOk)) mejorOk = cand;
    }
    mejor = mejorTope || mejorOk || mejor;
    return mejor.s;
  }

  /* Verifica una configuración (automática o manual) contra los requerimientos. */
  function evaluar(cfg, marcaId, req) {
    const M = BMS.catCt.marcas[marcaId];
    let cap = capVacia(), canales = 0;
    const b = M && M.bases.find((x) => x.cod === cfg.base);
    if (b) { cap = capSumar(cap, b, cfg.baseQty); canales += canalesDe(b) * cfg.baseQty; }
    for (const cod in cfg.modulos || {}) {
      const m = M && M.modulos.find((x) => x.cod === cod);
      if (m) { cap = capSumar(cap, m, cfg.modulos[cod]); canales += canalesDe(m) * cfg.modulos[cod]; }
    }
    const sin = asignar(req, cap);
    return { cap, canales, sin, falta: falta(sin), ok: falta(sin) === 0 };
  }

  /* Configuración vigente de un controlador (manual si coincide la marca; si no, automática). */
  function configurar(c, req, marcaId) {
    if (c.modo === 'manual' && c.manual && c.manual.marca === marcaId) return { cfg: c.manual, manual: true };
    return { cfg: sugerir(req, marcaId), manual: false };
  }

  /* Dispositivos que ve el motor de red y motor sugerido. */
  function motor(res, marcaId) {
    const M = BMS.catCt.marcas[marcaId];
    const P = BMS.estado.proyecto;
    let disp = res.gwTodos.size, bom = {};
    const detalle = BMS.estado.controladores.map((c) => {
      const t = res.ctrlTotales[c.id];
      const req = conReserva(t, P.reserva);
      const { cfg, manual } = configurar(c, req, marcaId);
      const ev = evaluar(cfg, marcaId, req);
      disp += (cfg.baseQty || 0) + Object.values(cfg.modulos || {}).reduce((a, x) => a + x, 0);
      if (cfg.base) bom[cfg.base] = (bom[cfg.base] || 0) + cfg.baseQty;
      for (const k in cfg.modulos || {}) bom[k] = (bom[k] || 0) + cfg.modulos[k];
      return { c, t, req, cfg, manual, ev };
    });
    let m = null;
    const lista = M ? [...M.motores].sort((a, b) => a.maxDisp - b.maxDisp) : [];
    if (P.motor && P.motor !== 'auto') m = lista.find((x) => x.cod === P.motor) || null;
    if (!m) m = lista.find((x) => x.maxDisp >= disp) || lista[lista.length - 1] || null;
    return { disp, motor: m, excede: m ? disp > m.maxDisp : false, detalle, bom };
  }

  /* Licencias de software por hardware (la marca las trae en su catálogo): una licencia núcleo con sus ampliaciones por cada estación Niagara (el motor de red y cada controlador Advanced adicional) y el supervisor según las estaciones. Devuelve null si la marca no tiene licencias cargadas. */
  function licencias(res, mot, marcaId) {
    const M = BMS.catCt.marcas[marcaId], L = M && M.licencias;
    if (!L) return null;
    const rx = new RegExp(L.aplica || '$^');
    const pts = (r) => r.ai + r.ao + r.di + r.do;
    const unidades = [];
    mot.detalle.forEach((d) => {
      const q = d.cfg.baseQty || 0;
      if (!d.cfg.base || !rx.test(d.cfg.base) || !q) return;
      const mods = Object.keys(d.cfg.modulos || {}).filter((k) => d.cfg.modulos[k]);
      const nMod = mods.reduce((a, k) => a + d.cfg.modulos[k], 0), bus = mods.reduce((a, k) => { const m = M.modulos.find((x) => x.cod === k); return a + (m ? canalesDe(m) * d.cfg.modulos[k] : 0); }, 0);
      for (let i = 0; i < q; i++) unidades.push({ c: d.c, disp: Math.ceil(nMod / q), global: Math.ceil(pts(d.req) / q) + Math.ceil((d.t.int || 0) / q), bus: Math.ceil(bus / q), hw: d.cfg.base });
    });
    const motorLic = !!(mot.motor && rx.test(mot.motor.cod));
    const globalRed = mot.detalle.reduce((a, d) => a + pts(d.req) + (d.t.int || 0), 0);
    const estaciones = [];
    if (motorLic) {
      const u0 = unidades.shift();
      estaciones.push({ nombre: 'Motor de red', hw: mot.motor.cod, c: u0 ? u0.c : null, disp: mot.disp, global: globalRed, bus: u0 ? u0.bus : 0 });
    }
    unidades.forEach((u) => estaciones.push({ nombre: 'Controlador Advanced adicional', hw: u.hw, c: u.c, disp: u.disp, global: u.global, bus: u.bus }));
    const nucleos = [...L.nucleo].sort((a, b) => a.ptsGlobal - b.ptsGlobal);
    estaciones.forEach((e) => {
      let n = nucleos.find((x) => x.disp >= e.disp && x.ptsGlobal >= e.global);
      const extra = [];
      if (!n) {
        n = nucleos[nucleos.length - 1];
        let dd = Math.max(0, e.disp - n.disp), gg = Math.max(0, e.global - n.ptsGlobal);
        for (const m of L.mejorasGlobal) { const q = Math.floor(Math.max(dd / m.disp, gg / m.ptsGlobal)); if (q > 0) { extra.push({ ...m, qty: q }); dd -= q * m.disp; gg -= q * m.ptsGlobal; } }
        if (dd > 0 || gg > 0) { const m = L.mejorasGlobal[L.mejorasGlobal.length - 1], q = Math.ceil(Math.max(dd / m.disp, gg / m.ptsGlobal)), ya = extra.find((x) => x.cod === m.cod); if (ya) ya.qty += q; else extra.push({ ...m, qty: q }); }
      }
      e.nucleo = n; e.extra = extra; e.excedeBus = false;
      if (e.bus > n.ptsBus) { const up = [...L.mejorasBus].sort((a, b) => a.ptsBus - b.ptsBus).find((x) => x.ptsBus >= e.bus); if (up) extra.push({ ...up, qty: 1 }); else e.excedeBus = true; }
    });
    const nEst = estaciones.length;
    const sup = nEst ? [...L.supervisor].sort((a, b) => a.conex - b.conex).find((x) => x.conex >= nEst) : null;
    const sd = [...(L.supervisorDisp || [])].sort((a, b) => a.disp - b.disp);
    const supDisp = nEst && sd.length ? (sd.find((x) => x.disp >= mot.disp && x.pts >= globalRed) || sd[sd.length - 1]) : null;
    const lista = [], suma = (cod, desc, tipo, qty) => { const ya = lista.find((r) => r.cod === cod); if (ya) ya.qty += qty; else lista.push({ cod, desc, tipo, qty }); };
    estaciones.forEach((e) => { suma(e.nucleo.cod, e.nucleo.desc, 'Licencia de controlador', 1); e.extra.forEach((x) => suma(x.cod, x.desc, 'Ampliación de licencia', x.qty)); });
    if (sup) { suma(sup.cod, sup.desc, 'Licencia de supervisor', 1); suma(sup.sma, 'Mantenimiento inicial de 18 meses del supervisor (SMA)', 'Mantenimiento', 1); }
    if (supDisp) suma(supDisp.cod, supDisp.desc, 'Licencia de supervisor', 1);
    return { estaciones, supervisor: sup, supervisorDisp: supDisp, lista, global: globalRed, nota: L.nota || '', porCtrl: estaciones.reduce((m, e) => { if (e.c) (m[e.c.id] = m[e.c.id] || []).push(e); return m; }, {}) };
  }

  /* Numeración de referencia por categoría (1.1, 1.2 …) para la matriz exportada. */
  function filasOrdenadas(res) {
    const E = BMS.estado;
    const ordNivel = (id) => E.niveles.findIndex((n) => n.id === id);
    const ordCat = (f) => BMS.catEq.categorias.findIndex((c) => c.id === (f.tipo && f.tipo.cat));
    const lista = res.filas.filter((f) => f.tipo).sort((a, b) => ordCat(a) - ordCat(b) || ordNivel(a.eq.nivel) - ordNivel(b.eq.nivel));
    const seq = {};
    lista.forEach((f) => { const c = ordCat(f) + 1; seq[c] = (seq[c] || 0) + 1; f.ref = c + '.' + seq[c]; });
    return lista;
  }

  Object.assign(BMS, { calc: { tagConNivel, habsDe, porHabCant, comDe, PANELES, panelCanon, panelModelo, gabDe, panelSugerido, unidadesPanel, esIP, todo, nivelDe, tipoDe, catDe, nombreCtrl, ctrlDe, cable, conReserva, sugerir, evaluar, configurar, motor, licencias, filasOrdenadas, asignar, CANALES, canalesDe, falta, vacio } });
})();
