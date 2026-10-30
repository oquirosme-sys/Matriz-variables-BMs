/* Arranque, pestañas y exportar/importar proyecto. */
(function () {
  const { h } = BMS;
  BMS.paginas = [
    { id: 'proyecto', n: '1 · Proyecto', fn: () => BMS.pProyecto },
    { id: 'diagrama', n: '2 · Diagrama', fn: () => BMS.pDiagrama },
    { id: 'equipos', n: '3 · Equipos por nivel', fn: () => BMS.pEquipos },
    { id: 'resumen', n: '4 · Resumen', fn: () => BMS.pResumen },
    { id: 'controladores', n: '5 · Controladores', fn: () => BMS.pControladores },
    { id: 'secuencias', n: '6 · Secuencias', fn: () => BMS.pSecuencias },
    { id: 'catalogo', sep: true, n: 'Catálogo de variables', fn: () => BMS.pCatalogo },
    { id: 'catctrl', n: 'Catálogo de controladores', fn: () => BMS.pCatCtrl }
  ];

  BMS.rerender = () => {
    const y = window.scrollY;
    const root = document.getElementById('app');
    root.replaceChildren();
    const pg = BMS.paginas.find((p) => p.id === BMS.ui.pagina);
    try { pg.fn()(root); } catch (e) {
      console.error(e); root.replaceChildren();
      root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'No se pudo mostrar esta pestaña'), h('p', null, String(e && e.message || e)),
        h('p', { class: 'hint' }, 'Pruebe con otra pestaña. Si el problema continúa, puede exportar el proyecto y borrar los datos guardados de este navegador.'),
        h('div', { class: 'fila' },
          h('button', { class: 'b', onclick: () => BMS.ir('proyecto') }, 'Ir a Proyecto'),
          h('button', { class: 'b x', onclick: () => { if (confirm('Esto borra el proyecto y los catálogos guardados en este navegador. ¿Continuar?')) { Object.keys(localStorage).filter((k) => k.indexOf('bms.') === 0).forEach((k) => localStorage.removeItem(k)); location.reload(); } } }, 'Borrar datos guardados'))));
    }
    document.getElementById('proyNombre').textContent = [BMS.estado.proyecto.nombre, BMS.estado.proyecto.ubicacion].filter(Boolean).join(' · ');
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.id === BMS.ui.pagina));
    window.scrollTo(0, y);
  };
  BMS.ir = (id) => { BMS.ui.pagina = id; BMS.rerender(); window.scrollTo(0, 0); };
  BMS.touch = () => BMS.guardar();

  function tabs() {
    const nav = document.getElementById('tabs');
    nav.replaceChildren();
    BMS.paginas.forEach((p) => {
      if (p.sep) nav.append(h('span', { class: 'sep' }));
      nav.append(h('button', { 'data-id': p.id, onclick: () => BMS.ir(p.id) }, p.n));
    });
  }

  /* Archivo del proyecto: con Chrome/Edge se guarda sobre el mismo archivo; en otros navegadores se descarga. El navegador además guarda solo una copia de trabajo. */
  let manejador = null, sucio = false;
  const etq = () => {
    const e = document.getElementById('estadoArchivo'); if (!e) return;
    e.textContent = sucio ? 'Cambios sin guardar en archivo' : (manejador ? 'Archivo: ' + manejador.name : '');
    e.style.color = sucio ? '#b45309' : '';
  };
  const guardar0 = BMS.guardar;
  BMS.guardar = () => { sucio = true; etq(); guardar0(); };
  const paquete = () => JSON.stringify({ proyecto: BMS.estado, catalogoEquipos: BMS.catEq, catalogoControladores: BMS.catCt }, null, 1);
  const nombreArchivo = () => (BMS.estado.proyecto.nombre || 'proyecto-bms').replace(/[^\w\-]+/g, '_') + '.bms.json';
  const guardarArchivo = async (como) => {
    const txt = paquete();
    if (window.showSaveFilePicker) {
      try {
        if (como || !manejador) manejador = await window.showSaveFilePicker({ suggestedName: nombreArchivo(), types: [{ description: 'Proyecto BMS', accept: { 'application/json': ['.json'] } }] });
        const w = await manejador.createWritable(); await w.write(txt); await w.close();
        sucio = false; etq(); return true;
      } catch (e) { if (e && e.name === 'AbortError') return false; manejador = null; }
    }
    BMS.descargar(nombreArchivo(), txt, 'application/json'); sucio = false; etq(); return true;
  };
  const cargarTexto = (txt, handle) => {
    try {
      const d = JSON.parse(txt);
      if (!d.proyecto || !d.proyecto.niveles) throw new Error('El archivo no es un proyecto de esta herramienta.');
      if (!confirm('Esto reemplaza el proyecto actual en este navegador. ¿Continuar?')) return;
      BMS.estado = d.proyecto;
      if (d.catalogoEquipos && d.catalogoEquipos.tipos) { BMS.catEq = d.catalogoEquipos; BMS.guardarCatEq(); }
      if (d.catalogoControladores && d.catalogoControladores.marcas) { BMS.catCt = d.catalogoControladores; BMS.guardarCatCt(); }
      BMS.ui.nivelSel = null; BMS.guardar(); manejador = handle || null; sucio = false; etq(); BMS.rerender();
    } catch (e) { alert('No se pudo importar: ' + e.message); }
  };
  document.getElementById('bExportar').onclick = () => guardarArchivo(false);
  document.getElementById('bGuardarComo').onclick = () => guardarArchivo(true);
  document.getElementById('bImportar').onclick = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [hd] = await window.showOpenFilePicker({ types: [{ description: 'Proyecto BMS', accept: { 'application/json': ['.json'] } }] });
        cargarTexto(await (await hd.getFile()).text(), hd);
      } catch (e) { if (!e || e.name !== 'AbortError') alert('No se pudo abrir: ' + (e && e.message || e)); }
      return;
    }
    BMS.leerArchivo('.json', (txt) => cargarTexto(txt));
  };
  document.getElementById('bNuevo').onclick = async () => {
    if (sucio) {
      if (confirm('Hay cambios que no se han guardado en un archivo.\n\nAceptar: guardar el proyecto actual y empezar uno nuevo.\nCancelar: ver otras opciones.')) { if (!(await guardarArchivo(false))) return; }
      else if (!confirm('¿Descartar los cambios y empezar un proyecto nuevo?')) return;
    } else if (!confirm('¿Empezar un proyecto nuevo? Se vacía el proyecto actual; los catálogos se conservan.')) return;
    BMS.estado = BMS.proyectoNuevo(); manejador = null;
    BMS.ui.nivelSel = null; BMS.ui.secSel = 0;
    BMS.guardar(); sucio = false; etq(); BMS.ir('proyecto');
  };
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's') { e.preventDefault(); guardarArchivo(e.shiftKey); } });

  BMS.cargarTodo().catch((e) => { console.error(e); BMS.estado = BMS.estado || BMS.proyectoNuevo(); }).then(() => { tabs(); sucio = false; etq(); BMS.rerender(); });
})();
