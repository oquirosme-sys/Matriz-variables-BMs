/* Página 8: revisor del documento del fabricante. Se carga el Excel de selección que devuelve el fabricante, se compara contra el proyecto
   (hardware, licencias, integraciones y GRMS), se redactan las notas de lo que debe corregirse y se puede autocorregir el proyecto según el documento. */
(function () {
  const { h, num } = BMS;
  const txt = (x) => String(x == null ? '' : x).trim();
  const sinA = (sku) => txt(sku).replace(/PCA$/, 'PC');
  let doc = null, archivo = '', bitacora = [], deshacer = null;

  /* ---------- lectura del Excel del fabricante ---------- */
  const hoja = (wb, clave) => { const n = wb.SheetNames.find((x) => BMS.norm(x).includes(clave)); return n ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '' }) : null; };
  const tabla = (filas, clave0) => {
    if (!filas) return [];
    const hi = filas.findIndex((f) => BMS.norm(f[0]) === clave0);
    if (hi < 0) return [];
    const cab = filas[hi].map((x) => BMS.norm(x));
    const col = (k) => cab.findIndex((x) => x.includes(k));
    return filas.slice(hi + 1).filter((f) => txt(f[0]) || txt(f[1])).map((f) => ({ f, col, v: (k) => f[col(k)] }));
  };
  function parsear(wb) {
    const o = { ctrls: [], bom: [], integ: [], grms: [], resumen: [], notas: [] };
    tabla(hoja(wb, 'controladores y licencias'), 'controlador').forEach((r) => o.ctrls.push({ nombre: txt(r.f[0]), nivel: txt(r.v('nivel')), hw: txt(r.v('hardware')), lic: txt(r.v('licencia')), cap: txt(r.v('capacidad')), con: num(r.v('conexion')), obs: txt(r.v('observacion')) }));
    tabla(hoja(wb, 'bom licencias'), 'bloque').forEach((r) => o.bom.push({ bloque: txt(r.f[0]), sku: txt(r.v('sku')), desc: txt(r.v('descripcion')), cant: num(r.v('cantidad')), just: txt(r.v('justificacion')) }));
    tabla(hoja(wb, 'integraciones'), 'origen original').forEach((r) => o.integ.push({ origen: txt(r.f[0]), tag: txt(r.v('tag')), dev: num(r.v('cantidad')), pts: num(r.v('puntos')), destino: txt(r.v('destino')), incl: txt(r.v('incluido')) }));
    tabla(hoja(wb, 'grms objetos'), 'paquete').forEach((r) => o.grms.push({ paq: txt(r.f[0]), n: txt(r.v('parametro')), id: txt(r.v('object')), ac: txt(r.v('acceso')), habs: num(r.v('habitaciones')), nota: txt(r.v('nota')) }));
    tabla(hoja(wb, 'resumen ejecutivo'), 'tema').forEach((r) => o.resumen.push({ tema: txt(r.f[0]), res: txt(r.f[1]), crit: txt(r.f[2]), est: txt(r.f[3]) }));
    tabla(hoja(wb, 'notas'), 'tema').forEach((r) => o.notas.push({ tema: txt(r.f[0]), crit: txt(r.f[1]) }));
    return o;
  }

  /* ---------- comparación contra el proyecto ---------- */
  function revisar() {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc, M = BMS.catCt.marcas[P.marca];
    const res = C.todo(), mot = C.motor(res, P.marca), lic = C.licencias(res, mot, P.marca);
    const rows = [];
    const push = (area, item, proy, fab, estado, nota, auto) => rows.push({ area, item, proy, fab, estado, nota: nota || '', auto: auto || null });
    const porNombre = (n) => E.controladores.find((c) => C.nombreCtrl(c) === n && !/GRMS-IC3/i.test(c.obs || ''));
    const cp = E.controladores.find((c) => c.tipo === 'CP');
    const enCatalogo = (cod) => !!(M && (M.bases.some((b) => b.cod === cod)));

    /* hardware y licencia por controlador */
    doc.ctrls.forEach((f) => {
      const esGrms = /GRMS/i.test(f.nombre), sin = /SIN HARDWARE/i.test(f.hw);
      let c = porNombre(f.nombre) || (esGrms ? E.controladores.find((x) => /GRMS-IC3/i.test(x.obs || '')) : null);
      if (!c) { push('Hardware', f.nombre, 'No existe en el proyecto', f.hw + (f.lic ? ' + ' + f.lic : ''), 'falta', esGrms ? 'Crear el controlador del servidor IC3 del GRMS con ' + f.hw + ' y la licencia ' + f.lic + '.' : 'Crear el controlador ' + f.nombre + ' con ' + f.hw + '.', esGrms ? 'grms' : null); return; }
      const d = mot.detalle.find((x) => x.c.id === c.id), base = (d && d.cfg.base) || '';
      const okHw = sin ? !base : base === f.hw;
      let nota = '';
      if (!okHw) nota = 'Cambiar el hardware de ' + f.nombre + ' de ' + (base || 'sin hardware') + ' a ' + (sin ? 'sin hardware local' : f.hw) + '.' + (!sin && !enCatalogo(f.hw) ? ' El modelo no está en el catálogo de controladores: agréguelo con sus canales.' : '');
      push('Hardware', f.nombre, base || 'Sin hardware', sin ? 'Sin hardware local' : f.hw, okHw ? 'ok' : 'dif', nota, okHw ? null : 'hardware');
      const pe = ((lic && lic.porCtrl[c.id]) || []).map((e) => e.nucleo.cod), pl = pe[0] || '', fl = f.lic;
      let est = 'ok', n2 = '';
      if (!fl && pl) { est = 'dif'; n2 = 'Quitar la licencia ' + pl + ' de ' + f.nombre + ': el fabricante no asigna licencia a este controlador.'; }
      else if (fl && !pl) { est = 'falta'; n2 = 'Agregar la licencia ' + fl + ' a ' + f.nombre + '.'; }
      else if (fl && pl && pl !== fl) { if (sinA(pl) === sinA(fl)) { est = 'info'; n2 = 'Mismo escalón de licencia; el fabricante usa el SKU ' + fl + ' (con sufijo A).'; } else { est = 'dif'; n2 = 'Corregir la licencia de ' + f.nombre + ': el proyecto tiene ' + pl + ' y el fabricante ' + fl + '.'; } }
      if (fl || pl) push('Licencias', f.nombre, pl || '—', fl || '—', est, n2, est === 'ok' ? null : 'licencias');
    });

    /* módulos de E/S: el documento no los trae */
    const mods = Object.keys(mot.bom || {}).filter((k) => M && M.modulos.some((m) => m.cod === k));
    const push2 = mods.filter((k) => /-S-P$/.test(k));
    if (push2.length) push('Módulos de E/S', 'Terminales', push2.join(', '), '—', 'dif', 'Cambiar los módulos con terminal push (-S-P) a terminal de tornillo (-S-S), que es la versión de Centroamérica.', 'hardware');
    if (!doc.ctrls.some((f) => /^IO-|^IOD-/.test(f.hw))) push('Módulos de E/S', 'Lista de módulos', mods.length ? mods.reduce((a, k) => a + mot.bom[k], 0) + ' módulos' : '—', 'No lista módulos', 'falta', 'Solicitar al fabricante el número de parte y la cantidad de módulos de E/S por controlador, en terminal de tornillo (-S-S).');

    /* totales de hardware */
    const conta = (arr) => arr.reduce((m, k) => { if (k) m[k] = (m[k] || 0) + 1; return m; }, {});
    const fabHw = conta(doc.ctrls.filter((f) => !/SIN HARDWARE/i.test(f.hw)).map((f) => f.hw));
    const proHw = {}; mot.detalle.forEach((d) => { if (d.cfg.base) proHw[d.cfg.base] = (proHw[d.cfg.base] || 0) + (d.cfg.baseQty || 0); });
    [...new Set([...Object.keys(fabHw), ...Object.keys(proHw)])].sort().forEach((k) => {
      const a = proHw[k] || 0, b = fabHw[k] || 0;
      push('Totales de hardware', k, a, b, a === b ? 'ok' : 'dif', a === b ? '' : (b > a ? 'Faltan ' + (b - a) + ' de ' + k + ' respecto al fabricante.' : 'Sobran ' + (a - b) + ' de ' + k + ' respecto al fabricante.'), a === b ? null : 'hardware');
    });

    /* licencias y supervisor (BOM del fabricante) */
    if (doc.bom.length) {
      const fab = {}; doc.bom.filter((b) => !enCatalogo(b.sku)).forEach((b) => { fab[b.sku] = (fab[b.sku] || 0) + b.cant; });
      const pro = {}; ((lic && lic.lista) || []).forEach((l) => { pro[l.cod] = (pro[l.cod] || 0) + l.qty; });
      [...new Set([...Object.keys(fab), ...Object.keys(pro)])].sort().forEach((k) => {
        const a = pro[k] || 0, b = fab[k] || 0;
        if (a === b) { push('Licencias y supervisor', k, a, b, 'ok'); return; }
        const alt = Object.keys(a ? fab : pro).find((x) => sinA(x) === sinA(k) && x !== k);
        push('Licencias y supervisor', k, a, b, alt && (pro[alt] || 0) + a === (fab[alt] || 0) + b ? 'info' : 'dif', b > a ? 'Falta ' + k + ' (cantidad del fabricante: ' + b + ').' : 'El proyecto trae ' + k + ' (' + a + ') y el fabricante no lo incluye o usa otra cantidad (' + b + ').', 'licencias');
      });
    }

    /* integraciones: dispositivos que pasan al controlador principal */
    if (doc.integ.length) {
      const fabT = {}; doc.integ.filter((r) => /^s/i.test(r.incl) && r.tag).forEach((r) => { fabT[r.tag] = (fabT[r.tag] || 0) + (r.dev || 1); });
      const proT = {}; E.equipos.filter((q) => q.tipoId === 'mm_full').forEach((q) => { const k = txt(q.tag); proT[k] = (proT[k] || 0) + num(q.qty); });
      const nf = Object.values(fabT).reduce((a, b) => a + b, 0), np = Object.values(proT).reduce((a, b) => a + b, 0);
      push('Integraciones', 'Medidores integrados', np, nf, np === nf ? 'ok' : 'dif', np === nf ? '' : 'El proyecto tiene ' + np + ' medidores y el fabricante ' + nf + '. Confirmar las cantidades.');
      Object.keys(fabT).filter((k) => !(k in proT)).forEach((k) => push('Integraciones', k, 'No está', fabT[k], 'falta', 'El fabricante integra el equipo ' + k + ' y no existe en el proyecto.'));
      Object.keys(proT).filter((k) => !(k in fabT)).forEach((k) => push('Integraciones', k, proT[k], 'No está', 'dif', 'El equipo ' + k + ' del proyecto no está en la lista del fabricante.'));
      Object.keys(proT).filter((k) => k in fabT && proT[k] !== fabT[k]).forEach((k) => push('Integraciones', k, proT[k], fabT[k], 'dif', 'El equipo ' + k + ' tiene ' + proT[k] + ' en el proyecto y ' + fabT[k] + ' en el fabricante (posible duplicado).'));
      if (cp) {
        const mover = doc.integ.filter((r) => /^s/i.test(r.incl) && r.tag && porNombre(r.destino));
        const fuera = mover.filter((r) => { const q = E.equipos.find((x) => txt(x.tag) === r.tag && x.tipoId === 'mm_full'); const f = q && res.filas.find((x) => x.eq === q); return f && f.ctrlId && C.nombreCtrl(C.ctrlDe(f.ctrlId)) !== r.destino; });
        if (fuera.length) push('Integraciones', 'Controlador de integración', fuera.length + ' medidores en otros controladores', 'Todos en ' + (mover[0] && mover[0].destino), 'dif', 'Asignar al controlador ' + (mover[0] && mover[0].destino) + ' los ' + fuera.length + ' medidores que hoy están en otros controladores.', 'integracion');
      }
    }

    /* GRMS */
    if (doc.grms.length && BMS.grms) {
      const fabHab = Math.max(0, ...doc.grms.map((r) => r.habs || 0)), pro = BMS.grms.total();
      push('GRMS', 'Habitaciones', pro, fabHab, pro === fabHab ? 'ok' : 'dif', pro === fabHab ? '' : 'El módulo GRMS suma ' + pro + ' habitaciones y el fabricante ' + fabHab + ': confirmar el número y ajustar las cantidades por tipo y nivel.');
      const g = BMS.estado.grms || { objetos: [] };
      const idsF = new Set(doc.grms.map((r) => r.id)), idsP = new Set((g.objetos || []).filter((o) => o.on).map((o) => o.id));
      const faltan = doc.grms.filter((r) => !idsP.has(r.id)), sobran = (g.objetos || []).filter((o) => o.on && !idsF.has(o.id));
      push('GRMS', 'Objetos BACnet', idsP.size, idsF.size, !faltan.length && !sobran.length ? 'ok' : 'dif', [faltan.length ? 'Incluir en el módulo: ' + faltan.map((r) => r.n + ' (' + r.id + ')').join(', ') + '.' : '', sobran.length ? 'Quitar del módulo: ' + sobran.map((o) => o.n + ' (' + o.id + ')').join(', ') + '.' : ''].filter(Boolean).join(' '), !faltan.length && !sobran.length ? null : 'grms');
    }
    return { rows, lic, mot };
  }

  /* ---------- autocorrección ---------- */
  function instantanea() {
    const E = BMS.estado, P = E.proyecto;
    return JSON.stringify({ ctrls: E.controladores, eq: E.equipos, motor: P.motor, sinDisp: !!P.licSinDisp, cat: BMS.catCt.marcas[P.marca], grms: E.grms || null });
  }
  function restaurar(s) {
    const E = BMS.estado, P = E.proyecto, d = JSON.parse(s);
    E.controladores = d.ctrls; E.equipos = d.eq; P.motor = d.motor; if (d.sinDisp) P.licSinDisp = true; else delete P.licSinDisp; BMS.catCt.marcas[P.marca] = d.cat; E.grms = d.grms || E.grms;
    if (!d.grms) delete E.grms;
    BMS.guardarCatCt && BMS.guardarCatCt();
  }
  function autocorregir(areas) {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc, M = BMS.catCt.marcas[P.marca], log = [];
    const antes = instantanea();
    const porNombre = (n) => E.controladores.find((c) => C.nombreCtrl(c) === n && !/GRMS-IC3/i.test(c.obs || ''));
    const cp = E.controladores.find((c) => c.tipo === 'CP');
    const todas = areas.includes('todo'), usa = (a) => todas || areas.includes(a);

    /* GRMS: objetos y controlador del servidor IC3 */
    if (usa('grms') && BMS.grms) {
      const g = E.grms || (BMS.grms.calcular(), E.grms);
      if (g && doc.grms.length) {
        const ids = new Set(doc.grms.map((r) => r.id));
        (g.objetos || []).forEach((o) => { const on = ids.has(o.id); if (o.on !== on) { o.on = on; log.push((on ? 'Se incluyó' : 'Se quitó') + ' el objeto ' + o.n + ' (' + o.id + ') del módulo GRMS.'); } });
        doc.grms.filter((r) => !(g.objetos || []).some((o) => o.id === r.id)).forEach((r) => { g.objetos.push({ n: r.n, id: r.id, ac: r.ac, g: /global/i.test(r.paq), on: true, nota: r.nota }); log.push('Se agregó el objeto ' + r.n + ' (' + r.id + ') al módulo GRMS.'); });
        BMS.grms.sincronizar();
      }
      const fg = doc.ctrls.find((f) => /GRMS/i.test(f.nombre));
      if (fg && cp && !E.controladores.some((x) => /GRMS-IC3/i.test(x.obs || ''))) {
        let q = 1; const nm = (k) => C.nombreCtrl({ tipo: 'CS', nivel: cp.nivel, consec: k }); while (E.controladores.some((x) => x.tipo === 'CS' && x.nivel === cp.nivel && num(x.consec) === q) || doc.ctrls.some((f) => f.nombre === nm(q))) q++;
        const nuevo = { id: BMS.uid(), tipo: 'CS', nivel: cp.nivel, consec: q, ubicacion: 'CUARTO IT / SERVIDOR IC3 (GRMS)', gab: cp.gab || '', obs: 'GRMS-IC3 (según el fabricante)', modo: 'auto' };
        E.controladores.push(nuevo); log.push('Se creó el controlador ' + C.nombreCtrl(nuevo) + ' para el servidor IC3 del GRMS.');
        E.equipos.filter((x) => x.tipoId === 'grms_hab' || x.tipoId === 'grms_glob').forEach((x) => { x.ctrl = nuevo.id; });
      }
    }

    /* hardware por controlador */
    if (usa('hardware')) {
      const res = C.todo();
      doc.ctrls.forEach((f) => {
        const c = porNombre(f.nombre) || (/GRMS/i.test(f.nombre) ? E.controladores.find((x) => /GRMS-IC3/i.test(x.obs || '')) : null);
        if (!c) return;
        const sin = /SIN HARDWARE/i.test(f.hw);
        if (sin) { c.modo = 'manual'; c.manual = { marca: P.marca, base: '', baseQty: 0, modulos: {} }; log.push(C.nombreCtrl(c) + ': sin hardware local.'); return; }
        const base = M.bases.find((b) => b.cod === f.hw);
        if (!base) { log.push(C.nombreCtrl(c) + ': no se pudo aplicar ' + f.hw + ' porque el modelo no está en el catálogo de controladores.'); return; }
        const req = C.conReserva(res.ctrlTotales[c.id], P.reserva), r = C.resolver(req, M, base);
        c.modo = 'manual'; c.manual = { marca: P.marca, base: r.base, baseQty: r.baseQty, modulos: r.modulos };
        log.push(C.nombreCtrl(c) + ': hardware ' + r.baseQty + '× ' + r.base + (Object.keys(r.modulos).length ? ' + ' + Object.keys(r.modulos).map((k) => r.modulos[k] + '× ' + k).join(' + ') : '') + '.');
      });
      /* módulos con terminal push pasan a tornillo */
      E.controladores.forEach((c) => { if (c.manual && c.manual.modulos) { Object.keys(c.manual.modulos).filter((k) => /-S-P$/.test(k)).forEach((k) => { const n = k.replace(/-S-P$/, '-S-S'); c.manual.modulos[n] = (c.manual.modulos[n] || 0) + c.manual.modulos[k]; delete c.manual.modulos[k]; log.push(C.nombreCtrl(c) + ': ' + k + ' pasa a ' + n + '.'); }); } });
      const fcp = doc.ctrls.find((f) => cp && C.nombreCtrl(cp) === f.nombre);
      if (fcp && M.motores.some((m) => m.cod === fcp.hw) && P.motor !== fcp.hw) { P.motor = fcp.hw; log.push('Motor de red: ' + fcp.hw + '.'); }
    }

    /* integraciones al controlador principal */
    if (usa('integracion') && doc.integ.length) {
      const res = C.todo(); let n = 0;
      doc.integ.filter((r) => /^s/i.test(r.incl) && r.tag).forEach((r) => {
        const dest = porNombre(r.destino); if (!dest) return;
        const q = E.equipos.find((x) => txt(x.tag) === r.tag && x.tipoId === 'mm_full'); if (!q) return;
        const f = res.filas.find((x) => x.eq === q);
        if (!f || f.ctrlId !== dest.id) { q.ctrl = dest.id; n++; }
      });
      if (n) log.push('Se asignaron ' + n + ' medidores al controlador de integración.');
    }

    /* licencias por controlador */
    if (usa('licencias')) {
      if (doc.bom.length && !doc.bom.some((b) => /^SUP-DEVICE/.test(b.sku)) && !P.licSinDisp) { P.licSinDisp = true; log.push('Supervisor: sin licencia de dispositivos SUP-DEVICE (el fabricante no la incluye).'); }
      doc.ctrls.forEach((f) => {
        const c = porNombre(f.nombre) || (/GRMS/i.test(f.nombre) ? E.controladores.find((x) => /GRMS-IC3/i.test(x.obs || '')) : null);
        if (!c) return;
        if (f.lic) { if (c.licencia !== f.lic) { c.licencia = f.lic; log.push(C.nombreCtrl(c) + ': licencia ' + f.lic + '.'); } }
        else if (c.licencia) { delete c.licencia; }
      });
    }
    if (!log.length) log.push('No hubo nada que corregir automáticamente.');
    deshacer = antes; bitacora = log;
    BMS.touch(); BMS.rerender();
  }

  /* ---------- salida ---------- */
  const COLOR = { ok: 'ok', dif: 'bad', falta: 'bad', info: 'warn' };
  const ETQ = { ok: 'Coincide', dif: 'Difiere', falta: 'Falta', info: 'Nota' };
  const exportar = async (rows) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet('Revisión');
    ws.addRow(['Área', 'Ítem', 'Proyecto', 'Fabricante', 'Estado', 'Nota']).font = { bold: true };
    rows.forEach((r) => ws.addRow([r.area, r.item, r.proy, r.fab, ETQ[r.estado], r.nota]));
    [18, 28, 28, 28, 12, 100].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    const buf = await wb.xlsx.writeBuffer();
    BMS.descargar('Revision_documento_fabricante_' + (BMS.estado.proyecto.nombre || 'proyecto').replace(/[^\w\-]+/g, '_') + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };

  BMS.pRevisor = (root) => {
    root.append(h('h2', null, 'Revisor del documento del fabricante'),
      h('p', { class: 'hint' }, 'Cargue el Excel de selección que devuelve el fabricante. Se compara contra el proyecto (controladores y su hardware, módulos, licencias, supervisor, integraciones y GRMS), se redactan las notas de lo que debe corregirse y se puede autocorregir el proyecto según el documento. La autocorrección se puede deshacer.'));
    const entrada = h('input', { type: 'file', accept: '.xlsx,.xls', style: { display: 'none' }, onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!window.XLSX) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
      try { const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); doc = parsear(wb); archivo = f.name; bitacora = []; deshacer = null; BMS.rerender(); } catch (er) { alert('No se pudo leer el archivo: ' + er.message); }
    } });
    root.append(h('div', { class: 'fila' }, h('button', { class: 'b p', onclick: () => entrada.click() }, doc ? 'Cargar otro documento' : 'Cargar documento del fabricante (.xlsx)'), entrada, h('span', { class: 'mute' }, archivo || 'Sin documento cargado')));
    if (!doc) return;
    if (!doc.ctrls.length && !doc.bom.length) { root.append(h('div', { class: 'warnbox' }, 'El archivo no tiene las hojas esperadas («Controladores y licencias», «BOM licencias», «Integraciones…», «GRMS objetos»).')); return; }

    const { rows } = revisar();
    const cuenta = (e) => rows.filter((r) => r.estado === e).length, mal = cuenta('dif') + cuenta('falta');
    root.append(h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', null, cuenta('ok')), h('span', null, 'Coinciden con el fabricante')),
      h('div', { class: 'kpi' }, h('b', { style: { color: mal ? 'var(--bad)' : '' } }, mal), h('span', null, 'Difieren o faltan')),
      h('div', { class: 'kpi' }, h('b', null, cuenta('info')), h('span', null, 'Notas informativas'))));
    const conAuto = (a) => rows.filter((r) => r.auto === a && r.estado !== 'ok').length;
    const bot = (etq, a) => h('button', { class: 'b', disabled: !conAuto(a), onclick: () => autocorregir([a]) }, etq + ' (' + conAuto(a) + ')');
    root.append(h('div', { class: 'fila noprint' },
      h('button', { class: 'b p', disabled: !rows.some((r) => r.auto && r.estado !== 'ok'), onclick: () => { if (confirm('Se corregirá el proyecto según el documento del fabricante (hardware, licencias, integraciones y GRMS). Puede deshacerlo después. ¿Continuar?')) autocorregir(['todo']); } }, 'Autocorregir todo'),
      bot('Solo hardware', 'hardware'), bot('Solo licencias', 'licencias'), bot('Solo integraciones', 'integracion'), bot('Solo GRMS', 'grms'),
      h('button', { class: 'b', disabled: !deshacer, onclick: () => { restaurar(deshacer); deshacer = null; bitacora = ['Se deshizo la última autocorrección.']; BMS.touch(); BMS.rerender(); } }, 'Deshacer la última corrección')));
    if (bitacora.length) root.append(h('div', { class: 'warnbox' }, h('b', null, 'Cambios aplicados:'), h('ul', { style: { margin: '4px 0 0 18px' } }, bitacora.map((l) => h('li', null, l)))));
    root.append(h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Área', 'Ítem', 'Proyecto', 'Fabricante', 'Estado', 'Qué corregir'].map((x) => h('th', null, x)))),
      h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r.area), h('td', { style: { fontWeight: 600 } }, r.item), h('td', null, String(r.proy)), h('td', null, String(r.fab)), h('td', { class: 'c' }, h('span', { class: 'chip ' + COLOR[r.estado] }, ETQ[r.estado])), h('td', null, r.nota)))))));
    const notas = rows.filter((r) => r.estado !== 'ok' && r.nota).map((r, i) => (i + 1) + '. [' + r.area + '] ' + r.item + ': ' + r.nota);
    const ta = h('textarea', { class: 'in', rows: Math.min(14, notas.length + 2), style: { width: '100%', fontFamily: 'inherit' } }, notas.length ? 'Notas de revisión del documento del fabricante (' + archivo + '):\n' + notas.join('\n') : 'Todo coincide con el documento del fabricante.');
    root.append(h('h3', null, 'Notas para responder al fabricante'), ta,
      h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => { ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } } }, 'Copiar notas'), h('button', { class: 'b', onclick: () => exportar(rows) }, 'Descargar revisión (Excel)')));
    if (doc.notas.length) root.append(h('h3', null, 'Notas y criterios del fabricante'), h('ul', null, doc.notas.map((n) => h('li', null, h('b', null, n.tema + ': '), n.crit))));
  };
  BMS.revisor = { revisar };
})();
