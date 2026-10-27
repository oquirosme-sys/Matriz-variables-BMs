/* Página 1: información del proyecto, niveles y controladores (CP / CS). */
(function () {
  const { h, uid, num } = BMS;

  const campo = (rot, obj, k, tipo) => h('label', { class: 'f' }, rot,
    h('input', { class: 'in', type: tipo || 'text', value: obj[k] == null ? '' : obj[k], onchange: (e) => { obj[k] = e.target.value; BMS.touch(); document.getElementById('proyNombre').textContent = [BMS.estado.proyecto.nombre, BMS.estado.proyecto.ubicacion].filter(Boolean).join(' · '); } }));

  const consecSiguiente = (tipo, nivel, excepto) => {
    const usados = BMS.estado.controladores.filter((c) => c !== excepto && c.tipo === tipo && c.nivel === nivel).map((c) => num(c.consec));
    let n = 1; while (usados.includes(n)) n++; return n;
  };

  BMS.pProyecto = (root) => {
    const E = BMS.estado, P = E.proyecto;
    root.append(h('h2', null, 'Información del proyecto'),
      h('p', { class: 'hint' }, 'Defina el proyecto, los niveles del edificio y los controladores. CP = controlador principal, CS = controlador secundario. El nombre sale como TIPO-NIVEL-CONSECUTIVO (por ejemplo CS-N2-01).'));

    root.append(h('div', { class: 'card' }, h('div', { class: 'grid' },
      campo('Nombre del proyecto', P, 'nombre'), campo('Propietario / cliente', P, 'propietario'),
      campo('Ubicación', P, 'ubicacion'), campo('Preparado por', P, 'preparado'),
      campo('Fecha', P, 'fecha', 'date'),
      h('label', { class: 'f' }, 'Estado', h('select', { class: 'in', value: P.estado, onchange: (e) => { P.estado = e.target.value; BMS.touch(); } },
        ['Borrador', 'En revisión', 'Aprobado'].map((s) => h('option', { value: s }, s)))))));

    /* Niveles */
    const cuerpoN = h('tbody');
    const pintaNiveles = () => {
      cuerpoN.replaceChildren();
      E.niveles.forEach((n, i) => {
        const usos = E.equipos.filter((q) => q.nivel === n.id).length;
        cuerpoN.append(h('tr', null,
          h('td', { class: 'c' }, i + 1),
          h('td', null, h('input', { class: 'in', style: { width: '80px' }, value: n.codigo, onchange: (e) => {
            const v = e.target.value.trim().toUpperCase().replace(/\s+/g, '');
            if (!v || E.niveles.some((x) => x !== n && x.codigo === v)) { alert('El código de nivel está vacío o repetido.'); e.target.value = n.codigo; return; }
            n.codigo = v; e.target.value = v; BMS.touch(); BMS.rerender();
          } })),
          h('td', null, h('input', { class: 'in', style: { width: '100%' }, value: n.nombre, onchange: (e) => { n.nombre = e.target.value; BMS.touch(); } })),
          h('td', { class: 'c' }, usos + ' equipos'),
          h('td', { class: 'c' },
            h('button', { class: 'b s', title: 'Subir', disabled: i === 0, onclick: () => { E.niveles.splice(i - 1, 0, E.niveles.splice(i, 1)[0]); BMS.touch(); BMS.rerender(); } }, '↑'), ' ',
            h('button', { class: 'b s', title: 'Bajar', disabled: i === E.niveles.length - 1, onclick: () => { E.niveles.splice(i + 1, 0, E.niveles.splice(i, 1)[0]); BMS.touch(); BMS.rerender(); } }, '↓'), ' ',
            h('button', { class: 'b x', title: 'Eliminar nivel', onclick: () => {
              const nc = E.controladores.filter((c) => c.nivel === n.id).length;
              if ((usos || nc) && !confirm('El nivel ' + n.codigo + ' tiene ' + usos + ' equipos y ' + nc + ' controladores. Se eliminarán también. ¿Continuar?')) return;
              E.niveles.splice(i, 1);
              E.equipos = E.equipos.filter((q) => q.nivel !== n.id);
              E.controladores = E.controladores.filter((c) => c.nivel !== n.id);
              BMS.touch(); BMS.rerender();
            } }, '✕'))));
      });
    };
    pintaNiveles();
    root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Niveles del edificio'),
      h('p', { class: 'hint' }, 'De abajo hacia arriba: el primer nivel de la lista es el más bajo (en el diagrama se dibuja al pie).'),
      h('table', { class: 't', style: { maxWidth: '720px' } }, h('thead', null, h('tr', null, ['#', 'Código', 'Nombre', 'Uso', ''].map((x) => h('th', null, x)))), cuerpoN),
      h('div', { class: 'fila' },
        h('button', { class: 'b p', onclick: () => { const n = E.niveles.length + 1; E.niveles.push({ id: uid(), codigo: 'N' + n, nombre: 'Nivel ' + n }); BMS.touch(); BMS.rerender(); } }, '+ Agregar nivel'))));

    /* Controladores */
    const cuerpoC = h('tbody');
    const pintaCtrl = () => {
      cuerpoC.replaceChildren();
      const ord = E.controladores.map((c, i) => ({ c, i })).sort((a, b) => E.niveles.findIndex((n) => n.id === a.c.nivel) - E.niveles.findIndex((n) => n.id === b.c.nivel) || (a.c.tipo === 'CP' ? -1 : 1) - (b.c.tipo === 'CP' ? -1 : 1));
      ord.forEach(({ c }) => {
        const nm = h('td', { class: 'calc c', style: { fontWeight: 600 } }, BMS.calc.nombreCtrl(c));
        const act = () => { nm.textContent = BMS.calc.nombreCtrl(c); BMS.touch(); };
        const dup = () => E.controladores.some((x) => x !== c && x.tipo === c.tipo && x.nivel === c.nivel && num(x.consec) === num(c.consec));
        cuerpoC.append(h('tr', null,
          h('td', null, h('select', { class: 'in', value: c.tipo, onchange: (e) => { c.tipo = e.target.value; c.consec = consecSiguiente(c.tipo, c.nivel, c); BMS.touch(); BMS.rerender(); } }, ['CP', 'CS'].map((t) => h('option', { value: t }, t)))),
          h('td', null, h('select', { class: 'in', value: c.nivel, onchange: (e) => { c.nivel = e.target.value; c.consec = consecSiguiente(c.tipo, c.nivel, c); BMS.touch(); BMS.rerender(); } }, E.niveles.map((n) => h('option', { value: n.id }, n.codigo + ' — ' + n.nombre)))),
          h('td', null, h('input', { class: 'in n', type: 'number', min: 1, value: c.consec, onchange: (e) => { const ant = c.consec; c.consec = Math.max(1, Math.round(num(e.target.value, 1))); if (dup()) { alert('Ya existe un controlador con ese nombre.'); c.consec = ant; e.target.value = ant; } act(); } })),
          nm,
          h('td', null, h('input', { class: 'in', style: { width: '100%' }, value: c.ubicacion || '', onchange: (e) => { c.ubicacion = e.target.value; BMS.touch(); } })),
          h('td', null, h('input', { class: 'in', style: { width: '100%' }, value: c.obs || '', onchange: (e) => { c.obs = e.target.value; BMS.touch(); } })),
          h('td', { class: 'c' }, h('button', { class: 'b x', onclick: () => {
            const nq = E.equipos.filter((q) => q.ctrl === c.id).length;
            if (nq && !confirm('Hay ' + nq + ' equipos asignados manualmente a este controlador; pasarán a asignación automática. ¿Continuar?')) return;
            E.equipos.forEach((q) => { if (q.ctrl === c.id) q.ctrl = 'auto'; });
            E.controladores.splice(E.controladores.indexOf(c), 1); BMS.touch(); BMS.rerender();
          } }, '✕'))));
      });
    };
    pintaCtrl();
    const agregar = (tipo) => {
      if (!E.niveles.length) { alert('Primero agregue al menos un nivel.'); return; }
      const nivel = BMS.ui.nivelSel && E.niveles.find((n) => n.id === BMS.ui.nivelSel) ? BMS.ui.nivelSel : E.niveles[0].id;
      E.controladores.push({ id: uid(), tipo, nivel, consec: consecSiguiente(tipo, nivel), ubicacion: '', obs: '', modo: 'auto' });
      BMS.touch(); BMS.rerender();
    };
    root.append(h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Controladores'),
      h('p', { class: 'hint' }, 'El consecutivo se cuenta por nivel y por tipo (CS-N2-01, CS-N2-02…). El modelo de cada controlador se escoge en la pestaña 5.'),
      h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Tipo', 'Nivel', 'Consec.', 'Nombre', 'Cuarto / ubicación', 'Observación', ''].map((x) => h('th', null, x)))), cuerpoC)),
      h('div', { class: 'fila' },
        h('button', { class: 'b p', onclick: () => agregar('CS') }, '+ Controlador secundario (CS)'),
        h('button', { class: 'b', onclick: () => agregar('CP') }, '+ Controlador principal (CP)'),
        h('button', { class: 'b', onclick: () => {
          let n = 0;
          E.niveles.forEach((nv) => { if (!E.controladores.some((c) => c.nivel === nv.id)) { E.controladores.push({ id: uid(), tipo: 'CS', nivel: nv.id, consec: 1, ubicacion: '', obs: '', modo: 'auto' }); n++; } });
          if (!n) alert('Todos los niveles ya tienen controlador.'); else { BMS.touch(); BMS.rerender(); }
        } }, 'Crear 1 CS en cada nivel sin controlador'))));

    root.append(h('div', { class: 'fila noprint' },
      h('button', { class: 'b', onclick: () => { if (confirm('¿Cargar el ejemplo Fairfield Guayabos? Reemplaza el proyecto actual.')) { BMS.estado = BMS.proyectoEjemplo(); BMS.ui.nivelSel = null; BMS.touch(); BMS.rerender(); } } }, 'Cargar ejemplo Fairfield Guayabos'),
      h('button', { class: 'b', onclick: () => { if (confirm('¿Empezar un proyecto en blanco? Se pierde el proyecto actual (el catálogo se conserva).')) { BMS.estado = BMS.proyectoNuevo(); BMS.ui.nivelSel = null; BMS.touch(); BMS.rerender(); } } }, 'Proyecto nuevo en blanco'),
      h('button', { class: 'b p', onclick: () => BMS.ir('diagrama') }, 'Siguiente: diagrama →')));
  };
})();
