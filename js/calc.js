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

  /* Calcula todo el proyecto: filas de equipos con asignación de controlador y totales agrupados. */
  function todo() {
    const E = BMS.estado;
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
        for (const p of tipo.pts) {
          const incl = !(eq.excl || []).includes(p.id);
          const pt = { p, incl, ai: p.ai * qty, ao: p.ao * qty, di: p.di * qty, do: p.do * qty, int: p.int * qty };
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
    for (const b of M.bases) {
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

  Object.assign(BMS, { calc: { todo, nivelDe, tipoDe, catDe, nombreCtrl, ctrlDe, cable, conReserva, sugerir, evaluar, configurar, motor, filasOrdenadas, asignar, CANALES, canalesDe, falta, vacio } });
})();
