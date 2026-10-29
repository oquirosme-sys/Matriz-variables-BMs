/* Página 5: selector de controladores (JCI / Honeywell), automático con ajuste manual. */
(function () {
  const { h, num } = BMS;
  const CAN = ['ui', 'bi', 'co', 'bo', 'ao', 'uio'];
  const TXT = { ui: 'UI', bi: 'BI', co: 'CO', bo: 'BO', ao: 'AO', uio: 'UIO' };

  const resumenCfg = (cfg) => !cfg.base ? 'Sin hardware' : cfg.baseQty + '× ' + cfg.base + Object.keys(cfg.modulos || {}).filter((k) => cfg.modulos[k]).map((k) => ' + ' + cfg.modulos[k] + '× ' + k).join('');


  /* ---------- Memoria en Word: selección de controladores y lista de materiales (formato Sinergia) ---------- */
  const NOMRED = { A: 'BACnet/IP', B: 'BACnet MS/TP', C: 'Modbus RTU', E: 'Modbus TCP/IP', D: 'Señales cableadas' };
  const memoria = () => {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc, M = BMS.catCt.marcas[P.marca];
    const res = C.todo(), mot = C.motor(res, P.marca), S = (x) => String(x);
    const detMap = Object.fromEntries(mot.detalle.map((x) => [x.c.id, x]));
    const nCP = mot.detalle.filter((d) => d.c.tipo === 'CP').length, nCS = mot.detalle.length - nCP;
    const manuales = mot.detalle.filter((d) => d.manual).length;
    const hw = (cfg) => (cfg.base ? cfg.baseQty + '× ' + cfg.base + Object.keys(cfg.modulos || {}).filter((k) => cfg.modulos[k]).map((k) => ' + ' + cfg.modulos[k] + '× ' + k).join('') : 'Sin hardware (solo integración)');
    const desc = (cod) => { const m = M && (M.bases.find((x) => x.cod === cod) || M.modulos.find((x) => x.cod === cod)); return m ? m.desc.replace(/\s*\[.*?\]/g, '') : '—'; };
    const tipoDe = (cod) => (M && M.bases.some((x) => x.cod === cod) ? 'Controlador' : 'Módulo');
    const sumaTipo = (t) => Object.keys(mot.bom || {}).filter((c) => tipoDe(c) === t).reduce((a, c) => a + mot.bom[c], 0);
    const out = [];
    out.push({ t: 'h1', texto: '1. Alcance y criterios de selección' });
    out.push({ t: 'p', texto: 'Este documento presenta la selección de los controladores del sistema de monitoreo y control (BMS) del proyecto ' + (P.nombre || '—') + (P.ubicacion ? ', ubicado en ' + P.ubicacion : '') + ', y la lista de materiales de controladores, módulos de expansión, motor de red y cajas de control. La selección parte de la Matriz de Puntos del proyecto.' });
    out.push({ t: 'p', texto: 'Los criterios aplicados serán los siguientes:' });
    out.push({ t: 'li', texto: 'Marca de controladores: **' + P.marca + (M ? ' — ' + M.nombre : '') + '**.' });
    out.push({ t: 'li', texto: 'Cada controlador cubrirá los puntos cableados (AI, AO, DI y DO) asignados a sus equipos, más una reserva del **' + (P.reserva || 0) + ' %** por tipo de canal.' });
    out.push({ t: 'li', texto: 'Los puntos de integración (INT) entran por gateway o por la red del equipo, no ocupan canales del controlador y sí cuentan como dispositivos para el motor de red.' });
    out.push({ t: 'li', texto: 'La selección de hardware es automática; ' + (manuales ? manuales + ' controlador(es) se ajustaron manualmente.' : 'ningún controlador se ajustó manualmente.') });
    out.push({ t: 'li', texto: 'Los controladores del mismo cuarto se alojarán en un mismo panel, en caja plástica Schneider Thalassa con tapa transparente (serie PLA hasta 50 x 40 cm y PLM en poliéster desde 70 x 50 cm).' });
    if (M && (M.confirmar || M.nota)) out.push({ t: 'p', texto: '[' + (M.confirmar ? 'Los datos de canales y modelos de ' + P.marca + ' son valores de referencia por confirmar con el fabricante. ' : '') + (M.nota || '') + ']' });
    out.push({ t: 'p', texto: 'Los modelos, las cantidades y las dimensiones de las cajas deberán ser confirmados por el integrador con el fabricante antes de la emisión para compra.' });

    out.push({ t: 'h1', texto: '2. Resumen de la selección' });
    out.push({ t: 'tabla', titulo: 'Resumen de la selección de controladores', cols: [6, 3], align: ['l', 'r'], filas: [['Concepto', 'Valor'],
      ['Controladores principales (CP)', S(nCP)], ['Controladores secundarios (CS)', S(nCS)], ['Controladores base', S(sumaTipo('Controlador'))], ['Módulos de expansión', S(sumaTipo('Módulo'))],
      ['Dispositivos en la red (controladores, módulos e integraciones)', S(mot.disp)],
      ['Motor de red / supervisor', mot.motor ? mot.motor.cod + (mot.excede ? ' — excede el máximo de ' + mot.motor.maxDisp + ' dispositivos' : ' (hasta ' + mot.motor.maxDisp + ' dispositivos)') : '—'],
      ['Integraciones (gateways)', [...res.gwTodos].join(', ') || '—']] });
    if (mot.excede) out.push({ t: 'p', texto: '[Los dispositivos exceden el máximo del motor de red seleccionado: se requiere un motor mayor o dividir la red.]' });

    out.push({ t: 'horizontal' });
    out.push({ t: 'h1', texto: '3. Selección por controlador' });
    out.push({ t: 'p', texto: 'La tabla compara los puntos asignados a cada controlador, con y sin reserva, contra el hardware seleccionado y su capacidad instalada.' });
    out.push({ t: 'tabla', titulo: 'Puntos requeridos y hardware seleccionado por controlador', cols: [2.1, 1, 1, 1, 1, 1, 1, 1.2, 4.4, 2.1], align: ['l', 'l', 'r', 'r', 'r', 'r', 'r', 'r', 'l', 'l'],
      filas: [['Controlador', 'Nivel', 'AI', 'AO', 'DI', 'DO', 'INT', 'Cabl. con reserva', 'Hardware seleccionado', 'Verificación'],
        ...mot.detalle.map((d) => { const n = C.nivelDe(d.c.nivel), cab = C.cable(d.t); return [C.nombreCtrl(d.c), n ? n.codigo : '—', S(d.t.ai), S(d.t.ao), S(d.t.di), S(d.t.do), S(d.t.int), S(C.cable(d.req)), hw(d.cfg) + (d.manual ? ' (manual)' : ''), cab ? (d.ev.ok ? 'Cubre los puntos' : '[Faltan ' + d.ev.falta + ' puntos]') : (d.t.int ? 'Solo integración' : 'Sin puntos')]; })] });
    out.push({ t: 'tabla', titulo: 'Capacidad instalada por controlador', nota: 'Nota: UI = entrada universal, BI = entrada binaria, CO = salida configurable, BO = salida binaria, AO = salida analógica, UIO = entrada/salida universal.', cols: [3, 1, 1, 1, 1, 1, 1, 1.4], align: ['l', 'r', 'r', 'r', 'r', 'r', 'r', 'r'],
      filas: [['Controlador', ...CAN.map((k) => TXT[k]), 'Total'], ...mot.detalle.filter((d) => C.cable(d.t) > 0).map((d) => [C.nombreCtrl(d.c), ...CAN.map((k) => S(d.ev.cap[k] || 0)), S(C.canalesDe(d.ev.cap))])] });

    out.push({ t: 'h1', texto: '4. Lista de materiales' });
    out.push({ t: 'p', texto: 'La lista incluye los controladores base y módulos de la marca ' + P.marca + ', el motor de red y las cajas de los paneles. Las cantidades salen de la selección anterior.' });
    const bom = Object.keys(mot.bom || {}).map((cod) => [cod, desc(cod), tipoDe(cod), S(mot.bom[cod])]);
    if (mot.motor) bom.push([mot.motor.cod, mot.motor.desc || '—', 'Motor de red', '1']);
    const cajas = new Map(), vistos = new Set();
    mot.detalle.forEach((d) => { const k = C.gabDe(d.c) || d.c.id; if (vistos.has(k)) return; vistos.add(k); const dim = C.panelCanon((E.gabDim && E.gabDim[k]) || C.panelSugerido(C.unidadesPanel(d.c, detMap))); cajas.set(dim, (cajas.get(dim) || 0) + 1); });
    [...cajas.entries()].forEach(([dim, q]) => bom.push([dim, C.panelModelo(dim), 'Caja', S(q)]));
    out.push({ t: 'tabla', titulo: 'Lista de materiales de controladores, módulos y cajas — ' + P.marca, cols: [3, 8, 2, 1], align: ['l', 'l', 'l', 'r'], filas: [['Código', 'Descripción', 'Tipo', 'Cant.'], ...(bom.length ? bom : [['—', '—', '—', '—']])] });

    out.push({ t: 'h1', texto: '5. Dispositivos de red e integraciones' });
    const disp = [];
    if (mot.motor) disp.push([mot.motor.cod + ' — ' + (mot.motor.desc || 'motor de red'), 'Motor de red / supervisor', '1', '—', '—']);
    const corto = (t) => String(t).replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
    BMS.diag.gateways(res, C.nivelDe).forEach((g) => disp.push([g.gw + ' (' + [...new Set(g.items.map((i) => corto(i.tipo.nombre)))].join(', ') + ')', 'Gateway ' + NOMRED[g.clave], '1', [...new Set(g.items.flatMap((i) => [...i.niv]))].join(', ') || '—', S(g.items.reduce((a, i) => a + i.ints, 0))]));
    BMS.diag.paneles(res, C.nivelDe).forEach((q) => disp.push([corto(q.tipo.nombre) + (q.tags.length ? ' (' + q.tags.slice(0, 3).join(', ') + ')' : ''), 'Equipo de red ' + NOMRED[q.clave], S(q.qty), [...q.niv].join(', ') || '—', S(q.int)]));
    out.push({ t: 'tabla', titulo: 'Dispositivos de red e integraciones', nota: 'Nota: los puntos de integración (INT) entran por gateway y no consumen canales; sí cuentan como dispositivos para el motor de red.', cols: [6, 3, 1, 2, 1.4], align: ['l', 'l', 'r', 'l', 'r'], filas: [['Dispositivo', 'Tipo y protocolo', 'Cant.', 'Niveles', 'Puntos INT'], ...(disp.length ? disp : [['—', '—', '—', '—', '—']])] });
    const portada = [P.nombre || 'Proyecto', 'Selección de controladores y lista de materiales del BMS', 'Documento complementario a la Matriz de Puntos', '', 'Los valores entre corchetes [ ] deben ser validados con el fabricante o el diseñador antes de emitir.'];
    return { portada, bloques: out };
  };
  const exportarMemoria = async (btn) => {
    const P = BMS.estado.proyecto, t0 = btn.textContent;
    try {
      btn.disabled = true; btn.textContent = 'Generando…';
      const { portada, bloques } = memoria();
      BMS.docxLang = 'es';
      const blob = await BMS.exportarSecuenciasDocx('Selección de controladores', portada, bloques, { codigo: 'MC-BMS-01', revision: 'A', fecha: P.fecha || '', estado: P.estado || '', preparado: P.preparado || 'Sinergia Ingeniería' });
      BMS.descargar('Seleccion_de_controladores_y_materiales_' + (P.nombre || 'proyecto').replace(/[^\w\-]+/g, '_') + '.docx', blob);
    } catch (e) { alert('No se pudo exportar: ' + e.message); } finally { btn.disabled = false; btn.textContent = t0; }
  };

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
    root.append(h('div', { class: 'fila noprint' }, h('button', { class: 'b p', title: 'Word con la selección de controladores, la capacidad por controlador y la lista de materiales, en formato de memoria Sinergia', onclick: (e) => exportarMemoria(e.currentTarget) }, 'Exportar memoria a Word (selección y materiales)')));
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
