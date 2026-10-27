/* Catálogo de controladores, módulos y motores de red por marca (editable). */
(function () {
  const { h, num } = BMS;
  BMS.ui.marcaCat = null;

  BMS.pCatCtrl = (root) => {
    const marcas = BMS.catCt.marcas;
    if (!marcas[BMS.ui.marcaCat]) BMS.ui.marcaCat = BMS.estado.proyecto.marca in marcas ? BMS.estado.proyecto.marca : Object.keys(marcas)[0];
    const id = BMS.ui.marcaCat, M = marcas[id];
    const g = () => BMS.guardarCatCt();

    root.append(h('h2', null, 'Catálogo de controladores'),
      h('p', { class: 'hint' }, 'Canales por modelo. Con estos datos se hace la selección automática de la pestaña 5. Ajuste aquí cualquier modelo o canal.'),
      h('div', { class: 'fila' }, Object.keys(marcas).map((k) => h('button', { class: 'b' + (k === id ? ' p' : ''), onclick: () => { BMS.ui.marcaCat = k; BMS.rerender(); } }, k)),
        h('label', null, 'Máx. módulos por controlador base: ', h('input', { class: 'in n', type: 'number', min: 1, value: M.maxModulosPorBase, onchange: (e) => { M.maxModulosPorBase = Math.max(1, Math.round(num(e.target.value, 10))); g(); } }))));
    if (M.nota) root.append(h('div', { class: 'warnbox' }, M.nota));
    if (M.confirmar) root.append(h('div', { class: 'warnbox' }, 'Los datos de ' + id + ' son valores de referencia por confirmar con el fabricante.'));

    const txt = (o, k, w) => h('td', null, h('input', { class: 'in', style: { width: w || '100%' }, value: o[k] || '', onchange: (e) => { o[k] = e.target.value; g(); } }));
    const nm = (o, k) => h('td', null, h('input', { class: 'in n', style: { width: '52px' }, type: 'number', min: 0, value: o[k] || 0, onchange: (e) => { o[k] = Math.max(0, Math.round(num(e.target.value))); g(); } }));
    const tabla = (titulo, arr, nuevo, conMax) => {
      const cuerpo = h('tbody', null, arr.map((o, i) => h('tr', null, txt(o, 'cod', '110px'), txt(o, 'desc'), ['ui', 'bi', 'co', 'bo', 'ao', 'uio'].map((k) => nm(o, k)), conMax ? nm(o, 'maxMod') : null, txt(o, 'fuente', '170px'),
        h('td', { class: 'c' }, h('button', { class: 'b x', onclick: () => { if (confirm('¿Eliminar ' + o.cod + '?')) { arr.splice(i, 1); g(); BMS.rerender(); } } }, '✕')))));
      return h('div', null, h('h3', null, titulo), h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Código', 'Descripción', 'UI', 'BI', 'CO', 'BO', 'AO', 'UIO', ...(conMax ? ['Máx. módulos'] : []), 'Fuente', ''].map((x) => h('th', null, x)))), cuerpo)),
        h('div', { class: 'fila' }, h('button', { class: 'b p', onclick: () => { arr.push(nuevo()); g(); BMS.rerender(); } }, '+ Agregar')));
    };
    root.append(tabla('Controladores base', M.bases, () => ({ cod: 'NUEVO', desc: '', ui: 0, bi: 0, co: 0, bo: 0, ao: 0, uio: 0, maxMod: 0, fuente: '' }), true),
      tabla('Módulos de expansión', M.modulos, () => ({ cod: 'NUEVO', desc: '', ui: 0, bi: 0, co: 0, bo: 0, ao: 0, uio: 0, fuente: '' })));

    const cm = h('tbody', null, M.motores.map((o, i) => h('tr', null, txt(o, 'cod', '160px'), txt(o, 'desc'),
      h('td', null, h('input', { class: 'in n', type: 'number', min: 1, value: o.maxDisp, onchange: (e) => { o.maxDisp = Math.max(1, Math.round(num(e.target.value, 1))); g(); } })), txt(o, 'fuente', '200px'),
      h('td', { class: 'c' }, h('button', { class: 'b x', onclick: () => { M.motores.splice(i, 1); g(); BMS.rerender(); } }, '✕')))));
    root.append(h('h3', null, 'Motores de red / supervisores'), h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Código', 'Descripción', 'Máx. dispositivos', 'Fuente', ''].map((x) => h('th', null, x)))), cm)),
      h('div', { class: 'fila' },
        h('button', { class: 'b p', onclick: () => { M.motores.push({ cod: 'NUEVO', desc: '', maxDisp: 100, fuente: '' }); g(); BMS.rerender(); } }, '+ Agregar'),
        h('button', { class: 'b', onclick: () => { if (confirm('¿Restaurar el catálogo base de controladores? Se pierden los cambios.')) { BMS.catCt = BMS.clone(window.BMS_CATALOGO_CONTROLADORES); g(); BMS.rerender(); } } }, 'Restaurar catálogo base'),
        h('button', { class: 'b', onclick: () => BMS.descargar('catalogo-controladores.json', JSON.stringify(BMS.catCt, null, 1), 'application/json') }, 'Exportar catálogo')));
  };
})();
