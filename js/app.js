/* Arranque, pestañas y exportar/importar proyecto. */
(function () {
  const { h } = BMS;
  BMS.paginas = [
    { id: 'proyecto', n: '1 · Proyecto', fn: () => BMS.pProyecto },
    { id: 'diagrama', n: '2 · Diagrama', fn: () => BMS.pDiagrama },
    { id: 'equipos', n: '3 · Equipos por nivel', fn: () => BMS.pEquipos },
    { id: 'resumen', n: '4 · Resumen', fn: () => BMS.pResumen },
    { id: 'controladores', n: '5 · Controladores', fn: () => BMS.pControladores },
    { id: 'catalogo', sep: true, n: 'Catálogo de variables', fn: () => BMS.pCatalogo },
    { id: 'catctrl', n: 'Catálogo de controladores', fn: () => BMS.pCatCtrl }
  ];

  BMS.rerender = () => {
    const y = window.scrollY;
    const root = document.getElementById('app');
    root.replaceChildren();
    const pg = BMS.paginas.find((p) => p.id === BMS.ui.pagina);
    pg.fn()(root);
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

  document.getElementById('bExportar').onclick = () => {
    const nom = (BMS.estado.proyecto.nombre || 'proyecto-bms').replace(/[^\w\-]+/g, '_');
    BMS.descargar(nom + '.bms.json', JSON.stringify({ proyecto: BMS.estado, catalogoEquipos: BMS.catEq, catalogoControladores: BMS.catCt }, null, 1), 'application/json');
  };
  document.getElementById('bImportar').onclick = () => BMS.leerArchivo('.json', (txt) => {
    try {
      const d = JSON.parse(txt);
      if (!d.proyecto || !d.proyecto.niveles) throw new Error('El archivo no es un proyecto de esta herramienta.');
      if (!confirm('Esto reemplaza el proyecto actual en este navegador. ¿Continuar?')) return;
      BMS.estado = d.proyecto;
      if (d.catalogoEquipos && d.catalogoEquipos.tipos) { BMS.catEq = d.catalogoEquipos; BMS.guardarCatEq(); }
      if (d.catalogoControladores && d.catalogoControladores.marcas) { BMS.catCt = d.catalogoControladores; BMS.guardarCatCt(); }
      BMS.ui.nivelSel = null; BMS.guardar(); BMS.rerender();
    } catch (e) { alert('No se pudo importar: ' + e.message); }
  });

  BMS.cargarTodo().then(() => { tabs(); BMS.rerender(); });
})();
