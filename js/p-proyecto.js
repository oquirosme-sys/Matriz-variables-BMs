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

    /* Valor de la serie: "S2" -> "S3", "Nivel 2" -> "Nivel 3"; con la celda de arriba se toma el paso (S1, S3 -> S5). */
    const partir = (s) => { const m = /^(.*?)(\d+)$/.exec(String(s || '')); return m ? { pre: m[1], n: parseInt(m[2], 10), w: m[2].length } : null; };
    const valorSerie = (campo, i, k) => {
      const a = partir(E.niveles[i][campo]);
      if (!a) return E.niveles[i][campo];
      const b = i > 0 ? partir(E.niveles[i - 1][campo]) : null;
      const paso = b && b.pre === a.pre && a.n !== b.n ? a.n - b.n : 1;
      const v = a.n + paso * k;
      return v < 0 ? E.niveles[i][campo] : a.pre + (String(v).length < a.w ? String(v).padStart(a.w, '0') : v);
    };
    /* Asa de relleno (cuadrito abajo a la derecha de la celda): se arrastra hacia abajo como en Excel. */
    const conAsa = (input, campo, i) => {
      const asa = h('span', { class: 'asa', title: 'Arrastre hacia abajo para rellenar con la serie' });
      asa.addEventListener('pointerdown', (ev) => {
        ev.preventDefault(); asa.setPointerCapture(ev.pointerId);
        const filas = [...cuerpoN.children], alto = filas[0].getBoundingClientRect().height, y0 = ev.clientY;
        let k = 0;
        const marca = () => filas.forEach((tr, j) => tr.classList.toggle('rel', j > i && j <= i + k));
        const mueve = (e) => { k = Math.max(0, Math.round((e.clientY - y0) / alto)); marca(); asa.title = k ? '+' + k : ''; };
        const suelta = () => {
          asa.removeEventListener('pointermove', mueve); asa.removeEventListener('pointerup', suelta); asa.removeEventListener('pointercancel', suelta);
          filas.forEach((tr) => tr.classList.remove('rel'));
          if (!k) return;
          const val = (j) => valorSerie(campo, i, j - i);
          let omitidos = 0;
          for (let j = i + 1; j <= i + k; j++) {
            const nuevo = !E.niveles[j];
            let v = val(j);
            if (campo === 'codigo') {
              v = String(v).trim().toUpperCase().replace(/\s+/g, '');
              if (!v || E.niveles.some((x, q) => q !== j && x.codigo === v)) { omitidos++; continue; }
            }
            if (nuevo) E.niveles.push({ id: uid(), codigo: campo === 'codigo' ? v : 'N' + (j + 1) + '_' + uid().slice(0, 3).toUpperCase(), nombre: campo === 'nombre' ? v : '' });
            else E.niveles[j][campo] = v;
          }
          if (omitidos) alert(omitidos + ' códigos no se llenaron por estar vacíos o repetidos.');
          BMS.touch(); BMS.rerender();
        };
        asa.addEventListener('pointermove', mueve); asa.addEventListener('pointerup', suelta); asa.addEventListener('pointercancel', suelta);
      });
      return h('div', { class: 'celda' }, input, asa);
    };
    const pintaNiveles = () => {
      cuerpoN.replaceChildren();
      E.niveles.forEach((n, i) => {
        const usos = E.equipos.filter((q) => q.nivel === n.id).length;
        cuerpoN.append(h('tr', null,
          h('td', { class: 'c' }, i + 1),
          h('td', null, conAsa(h('input', { class: 'in', style: { width: '80px' }, value: n.codigo, onchange: (e) => {
            const v = e.target.value.trim().toUpperCase().replace(/\s+/g, '');
            if (!v || E.niveles.some((x) => x !== n && x.codigo === v)) { alert('El código de nivel está vacío o repetido.'); e.target.value = n.codigo; return; }
            n.codigo = v; e.target.value = v; BMS.touch(); BMS.rerender();
          } }), 'codigo', i)),
          h('td', null, conAsa(h('input', { class: 'in', style: { width: '100%' }, value: n.nombre, onchange: (e) => { n.nombre = e.target.value; BMS.touch(); } }), 'nombre', i)),
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
    E.gabDim = E.gabDim || {};
    const detMap = {}; BMS.calc.motor(BMS.calc.todo(), P.marca).detalle.forEach((d) => (detMap[d.c.id] = d));
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
          h('td', null, h('input', { class: 'in', style: { width: '120px' }, list: 'gabs', placeholder: BMS.calc.gabDe(c) ? 'Auto: ' + BMS.calc.gabDe(c) : 'Individual (auto)', title: 'Automático: los controladores del mismo nivel y del mismo cuarto comparten gabinete. Escriba un nombre para forzar otro agrupamiento.', value: c.gab || '', onchange: (e) => { c.gab = e.target.value.trim(); BMS.touch(); BMS.rerender(); } })),
          h('td', null, (() => {
            const clave = BMS.calc.gabDe(c) || c.id, sug = BMS.calc.panelSugerido(BMS.calc.unidadesPanel(c, detMap));
            return h('div', null, h('select', { class: 'in', style: { width: '170px' }, value: E.gabDim[clave] || '', title: BMS.calc.panelModelo(E.gabDim[clave] || sug), onchange: (e) => { if (e.target.value) E.gabDim[clave] = e.target.value; else delete E.gabDim[clave]; BMS.touch(); BMS.rerender(); } },
              h('option', { value: '' }, 'Auto: ' + sug), ...BMS.calc.PANELES.map((x) => h('option', { value: x[0] }, x[0]))),
              h('div', { class: 'mute', style: { fontSize: '11px', marginTop: '2px', maxWidth: '170px' } }, BMS.calc.panelModelo(E.gabDim[clave] || sug).replace('Schneider ', '')));
          })()),
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
      h('p', { class: 'hint' }, 'El consecutivo se cuenta por nivel y por tipo (CS-N2-01, CS-N2-02…). El modelo de cada controlador se escoge en la pestaña 5. Gabinete: los controladores que estén en el mismo cuarto y compartan nombre de gabinete se dibujan dentro de un mismo panel (recuadro punteado); el gabinete es automático (mismo nivel y mismo cuarto) y la caja se escoge sola según el hardware, entre las cajas plásticas Schneider Thalassa con tapa transparente (PLA hasta 50 x 40 cm, PLM en poliéster desde 70 x 50 cm; referencia exacta por confirmar con el catálogo). Puede cambiar la caja en el selector.'),
      h('datalist', { id: 'dims' }, BMS.calc.PANELES.map((x) => h('option', { value: x[0] }))),
      h('datalist', { id: 'gabs' }, [...new Set(E.controladores.map((c) => BMS.calc.gabDe(c)).filter(Boolean))].map((g) => h('option', { value: g }))),
      h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Tipo', 'Nivel', 'Consec.', 'Nombre', 'Cuarto / ubicación', 'Gabinete', 'Panel (dimensión)', 'Observación', ''].map((x) => h('th', null, x)))), cuerpoC)),
      h('div', { class: 'fila' },
        h('button', { class: 'b p', onclick: () => agregar('CS') }, '+ Controlador secundario (CS)'),
        h('button', { class: 'b', onclick: () => agregar('CP') }, '+ Controlador principal (CP)'),
        h('button', { class: 'b', onclick: () => {
          let n = 0;
          E.niveles.forEach((nv) => { if (!E.controladores.some((c) => c.nivel === nv.id)) { E.controladores.push({ id: uid(), tipo: 'CS', nivel: nv.id, consec: 1, ubicacion: '', obs: '', modo: 'auto' }); n++; } });
          if (!n) alert('Todos los niveles ya tienen controlador.'); else { BMS.touch(); BMS.rerender(); }
        } }, 'Crear 1 CS en cada nivel sin controlador'),
        h('button', { class: 'b', title: 'Asigna un mismo gabinete a los controladores del mismo nivel que tengan el mismo cuarto', onclick: () => {
          const grupos = {}; E.controladores.forEach((c) => { const k = c.nivel + '|' + String(c.ubicacion || '').trim().toLowerCase(); if (String(c.ubicacion || '').trim()) (grupos[k] = grupos[k] || []).push(c); });
          let n = 0;
          Object.values(grupos).filter((l) => l.length > 1).forEach((l) => { const niv = BMS.calc.nivelDe(l[0].nivel); let q = 1; while (E.controladores.some((c) => c.gab === 'GAB-' + (niv ? niv.codigo : '') + '-' + String(q).padStart(2, '0'))) q++; const nombre = 'GAB-' + (niv ? niv.codigo : '') + '-' + String(q).padStart(2, '0'); l.forEach((c) => (c.gab = nombre)); n++; });
          if (!n) alert('No hay controladores del mismo nivel con el mismo "Cuarto / ubicación". Escriba el cuarto en cada controlador y vuelva a intentar.'); else { BMS.touch(); BMS.rerender(); }
        } }, 'Agrupar en gabinete los del mismo cuarto'))));

    root.append(h('div', { class: 'fila noprint' },
      h('button', { class: 'b', onclick: () => { if (confirm('¿Cargar el ejemplo Fairfield Guayabos? Reemplaza el proyecto actual.')) { BMS.estado = BMS.proyectoEjemplo(); BMS.ui.nivelSel = null; BMS.touch(); BMS.rerender(); } } }, 'Cargar ejemplo Fairfield Guayabos'),
      h('button', { class: 'b', onclick: () => { if (confirm('¿Empezar un proyecto en blanco? Se pierde el proyecto actual (el catálogo se conserva).')) { BMS.estado = BMS.proyectoNuevo(); BMS.ui.nivelSel = null; BMS.touch(); BMS.rerender(); } } }, 'Proyecto nuevo en blanco'),
      h('button', { class: 'b p', onclick: () => BMS.ir('diagrama') }, 'Siguiente: diagrama →')));
  };
})();
