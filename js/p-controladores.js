/* Página 5: selector de controladores (JCI / Honeywell), automático con ajuste manual. */
(function () {
  const { h, num } = BMS;
  const CAN = ['ui', 'bi', 'co', 'bo', 'ao', 'uio'];
  const TXT = { ui: 'UI', bi: 'BI', co: 'CO', bo: 'BO', ao: 'AO', uio: 'UIO' };

  const resumenCfg = (cfg) => !cfg.base ? 'Sin hardware' : cfg.baseQty + '× ' + cfg.base + Object.keys(cfg.modulos || {}).filter((k) => cfg.modulos[k]).map((k) => ' + ' + cfg.modulos[k] + '× ' + k).join('');

  BMS.pControladores = (root) => {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc;
    const M = BMS.catCt.marcas[P.marca];
    const res = C.todo(), mot = C.motor(res, P.marca);

    root.append(h('h2', null, 'Selector de controladores'),
      h('p', { class: 'hint' }, 'La selección es automática según los puntos de cada controlador (con reserva) y puede cambiarla a manual. UI = entrada universal, BI = entrada binaria, CO = salida configurable, BO = salida binaria, AO = salida analógica, UIO = entrada/salida universal.'));

    root.append(h('div', { class: 'card' }, h('div', { class: 'grid' },
      h('label', { class: 'f' }, 'Marca de controladores', h('select', { class: 'in', value: P.marca, onchange: (e) => { P.marca = e.target.value; P.motor = 'auto'; BMS.touch(); BMS.rerender(); } },
        Object.keys(BMS.catCt.marcas).map((k) => h('option', { value: k }, k + ' — ' + BMS.catCt.marcas[k].nombre)))),
      h('label', { class: 'f' }, 'Reserva de puntos (%)', h('input', { class: 'in n', type: 'number', min: 0, max: 100, value: P.reserva, onchange: (e) => { P.reserva = Math.max(0, num(e.target.value)); BMS.touch(); BMS.rerender(); } })),
      h('label', { class: 'f' }, 'Motor de red / supervisor', h('select', { class: 'in', value: P.motor || 'auto', onchange: (e) => { P.motor = e.target.value; BMS.touch(); BMS.rerender(); } },
        h('option', { value: 'auto' }, 'Automático' + (mot.motor ? ' (' + mot.motor.cod + ')' : '')), (M ? M.motores : []).map((m) => h('option', { value: m.cod }, m.cod + ' — hasta ' + m.maxDisp + ' dispositivos')))))));
    if (M && M.nota) root.append(h('div', { class: 'warnbox' }, M.nota));
    if (M && M.confirmar) root.append(h('div', { class: 'warnbox' }, 'Los datos de canales y modelos de ' + P.marca + ' son valores de referencia POR CONFIRMAR con el fabricante. Corríjalos en "Catálogo de controladores".'));
    root.append(h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', null, mot.disp), h('span', null, 'Dispositivos en la red (controladores + módulos + integraciones)')),
      h('div', { class: 'kpi' }, h('b', null, mot.motor ? mot.motor.cod : '—'), h('span', null, 'Motor de red' + (mot.excede ? ' — EXCEDE el máximo' : ''))),
      h('div', { class: 'kpi' }, h('b', null, [...res.gwTodos].join(', ') || '—'), h('span', null, 'Integraciones (gateways)'))));
    if (mot.excede) root.append(h('div', { class: 'warnbox' }, 'Los dispositivos exceden el máximo del motor de red seleccionado (' + mot.motor.maxDisp + '). Use un motor mayor o divida la red.'));

    if (!E.controladores.length) { root.append(h('div', { class: 'warnbox' }, 'No hay controladores. Créelos en la pestaña 1.')); return; }

    /* Revisión: controladores sin puntos cableados y controladores que necesitan más de un controlador base */
    const sinPuntos = mot.detalle.filter((d) => d.c.tipo === 'CS' && !C.cable(d.t));
    const sobre = mot.detalle.filter((d) => d.cfg.baseQty >= 2);
    if (sinPuntos.length) root.append(h('div', { class: 'warnbox' }, h('b', null, 'Controladores sin puntos cableados (' + sinPuntos.length + '): '), sinPuntos.map((d) => C.nombreCtrl(d.c) + (d.t.int ? ' (solo integración INT ' + d.t.int + ')' : '')).join(', ') + '. Los puntos por gateway (INT) no ocupan canales, así que estos controladores no necesitan hardware; si no se van a instalar, quítelos para que el diagrama y la lista de materiales no los incluyan.',
      h('div', { class: 'fila' }, h('button', { class: 'b', onclick: () => {
        if (!confirm('Se eliminarán ' + sinPuntos.length + ' controladores sin puntos cableados. Sus equipos de integración pasarán al controlador principal. ¿Continuar?')) return;
        const ids = new Set(sinPuntos.map((d) => d.c.id));
        E.equipos.forEach((q) => { if (ids.has(q.ctrl)) q.ctrl = 'auto'; });
        E.controladores = E.controladores.filter((x) => !ids.has(x.id)); BMS.touch(); BMS.rerender();
      } }, 'Quitar los controladores sin puntos cableados'))));
    if (sobre.length) root.append(h('div', { class: 'warnbox' }, h('b', null, 'Controladores muy cargados: '), sobre.map((d) => C.nombreCtrl(d.c) + ' (' + C.cable(d.t) + ' puntos, ' + d.cfg.baseQty + ' controladores base)').join(', ') + '. Puede repartir sus equipos con un controlador nuevo del mismo nivel usando el botón de cada tarjeta.'));
    const repartir = (d) => {
      const c0 = d.c, filasC = res.filas.filter((f) => f.ctrlId === c0.id && f.tipo && C.cable(f.t) > 0).sort((a, b) => C.cable(b.t) - C.cable(a.t));
      if (filasC.length < 2) { alert('Este controlador tiene un solo tipo de equipo; no se puede repartir sin dividir la cantidad de un equipo.'); return; }
      let q = 1; while (E.controladores.some((x) => x.tipo === 'CS' && x.nivel === c0.nivel && num(x.consec) === q)) q++;
      const nuevo = { id: BMS.uid(), tipo: 'CS', nivel: c0.nivel, consec: q, ubicacion: c0.ubicacion || '', gab: c0.gab || '', obs: 'Repartido desde ' + C.nombreCtrl(c0), modo: 'auto' };
      E.controladores.push(nuevo);
      let a = 0, b = 0;
      filasC.forEach((f) => { if (a <= b) { a += C.cable(f.t); f.eq.ctrl = c0.id; } else { b += C.cable(f.t); f.eq.ctrl = nuevo.id; } });
      BMS.touch(); BMS.rerender();
    };
    const tarjetas = h('div', { class: 'ctrls' });
    mot.detalle.forEach((d) => {
      const c = d.c, n = C.nivelDe(c.nivel), manual = d.manual;
      const tCab = C.cable(d.t);
      const verif = tCab ? h('span', { class: 'chip ' + (d.ev.ok ? 'ok' : 'bad') }, d.ev.ok ? 'Cubre los puntos' : 'Faltan ' + d.ev.falta + ' puntos') : h('span', { class: 'chip warn' }, d.t.int ? 'Solo integración (INT)' : 'Sin puntos');
      const cap = h('table', { class: 'mini' }, h('tr', null, h('th'), CAN.map((k) => h('th', null, TXT[k])), h('th', null, 'Total')),
        h('tr', null, h('th', null, 'Instalados'), CAN.map((k) => h('td', null, d.ev.cap[k])), h('td', null, C.canalesDe(d.ev.cap))));
      const req = h('table', { class: 'mini' }, h('tr', null, h('th'), ['AI', 'AO', 'DI', 'DO', 'INT'].map((x) => h('th', null, x)), h('th', null, 'Cabl.')),
        h('tr', null, h('th', null, 'Puntos'), ['ai', 'ao', 'di', 'do', 'int'].map((k) => h('td', null, d.t[k])), h('td', null, tCab)),
        h('tr', null, h('th', null, '+ reserva'), ['ai', 'ao', 'di', 'do'].map((k) => h('td', null, d.req[k])), h('td', null, '—'), h('td', null, C.cable(d.req))));
      const modo = h('div', { class: 'fila' },
        h('label', null, h('input', { type: 'radio', name: 'm' + c.id, checked: !manual, onchange: () => { c.modo = 'auto'; BMS.touch(); BMS.rerender(); } }), ' Automático'),
        h('label', null, h('input', { type: 'radio', name: 'm' + c.id, checked: manual, onchange: () => { c.modo = 'manual'; c.manual = { marca: P.marca, base: d.cfg.base || (M.bases[0] && M.bases[0].cod), baseQty: d.cfg.baseQty || 1, modulos: { ...(d.cfg.modulos || {}) } }; BMS.touch(); BMS.rerender(); } }), ' Manual'));
      let manualUI = null;
      if (manual) {
        const mn = c.manual;
        manualUI = h('div', null,
          h('div', { class: 'fila' }, h('label', { class: 'f' }, 'Controlador base', h('select', { class: 'in', value: mn.base, onchange: (e) => { mn.base = e.target.value; BMS.touch(); BMS.rerender(); } }, M.bases.map((b) => h('option', { value: b.cod }, b.cod + ' — ' + b.desc)))),
            h('label', { class: 'f' }, 'Cantidad', h('input', { class: 'in n', type: 'number', min: 0, value: mn.baseQty, onchange: (e) => { mn.baseQty = Math.max(0, Math.round(num(e.target.value))); BMS.touch(); BMS.rerender(); } }))),
          h('div', { class: 'mods' }, M.modulos.map((m) => h('label', { title: m.desc }, m.cod, h('input', { class: 'in n', type: 'number', min: 0, value: (mn.modulos && mn.modulos[m.cod]) || 0, onchange: (e) => { mn.modulos = mn.modulos || {}; mn.modulos[m.cod] = Math.max(0, Math.round(num(e.target.value))); BMS.touch(); BMS.rerender(); } })))));
      }
      tarjetas.append(h('div', { class: 'ctrl ' + c.tipo.toLowerCase() },
        h('h4', null, C.nombreCtrl(c), h('span', { class: 'mute', style: { fontWeight: 400, fontSize: '12px' } }, (n ? n.nombre : '') + ' · ' + (c.tipo === 'CP' ? 'Principal' : 'Secundario')), verif),
        h('div', { class: 'mute', style: { fontSize: '12px' } }, c.ubicacion || ''),
        req, h('div', null, h('b', null, resumenCfg(d.cfg)), manual ? h('span', { class: 'chip warn', style: { marginLeft: '8px' } }, 'Manual') : h('span', { class: 'chip gw', style: { marginLeft: '8px' } }, 'Automático')),
        cap, modo, manualUI,
        d.cfg.baseQty >= 2 ? h('div', { class: 'fila' }, h('button', { class: 'b', title: 'Crea un controlador nuevo en este nivel y reparte los equipos entre los dos', onclick: () => repartir(d) }, 'Repartir con un controlador nuevo')) : null));
    });
    root.append(tarjetas);

    /* Lista de materiales */
    const filas = [];
    for (const cod in mot.bom) {
      const m = M.bases.find((x) => x.cod === cod) || M.modulos.find((x) => x.cod === cod);
      filas.push(h('tr', null, h('td', { style: { fontWeight: 600 } }, cod), h('td', null, m ? m.desc : ''), h('td', { class: 'c' }, M.bases.some((x) => x.cod === cod) ? 'Controlador' : 'Módulo'), h('td', { class: 'r' }, mot.bom[cod])));
    }
    if (mot.motor) filas.push(h('tr', null, h('td', { style: { fontWeight: 600 } }, mot.motor.cod), h('td', null, mot.motor.desc || ''), h('td', { class: 'c' }, 'Motor de red'), h('td', { class: 'r' }, 1)));
    root.append(h('h3', null, 'Lista de controladores y módulos — ' + P.marca),
      h('div', { class: 'scroll' }, h('table', { class: 't', style: { maxWidth: '900px' } }, h('thead', null, h('tr', null, ['Código', 'Descripción', 'Tipo', 'Cantidad'].map((x) => h('th', null, x)))), h('tbody', null, filas.length ? filas : h('tr', null, h('td', { colspan: 4, class: 'mute' }, 'Sin hardware: aún no hay puntos asignados.'))))),
      h('p', { class: 'hint' }, 'Los puntos de integración (INT) entran por gateway y no consumen canales; sí cuentan como dispositivos para el motor de red.'));
  };
})();
