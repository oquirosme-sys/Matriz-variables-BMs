/* Página 4: resumen de variables por nivel, por controlador y por sistema + exportación. */
(function () {
  const { h } = BMS;
  const cab = (cols) => h('thead', null, h('tr', null, cols.map((x) => h('th', null, x))));
  const num = (v, cls) => h('td', { class: 'r ' + (cls || '') }, v);

  function datos() {
    const E = BMS.estado, C = BMS.calc, P = E.proyecto;
    const res = C.todo();
    const mot = C.motor(res, P.marca);
    const fila = (t) => { const rv = C.conReserva(t, P.reserva); return { ...t, cab: C.cable(t), res: C.cable(rv), rv }; };
    return { E, C, P, res, mot, fila };
  }

  function exportarXlsx() {
    const { E, C, P, res, mot, fila } = datos();
    const lvl = [['Nivel', 'Nombre', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Cableados con reserva']];
    E.niveles.forEach((n) => { const f = fila(res.porNivel[n.id]); lvl.push([n.codigo, n.nombre, f.eq, f.ai, f.ao, f.di, f.do, f.int, f.cab, f.res]); });
    const ctl = [['Controlador', 'Tipo', 'Nivel', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Cableados con reserva', 'Marca', 'Selección', 'Verificación']];
    mot.detalle.forEach((d) => {
      const f = fila(d.t), n = C.nivelDe(d.c.nivel);
      const sel = d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base + Object.keys(d.cfg.modulos || {}).map((k) => ' + ' + d.cfg.modulos[k] + '×' + k).join('') : '';
      ctl.push([C.nombreCtrl(d.c), d.c.tipo, n ? n.codigo : '', f.eq, f.ai, f.ao, f.di, f.do, f.int, f.cab, f.res, P.marca, sel, d.ev.ok ? 'OK' : 'Faltan ' + d.ev.falta]);
    });
    const mat = [['Nivel', 'Controlador', 'Ref', 'Tag', 'Descripción / punto', 'Qty equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total AI', 'Total AO', 'Total DI', 'Total DO', 'Total INT', 'Total puntos', 'Alarma', 'Tendencia', 'Interfaz']];
    C.filasOrdenadas(res).forEach((f) => {
      const n = C.nivelDe(f.eq.nivel), c = f.ctrlId ? C.nombreCtrl(C.ctrlDe(f.ctrlId)) : '';
      mat.push([n ? n.codigo : '', c, f.ref, f.eq.tag || '', f.tipo.nombre, f.eq.qty, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
      f.puntos.filter((p) => p.incl).forEach((p) => mat.push(['', '', '', '', '   ' + p.p.n, f.eq.qty, p.p.ai, p.p.ao, p.p.di, p.p.do, p.p.int, p.ai, p.ao, p.di, p.do, p.int, p.ai + p.ao + p.di + p.do + p.int, p.p.alm || '—', p.p.tend || '—', p.p.ifc]));
    });
    if (!window.XLSX) {
      const csv = mat.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
      BMS.descargar('matriz-bms.csv', '﻿' + csv, 'text/csv');
      alert('No se pudo cargar la librería de Excel (sin internet). Se descargó la matriz en CSV.');
      return;
    }
    const wb = XLSX.utils.book_new();
    [['Resumen_Nivel', lvl], ['Resumen_Controlador', ctl], ['Matriz_Puntos', mat]].forEach(([n, d]) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d), n));
    XLSX.writeFile(wb, (P.nombre || 'matriz-bms').replace(/[^\w\-]+/g, '_') + '_matriz.xlsx');
  }

  BMS.pResumen = (root) => {
    const { E, C, P, res, mot, fila } = datos();
    const tot = fila(res.total);
    root.append(h('h2', null, 'Resumen de variables'),
      h('p', { class: 'hint' }, 'AI/AO = entradas/salidas analógicas, DI/DO = digitales, INT = puntos por integración (gateway, no consumen canales del controlador). La reserva (' + P.reserva + ' %) se aplica a cada tipo de canal cableado.'),
      h('div', { class: 'kpis' }, [['Equipos', tot.eq], ['AI', tot.ai], ['AO', tot.ao], ['DI', tot.di], ['DO', tot.do], ['INT', tot.int], ['Cableados', tot.cab], ['Cableados con reserva', tot.res]].map(([n, v]) => h('div', { class: 'kpi' }, h('b', null, v), h('span', null, n)))),
      h('div', { class: 'fila noprint' }, h('button', { class: 'b p', title: 'Una pestaña por disciplina en el formato BMS Point Schedule (con nivel, tag y controlador) y una tabla de Excel por pestaña: Resumen_Nivel, Resumen_Controlador, Nivel_x_Controlador y Resumen_Sistema', onclick: () => (window.ExcelJS ? BMS.exportarResumenXlsx() : exportarXlsx()) }, 'Exportar a Excel (formato por disciplina)'), h('button', { class: 'b', title: 'Formato anterior: resumen y matriz en hojas planas', onclick: exportarXlsx }, 'Excel simple'), h('button', { class: 'b', onclick: () => window.print() }, 'Imprimir')));
    if (res.sin.filas) root.append(h('div', { class: 'warnbox' }, '⚠ Hay ' + res.sin.filas + ' filas de equipos sin controlador (' + C.cable(res.sin) + ' puntos cableados + ' + res.sin.int + ' INT). Cree controladores en el nivel correspondiente o asígnelos manualmente.'));

    /* Por nivel */
    const cuerpoN = h('tbody');
    E.niveles.forEach((n) => { const f = fila(res.porNivel[n.id]);
      cuerpoN.append(h('tr', null, h('td', null, n.codigo + ' — ' + n.nombre), num(f.eq), num(f.ai), num(f.ao), num(f.di), num(f.do), num(f.int), num(f.cab), num(f.res, 'calc')));
    });
    cuerpoN.append(h('tr', { class: 'tot' }, h('td', null, 'TOTAL'), [tot.eq, tot.ai, tot.ao, tot.di, tot.do, tot.int, tot.cab, tot.res].map((v) => num(v))));
    root.append(h('h3', null, 'Por nivel'), h('div', { class: 'scroll' }, h('table', { class: 't' }, cab(['Nivel', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Con reserva']), cuerpoN)));

    /* Por controlador */
    const cuerpoC = h('tbody');
    mot.detalle.forEach((d) => { const f = fila(d.t), n = C.nivelDe(d.c.nivel);
      cuerpoC.append(h('tr', null, h('td', { style: { fontWeight: 600 } }, C.nombreCtrl(d.c)), h('td', { class: 'c' }, d.c.tipo), h('td', { class: 'c' }, n ? n.codigo : ''),
        num(f.eq), num(f.ai), num(f.ao), num(f.di), num(f.do), num(f.int), num(f.cab), num(f.res, 'calc'),
        h('td', { class: 'c' }, h('span', { class: 'chip ' + (!f.cab ? 'warn' : d.ev.ok ? 'ok' : 'bad') }, !f.cab ? 'Sin puntos' : d.ev.ok ? 'Cubre' : 'Faltan ' + d.ev.falta))));
    });
    const sn = fila(res.sin);
    if (res.sin.filas) cuerpoC.append(h('tr', null, h('td', { colspan: 3, style: { color: 'var(--bad)', fontWeight: 600 } }, 'Sin asignar'), num(sn.eq), num(sn.ai), num(sn.ao), num(sn.di), num(sn.do), num(sn.int), num(sn.cab), num(sn.res, 'calc'), h('td')));
    root.append(h('h3', null, 'Por controlador'), h('div', { class: 'scroll' }, h('table', { class: 't' }, cab(['Controlador', 'Tipo', 'Nivel', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Con reserva', 'Estado']), cuerpoC)));

    /* Matriz nivel × controlador */
    const ctrls = E.controladores;
    if (ctrls.length) {
      const m = {}; res.filas.forEach((f) => { const k = f.eq.nivel + '|' + (f.ctrlId || '-'); m[k] = (m[k] || 0) + C.cable(f.t) + f.t.int; });
      root.append(h('h3', null, 'Matriz nivel × controlador (puntos totales, incluye INT)'),
        h('div', { class: 'scroll' }, h('table', { class: 't' }, cab(['Nivel', ...ctrls.map((c) => C.nombreCtrl(c)), 'Sin asignar']),
          h('tbody', null, E.niveles.map((n) => h('tr', null, h('td', null, n.codigo), ctrls.map((c) => num(m[n.id + '|' + c.id] || '')), num(m[n.id + '|-'] || '')))))));
    }

    /* Por sistema */
    root.append(h('h3', null, 'Por sistema'), h('div', { class: 'scroll' }, h('table', { class: 't', style: { maxWidth: '900px' } }, cab(['Sistema', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total']),
      h('tbody', null, BMS.catEq.categorias.map((cat) => { const t = res.porCat[cat.id]; return h('tr', null, h('td', null, cat.nombre), num(t.eq), num(t.ai), num(t.ao), num(t.di), num(t.do), num(t.int), num(C.cable(t) + t.int)); })))));
    root.append(h('div', { class: 'fila noprint' }, h('button', { class: 'b p', onclick: () => BMS.ir('controladores') }, 'Siguiente: controladores →')));
  };
})();
