/* Catálogo de variables por tipo de equipo (un tipo por equipo, sin repetidos). */
(function () {
  const { h, uid, num } = BMS;
  BMS.ui.tipoSel = null;

  const normaliza = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

  BMS.pCatalogo = (root) => {
    const CAT = BMS.catEq, E = BMS.estado;
    if (!CAT.tipos.find((t) => t.id === BMS.ui.tipoSel)) BMS.ui.tipoSel = CAT.tipos[0] && CAT.tipos[0].id;
    const tipo = CAT.tipos.find((t) => t.id === BMS.ui.tipoSel);
    const usos = (id) => E.equipos.filter((q) => q.tipoId === id).length;

    root.append(h('h2', null, 'Catálogo de variables por tipo de equipo'),
      h('p', { class: 'hint' }, 'Cada tipo de equipo aparece una sola vez. Aquí se actualizan las variables (puntos) que se cargan al escoger el equipo en la pestaña 3. Los cambios aplican a todos los equipos de ese tipo ya cargados.'));

    const lista = h('div', { class: 'lista' });
    const pintaLista = (q) => {
      lista.replaceChildren();
      const ids = q && q.trim() ? new Set(BMS.buscarTipos(q, 300).map((t) => t.id)) : null;
      let n = 0;
      CAT.categorias.forEach((cat) => {
        const ts = CAT.tipos.filter((t) => t.cat === cat.id && (!ids || ids.has(t.id)));
        if (!ts.length) return;
        lista.append(h('div', { class: 'grp' }, cat.nombre));
        ts.forEach((t) => { n++; lista.append(h('div', { class: 'it' + (t.id === BMS.ui.tipoSel ? ' on' : ''), onclick: () => { BMS.ui.tipoSel = t.id; BMS.rerender(); } }, h('span', null, t.nombre), h('span', { class: 'badge' }, t.pts.length))); });
      });
      if (!n) lista.append(h('div', { class: 'it mute' }, 'Sin coincidencias'));
    };
    pintaLista(BMS.ui.busCat || '');
    const buscaCat = h('input', { class: 'in', style: { width: '100%', marginBottom: '6px' }, placeholder: 'Buscar equipo (ej. generador, VFD, UPS…)', autocomplete: 'off', value: BMS.ui.busCat || '', oninput: (e) => { BMS.ui.busCat = e.target.value; pintaLista(e.target.value); } });
    const izq = h('div', null, buscaCat, lista);

    let editor;
    if (!tipo) editor = h('div', { class: 'warnbox' }, 'El catálogo está vacío.');
    else {
      const cuerpo = h('tbody');
      const celda = (p, k, w) => h('td', null, h('input', { class: 'in', style: { width: w || '100%' }, value: p[k] || '', onchange: (e) => { p[k] = e.target.value; BMS.guardarCatEq(); } }));
      const cnum = (p, k) => h('td', null, h('input', { class: 'in n', style: { width: '56px' }, type: 'number', min: 0, value: p[k], onchange: (e) => { p[k] = Math.max(0, Math.round(num(e.target.value))); e.target.value = p[k]; BMS.guardarCatEq(); } }));
      tipo.pts.forEach((p, i) => cuerpo.append(h('tr', null, h('td', { class: 'c' }, i + 1), celda(p, 'n', '320px'), ['ai', 'ao', 'di', 'do', 'int'].map((k) => cnum(p, k)), celda(p, 'alm', '90px'), celda(p, 'tend', '80px'), celda(p, 'ifc', '140px'),
        h('td', { class: 'c' }, h('button', { class: 'b s', disabled: i === 0, onclick: () => { tipo.pts.splice(i - 1, 0, tipo.pts.splice(i, 1)[0]); BMS.guardarCatEq(); BMS.rerender(); } }, '↑'), ' ',
          h('button', { class: 'b x', onclick: () => { tipo.pts.splice(i, 1); BMS.guardarCatEq(); BMS.rerender(); } }, '✕')))));
      const sumas = tipo.pts.reduce((a, p) => { a.ai += p.ai; a.ao += p.ao; a.di += p.di; a.do += p.do; a.int += p.int; return a; }, { ai: 0, ao: 0, di: 0, do: 0, int: 0 });
      editor = h('div', null,
        h('div', { class: 'card' }, h('div', { class: 'grid' },
          h('label', { class: 'f' }, 'Nombre del equipo (único)', h('input', { class: 'in', value: tipo.nombre, onchange: (e) => {
            const v = e.target.value.trim();
            if (!v || CAT.tipos.some((t) => t !== tipo && normaliza(t.nombre) === normaliza(v))) { alert('Ya existe un equipo con ese nombre en el catálogo (o el nombre está vacío). No se permiten repetidos.'); e.target.value = tipo.nombre; return; }
            tipo.nombre = v; BMS.guardarCatEq(); BMS.rerender();
          } })),
          h('label', { class: 'f' }, 'Sistema', h('select', { class: 'in', value: tipo.cat, onchange: (e) => { tipo.cat = e.target.value; BMS.guardarCatEq(); BMS.rerender(); } }, CAT.categorias.map((c) => h('option', { value: c.id }, c.nombre)))),
          h('label', { class: 'f' }, 'Prefijo de tag (termina en "-" para numerar)', h('input', { class: 'in', value: tipo.tag || '', onchange: (e) => { tipo.tag = e.target.value.trim(); BMS.guardarCatEq(); } })),
          h('label', { class: 'f' }, 'Integración / gateway', h('input', { class: 'in', placeholder: 'GW-VRF, GW-MODBUS…', value: tipo.gw || '', onchange: (e) => { tipo.gw = e.target.value.trim(); BMS.guardarCatEq(); } })),
          h('label', { class: 'f' }, 'Comunicación por defecto', h('select', { class: 'in', value: tipo.com || (tipo.ip ? 'A' : 'D'), onchange: (ev) => { tipo.com = ev.target.value; tipo.ip = ev.target.value !== 'D'; BMS.guardarCatEq(); BMS.rerender(); } }, [['D', 'Cableado (D)'], ['A', 'BACnet/IP (A)'], ['B', 'BACnet MS/TP (B)'], ['E', 'Modbus TCP/IP (E)'], ['C', 'Modbus RTU (C)']].map(([v, t]) => h('option', { value: v }, t)))),
          h('label', { class: 'f', style: { gridColumn: '1 / -1' } }, 'Nota / origen de las variables', h('input', { class: 'in', value: tipo.nota || '', onchange: (e) => { tipo.nota = e.target.value; BMS.guardarCatEq(); } })))),
        h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['#', 'Descripción / punto', 'AI', 'AO', 'DI', 'DO', 'INT', 'Alarma', 'Tendencia', 'Interfaz', ''].map((x) => h('th', null, x)))), cuerpo,
          h('tfoot', null, h('tr', { class: 'tot' }, h('td'), h('td', null, 'Total por equipo'), ['ai', 'ao', 'di', 'do', 'int'].map((k) => h('td', { class: 'r' }, sumas[k])), h('td', { colspan: 4 }))))),
        h('div', { class: 'fila' },
          h('button', { class: 'b p', onclick: () => { tipo.pts.push({ id: tipo.id + '_' + uid(), n: 'Nuevo punto', ai: 0, ao: 0, di: 1, do: 0, int: 0, alm: '', tend: '', ifc: 'Cableado' }); BMS.guardarCatEq(); BMS.rerender(); } }, '+ Agregar variable'),
          h('button', { class: 'b x', onclick: () => {
            const u = usos(tipo.id);
            if (!confirm('¿Eliminar el equipo "' + tipo.nombre + '" del catálogo?' + (u ? ' Está en ' + u + ' filas de equipos del proyecto, que quedarán marcadas como tipo eliminado.' : ''))) return;
            CAT.tipos.splice(CAT.tipos.indexOf(tipo), 1); BMS.ui.tipoSel = null; BMS.guardarCatEq(); BMS.rerender();
          } }, 'Eliminar este equipo')));
    }

    root.append(h('div', { class: 'fila noprint' },
      h('button', { class: 'b p', onclick: () => {
        const nombre = (prompt('Nombre del nuevo equipo (no puede repetirse):') || '').trim();
        if (!nombre) return;
        if (CAT.tipos.some((t) => normaliza(t.nombre) === normaliza(nombre))) { alert('Ya existe un equipo con ese nombre.'); return; }
        const id = 'u_' + uid();
        CAT.tipos.push({ id, cat: (tipo && tipo.cat) || CAT.categorias[0].id, nombre, tag: '', gw: '', nota: '', pts: [{ id: id + '_1', n: 'Estado', ai: 0, ao: 0, di: 1, do: 0, int: 0, alm: '', tend: '', ifc: 'Cableado' }] });
        BMS.ui.tipoSel = id; BMS.guardarCatEq(); BMS.rerender();
      } }, '+ Nuevo equipo en el catálogo'),
      h('button', { class: 'b p', title: 'Una pestaña por disciplina, con numeración, cantidades y totales por fórmula, para que el equipo de cada disciplina valide las variables', onclick: () => BMS.exportarCatalogoXlsx() }, 'Exportar a Excel (por disciplina)'),
      h('button', { class: 'b', title: 'Lee el Excel exportado (con los cambios validados por cada disciplina) y actualiza el catálogo', onclick: () => BMS.importarCatalogoXlsx() }, 'Importar desde Excel (validado)'),
      h('button', { class: 'b', onclick: () => BMS.descargar('catalogo-equipos.json', JSON.stringify(CAT, null, 1), 'application/json') }, 'Exportar catálogo (JSON)'),
      h('button', { class: 'b', onclick: () => BMS.leerArchivo('.json', (t) => { try { const d = JSON.parse(t); if (!d.tipos || !d.categorias) throw new Error('Formato no válido'); if (!confirm('Reemplazar el catálogo actual?')) return; BMS.catEq = d; BMS.guardarCatEq(); BMS.rerender(); } catch (e) { alert('No se pudo importar: ' + e.message); } }) }, 'Importar catálogo'),
      h('button', { class: 'b', onclick: () => { if (confirm('Restaurar el catálogo base del Excel? Se pierden los cambios hechos al catálogo.')) { BMS.catEq = BMS.clone(window.BMS_CATALOGO_EQUIPOS); BMS.ui.tipoSel = null; BMS.guardarCatEq(); BMS.rerender(); } } }, 'Restaurar catálogo base')));
    root.append(h('div', { class: 'split' }, izq, editor));
  };
})();
