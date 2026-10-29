/* Página 3: equipos por nivel. Al escoger un equipo del catálogo se carga su lista de variables. */
(function () {
  const { h, uid, num } = BMS;
  BMS.ui.abiertos = new Set();

  const etiquetaTag = (tipo) => {
    if (!tipo.tag) return '';
    if (!/-$/.test(tipo.tag)) return tipo.tag;
    const n = BMS.estado.equipos.filter((q) => q.tipoId === tipo.id).length + 1;
    return tipo.tag + n;
  };

  /* Campo con sugerencias predictivas: escribe y elige entre los equipos del catálogo que se parezcan.
     La lista es flotante (position: fixed) para que no la recorte la tabla con desplazamiento. */
  const combo = (texto, placeholder, onPick, ancho) => {
    const inp = h('input', { class: 'in', style: { width: '100%', minWidth: ancho || '260px' }, placeholder, autocomplete: 'off', value: texto || '', 'aria-label': placeholder });
    const sug = h('div', { class: 'sug' }); let items = [], idx = 0, tocado = false;
    const catNom = (id) => { const c = BMS.catEq.categorias.find((x) => x.id === id); return c ? c.nombre : ''; };
    const marca = () => [...sug.children].forEach((d, i) => d.classList.toggle('on', i === idx));
    const cierra = () => { sug.style.display = 'none'; };
    const pinta = () => {
      items = BMS.buscarTipos(tocado ? inp.value : '', 10); idx = 0;
      sug.replaceChildren(...(items.length ? items.map((t) => h('div', { class: 'it', onmousedown: (ev) => { ev.preventDefault(); cierra(); onPick(t); } }, h('b', null, t.nombre), h('span', { class: 'mute' }, ' · ' + catNom(t.cat) + (t.tag ? ' · ' + t.tag.replace(/-$/, '') : '')))) : [h('div', { class: 'it mute' }, 'Sin coincidencias; revise la ortografía o agréguelo en el catálogo de variables')]));
      const r = inp.getBoundingClientRect();
      Object.assign(sug.style, { display: 'block', left: r.left + 'px', top: r.bottom + 2 + 'px', width: Math.max(r.width, 380) + 'px' });
      marca();
    };
    inp.addEventListener('input', () => { tocado = true; pinta(); });
    inp.addEventListener('focus', () => { tocado = false; inp.select(); pinta(); });
    inp.addEventListener('blur', () => setTimeout(() => { cierra(); inp.value = texto || ''; }, 120));
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { idx = Math.min(items.length - 1, idx + 1); marca(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { idx = Math.max(0, idx - 1); marca(); ev.preventDefault(); }
      else if (ev.key === 'Enter' && items[idx]) { ev.preventDefault(); cierra(); onPick(items[idx]); }
      else if (ev.key === 'Escape') inp.blur();
    });
    window.addEventListener('scroll', cierra, true);
    return h('div', { class: 'combo', style: { maxWidth: 'none', minWidth: '0' } }, inp, sug);
  };

  BMS.pEquipos = (root) => {
    const E = BMS.estado, C = BMS.calc;
    root.append(h('h2', null, 'Equipos por nivel'),
      h('p', { class: 'hint' }, 'Escoja el nivel, agregue equipos del catálogo e indique la cantidad. La lista de variables sale del catálogo (pestaña "Catálogo de variables"). El controlador se asigna solo entre los del nivel; puede cambiarlo en cada fila.'));
    if (!E.niveles.length) { root.append(h('div', { class: 'warnbox' }, 'Defina los niveles y controladores en la pestaña 1 antes de cargar equipos.')); return; }
    if (!E.niveles.find((n) => n.id === BMS.ui.nivelSel)) BMS.ui.nivelSel = E.niveles[0].id;
    const nivel = E.niveles.find((n) => n.id === BMS.ui.nivelSel);

    const celdas = {}, pcel = {}, resumenEl = h('div', { class: 'kpis' });
    const lista = h('div', { class: 'lista' });
    const pintaLista = (res) => {
      lista.replaceChildren(h('div', { class: 'grp' }, 'Niveles'));
      [...E.niveles].reverse().forEach((n) => {
        const t = res.porNivel[n.id];
        lista.append(h('div', { class: 'it' + (n.id === nivel.id ? ' on' : ''), onclick: () => { BMS.ui.nivelSel = n.id; BMS.rerender(); } },
          h('span', null, n.codigo + ' · ' + n.nombre), h('span', { class: 'badge' }, t.filas ? C.cable(t) + t.int + ' pts' : '—')));
      });
    };

    const cuerpo = h('tbody');
    const filasNivel = () => E.equipos.filter((q) => q.nivel === nivel.id);

    const opcCtrl = (res, f) => {
      const o = [h('option', { value: 'auto' }, 'Automático')];
      const lv = (c) => (c.nivel === nivel.id ? 0 : 1);
      [...E.controladores].sort((a, b) => lv(a) - lv(b)).forEach((c) => o.push(h('option', { value: c.id }, C.nombreCtrl(c) + (c.nivel === nivel.id ? '' : ' (otro nivel)'))));
      return o;
    };

    const pintaFilas = () => {
      cuerpo.replaceChildren();
      const res = C.todo();
      filasNivel().forEach((eq) => {
        const f = res.filas.find((x) => x.eq === eq);
        const tipo = f.tipo;
        const abierto = BMS.ui.abiertos.has(eq.id);
        const c = (k) => { const e = h('td', { class: 'r calc' }); (celdas[eq.id] = celdas[eq.id] || {})[k] = e; return e; };
        const selTipo = combo(tipo ? tipo.nombre : '(tipo eliminado del catálogo)', 'Escriba para cambiar el equipo…', (t) => {
          eq.tipoId = t.id; eq.excl = []; eq.tag = etiquetaTag(t); BMS.touch(); BMS.rerender();
        }, '300px');
        const OPC_COM = [['D', 'Cableado (D)'], ['A', 'BACnet/IP (A)'], ['B', 'BACnet MS/TP (B)'], ['E', 'Modbus TCP/IP (E)'], ['C', 'Modbus RTU (C)']];
        const ipCell = h('td', null, h('select', { class: 'in', style: { minWidth: '128px' }, disabled: !tipo, value: C.comDe(eq, tipo), title: 'Cómo llega el equipo al BMS. Cableado: señales al controlador. Las demás opciones son equipos o paneles de red: sus señales son internas y cuentan como INT; en el diagrama se dibujan sobre la red o troncal correspondiente.', onchange: (ev) => { eq.com = ev.target.value; delete eq.ip; BMS.touch(); BMS.rerender(); } }, OPC_COM.map(([v, t]) => h('option', { value: v }, t))));
        const ctlCell = h('td', null);
        const ctlName = h('span', { class: 'mute', style: { marginLeft: '6px', fontSize: '12px' } });
        (celdas[eq.id] = celdas[eq.id] || {}).ctl = ctlName;
        ctlCell.append(h('select', { class: 'in', value: eq.ctrl || 'auto', onchange: (e) => { eq.ctrl = e.target.value; BMS.touch(); actualizar(); } }, opcCtrl(res, f)), ctlName);
        cuerpo.append(h('tr', null,
          h('td', { class: 'c' }, h('button', { class: 'b s', title: 'Ver variables', onclick: () => { abierto ? BMS.ui.abiertos.delete(eq.id) : BMS.ui.abiertos.add(eq.id); BMS.rerender(); } }, abierto ? '▾' : '▸')),
          h('td', null, selTipo),
          h('td', null, h('input', { class: 'in', style: { width: '120px' }, value: eq.tag || '', placeholder: 'Tag(s)', onchange: (e) => { eq.tag = e.target.value; BMS.touch(); } })),
          h('td', null, h('input', { class: 'in n', type: 'number', min: 0, step: 1, value: eq.qty, onchange: (e) => { eq.qty = Math.max(0, Math.round(num(e.target.value))); e.target.value = eq.qty; BMS.touch(); actualizar(); } })),
          ipCell, ctlCell, c('ai'), c('ao'), c('di'), c('do'), c('int'), c('tot'),
          h('td', null, h('input', { class: 'in', style: { width: '160px' }, value: eq.obs || '', placeholder: 'Observación', onchange: (e) => { eq.obs = e.target.value; BMS.touch(); } })),
          h('td', { class: 'c' }, h('button', { class: 'b x', title: 'Quitar', onclick: () => { E.equipos.splice(E.equipos.indexOf(eq), 1); BMS.ui.abiertos.delete(eq.id); BMS.touch(); BMS.rerender(); } }, '✕'))));
        if (abierto && tipo) {
          const pc = (pt, k) => { const e = h('td', { class: 'r calc' }); pcel[eq.id + ':' + pt.p.id + ':' + k] = e; return e; };
          cuerpo.append(h('tr', { class: 'det' }, h('td', { colspan: 14 },
            tipo.nota ? h('div', { class: 'mute', style: { padding: '4px 2px', fontSize: '12px' } }, 'Origen: ' + tipo.nota) : null,
            h('table', { class: 't' }, h('thead', null, h('tr', null, ['Incl.', 'Descripción / punto', 'Qty', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total AI', 'Total AO', 'Total DI', 'Total DO', 'Total INT', 'Total puntos', 'Alarma', 'Tendencia', 'Interfaz'].map((x) => h('th', null, x)))),
              h('tbody', null, f.puntos.map((pt) => h('tr', null,
                h('td', { class: 'c' }, h('input', { type: 'checkbox', checked: pt.incl, onchange: (e) => { eq.excl = eq.excl || []; if (e.target.checked) eq.excl = eq.excl.filter((x) => x !== pt.p.id); else eq.excl.push(pt.p.id); BMS.touch(); actualizar(); } })),
                h('td', { class: 'nm' }, pt.p.n), h('td', { class: 'r' }, eq.qty),
                ['ai', 'ao', 'di', 'do', 'int'].map((k) => h('td', { class: 'r' }, pt.p[k])),
                ['ai', 'ao', 'di', 'do', 'int'].map((k) => pc(pt, k)), pc(pt, 'tot'),
                h('td', { class: 'c' }, pt.p.alm || '—'), h('td', { class: 'c' }, pt.p.tend || '—'), h('td', null, pt.p.ifc))))))));
        }
      });
      if (!filasNivel().length) cuerpo.append(h('tr', null, h('td', { colspan: 14, class: 'mute', style: { padding: '14px' } }, 'Sin equipos en este nivel. Use "Agregar equipo" o copie los de otro nivel.')));
    };

    /* Actualiza solo los números (no reconstruye los campos para no perder el foco). */
    const actualizar = () => {
      const res = C.todo();
      filasNivel().forEach((eq) => {
        const f = res.filas.find((x) => x.eq === eq), ce = celdas[eq.id]; if (!ce) return;
        ['ai', 'ao', 'di', 'do', 'int'].forEach((k) => (ce[k].textContent = f.t[k]));
        ce.tot.textContent = f.t.ai + f.t.ao + f.t.di + f.t.do + f.t.int;
        const c = f.ctrlId ? C.ctrlDe(f.ctrlId) : null;
        ce.ctl.textContent = eq.ctrl && eq.ctrl !== 'auto' ? '' : (c ? '→ ' + C.nombreCtrl(c) : '⚠ sin controlador');
        ce.ctl.style.color = c ? '' : 'var(--bad)';
        f.puntos.forEach((pt) => {
          ['ai', 'ao', 'di', 'do', 'int'].forEach((k) => { const e = pcel[eq.id + ':' + pt.p.id + ':' + k]; if (e) e.textContent = pt.incl ? pt[k] : 0; });
          const e = pcel[eq.id + ':' + pt.p.id + ':tot']; if (e) e.textContent = pt.incl ? pt.ai + pt.ao + pt.di + pt.do + pt.int : 0;
        });
      });
      const t = res.porNivel[nivel.id];
      resumenEl.replaceChildren(...[['Equipos (filas)', t.filas], ['AI', t.ai], ['AO', t.ao], ['DI', t.di], ['DO', t.do], ['INT', t.int], ['Cableados', C.cable(t)], ['Con reserva ' + E.proyecto.reserva + ' %', (() => { const r = C.conReserva(t, E.proyecto.reserva); return C.cable(r); })()]]
        .map(([n, v]) => h('div', { class: 'kpi' }, h('b', null, v), h('span', null, n))));
      pintaLista(res);
    };

    /* Buscador predictivo para agregar equipos */
    const buscador = combo('', 'Escriba para buscar y agregar un equipo (ej. generador, VFD, UPS, chiller, inyector…)', (t) => {
      E.equipos.push({ id: uid(), nivel: nivel.id, tipoId: t.id, qty: 1, tag: etiquetaTag(t), ctrl: 'auto', obs: '', excl: [] }); BMS.touch(); BMS.rerender();
    }, '420px');

    /* Barra de acciones */
    const selAgregar = h('select', { class: 'in', style: { maxWidth: '380px' }, onchange: (e) => {
      const t = C.tipoDe(e.target.value); if (!t) return;
      E.equipos.push({ id: uid(), nivel: nivel.id, tipoId: t.id, qty: 1, tag: etiquetaTag(t), ctrl: 'auto', obs: '', excl: [] });
      BMS.touch(); BMS.rerender();
    } }, h('option', { value: '' }, '…o elija de la lista del catálogo'),
      BMS.catEq.categorias.map((cat) => h('optgroup', { label: cat.nombre }, BMS.catEq.tipos.filter((t) => t.cat === cat.id).map((t) => h('option', { value: t.id }, t.nombre)))));
    const otros = E.niveles.filter((n) => n.id !== nivel.id && E.equipos.some((q) => q.nivel === n.id));
    const selCopiar = h('select', { class: 'in' }, h('option', { value: '' }, 'Copiar equipos de…'), otros.map((n) => h('option', { value: n.id }, n.codigo + ' · ' + n.nombre)));
    const copiar = () => {
      const o = selCopiar.value; if (!o) return;
      if (filasNivel().length && !confirm('Este nivel ya tiene equipos; se agregarán los del otro nivel. ¿Continuar?')) return;
      E.equipos.filter((q) => q.nivel === o).forEach((q) => E.equipos.push({ ...BMS.clone(q), id: uid(), nivel: nivel.id, ctrl: 'auto' }));
      BMS.touch(); BMS.rerender();
    };

    root.append(h('div', { class: 'split' }, lista, h('div', null,
      h('h3', { style: { marginTop: 0 } }, 'Nivel ' + nivel.codigo + ' — ' + nivel.nombre),
      resumenEl,
      h('div', { class: 'fila noprint' }, buscador),
      h('div', { class: 'fila noprint' }, selAgregar, selCopiar, h('button', { class: 'b', onclick: copiar }, 'Copiar')),
      h('div', { class: 'scroll' }, h('table', { class: 't' },
        h('thead', null, h('tr', null, ['', 'Equipo (catálogo)', 'Tag(s)', 'Cant.', 'Comunicación', 'Controlador', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total', 'Observación', ''].map((x) => h('th', null, x)))), cuerpo)),
      h('div', { class: 'fila noprint' }, h('button', { class: 'b p', onclick: () => BMS.ir('resumen') }, 'Siguiente: resumen →')))));
    pintaFilas(); actualizar();
  };
})();
