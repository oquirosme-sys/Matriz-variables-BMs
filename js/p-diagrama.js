/* Página 2: diagrama de la red de controladores por nivel (SVG generado desde el proyecto). */
(function () {
  const { h, cut } = BMS;
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, a, txt) => {
    const e = document.createElementNS(NS, tag);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    if (txt != null) e.textContent = txt;
    return e;
  };

  function construir() {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc;
    const res = C.todo();
    const mot = C.motor(res, P.marca);
    const det = {}; mot.detalle.forEach((d) => (det[d.c.id] = d));
    const W = 1120, xSpine = 205, x0 = 232, bw = 268, bh = 96, gx = 14, gy = 12, porFila = 3;
    const niveles = [...E.niveles].reverse(); // el más alto arriba
    let y = 96;
    const filas = niveles.map((n) => {
      const cs = E.controladores.filter((c) => c.nivel === n.id).sort((a, b) => (a.tipo === 'CP' ? -1 : 1) - (b.tipo === 'CP' ? -1 : 1) || a.consec - b.consec);
      const nf = Math.max(1, Math.ceil(cs.length / porFila));
      const hh = nf * (bh + gy) + 6;
      const r = { n, cs, y, h: hh }; y += hh + 8; return r;
    });
    const H = y + 36;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, xmlns: NS, role: 'img', 'aria-label': 'Diagrama de controladores por nivel', 'font-family': 'Segoe UI, Arial, sans-serif' });
    svg.append(s('rect', { width: W, height: H, fill: '#ffffff' }));

    /* Cabecera: servidor y red troncal */
    svg.append(s('rect', { x: 20, y: 14, width: W - 40, height: 54, rx: 8, fill: '#2b2f36' }));
    svg.append(s('text', { x: 36, y: 38, fill: '#fff', 'font-size': 16, 'font-weight': 700 }, cut(P.nombre || 'Proyecto BMS', 60)));
    svg.append(s('text', { x: 36, y: 58, fill: '#cbd5e1', 'font-size': 12 }, 'Servidor BMS / ' + (mot.motor ? 'motor de red ' + mot.motor.cod : 'motor de red por definir') + ' · red troncal BACnet/IP · marca ' + P.marca));
    const gws = [...res.gwTodos].sort();
    gws.forEach((g, i) => {
      svg.append(s('rect', { x: W - 36 - (gws.length - i) * 86, y: 24, width: 78, height: 34, rx: 6, fill: '#dbeafe' }));
      svg.append(s('text', { x: W - 36 - (gws.length - i) * 86 + 39, y: 45, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600, fill: '#0b3d91' }, g));
    });
    svg.append(s('line', { x1: xSpine, y1: 68, x2: xSpine, y2: Math.max(110, y - 8), stroke: '#0b6bcb', 'stroke-width': 4 }));
    svg.append(s('text', { x: xSpine + 8, y: 86, 'font-size': 11, fill: '#0b6bcb', 'font-weight': 600 }, 'Red troncal'));

    if (!niveles.length) svg.append(s('text', { x: 40, y: 130, 'font-size': 14, fill: '#667085' }, 'Agregue niveles y controladores en la pestaña 1 para ver el diagrama.'));

    filas.forEach((f, i) => {
      const tl = res.porNivel[f.n.id] || C.vacio();
      svg.append(s('rect', { x: 14, y: f.y - 2, width: W - 28, height: f.h, rx: 6, fill: i % 2 ? '#f8fafc' : '#f1f5f9' }));
      svg.append(s('rect', { x: 20, y: f.y + 4, width: 150, height: Math.min(f.h - 12, 78), rx: 6, fill: '#e2e8f0', stroke: '#94a3b8' }));
      svg.append(s('text', { x: 30, y: f.y + 28, 'font-size': 20, 'font-weight': 700, fill: '#1d2733' }, f.n.codigo));
      svg.append(s('text', { x: 30, y: f.y + 46, 'font-size': 12, fill: '#475569' }, cut(f.n.nombre, 20)));
      svg.append(s('text', { x: 30, y: f.y + 64, 'font-size': 11, fill: '#475569' }, tl.filas + ' equipos · ' + C.cable(tl) + ' pts'));
      if (!f.cs.length) {
        svg.append(s('rect', { x: x0, y: f.y + 4, width: bw, height: 48, rx: 6, fill: 'none', stroke: tl.filas ? '#b42318' : '#94a3b8', 'stroke-dasharray': '5 4' }));
        svg.append(s('text', { x: x0 + 12, y: f.y + 33, 'font-size': 12, fill: tl.filas ? '#b42318' : '#64748b' }, tl.filas ? 'Sin controlador: ' + tl.filas + ' equipos sin asignar' : 'Sin controlador en este nivel'));
        return;
      }
      f.cs.forEach((c, k) => {
        const col = k % porFila, fila = Math.floor(k / porFila);
        const x = x0 + col * (bw + gx), yy = f.y + 4 + fila * (bh + gy);
        const d = det[c.id], t = d.t, esCP = c.tipo === 'CP';
        svg.append(s('line', { x1: xSpine, y1: yy + bh / 2, x2: x, y2: yy + bh / 2, stroke: '#0b6bcb', 'stroke-width': 2 }));
        svg.append(s('circle', { cx: xSpine, cy: yy + bh / 2, r: 4, fill: '#0b6bcb' }));
        svg.append(s('rect', { x, y: yy, width: bw, height: bh, rx: 8, fill: esCP ? '#0b3d91' : '#e8f0fb', stroke: esCP ? '#0b3d91' : '#7aa2dc', 'stroke-width': 1.5 }));
        const tx = esCP ? '#fff' : '#1d2733', tm = esCP ? '#dbeafe' : '#475569';
        svg.append(s('text', { x: x + 10, y: yy + 20, 'font-size': 14, 'font-weight': 700, fill: tx }, BMS.calc.nombreCtrl(c)));
        svg.append(s('text', { x: x + bw - 10, y: yy + 20, 'text-anchor': 'end', 'font-size': 11, fill: tm }, esCP ? 'Principal' : 'Secundario'));
        svg.append(s('text', { x: x + 10, y: yy + 38, 'font-size': 11.5, fill: tm }, cut(c.ubicacion || '', 40) || ' '));
        svg.append(s('text', { x: x + 10, y: yy + 55, 'font-size': 12, fill: tx }, `AI ${t.ai} · AO ${t.ao} · DI ${t.di} · DO ${t.do}` + (t.int ? ` · INT ${t.int}` : '')));
        const eq = res.filas.filter((q) => q.ctrlId === c.id).length;
        const mod = d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base + Object.keys(d.cfg.modulos || {}).map((k) => ' + ' + d.cfg.modulos[k] + '×' + k).join('') : 'sin hardware';
        svg.append(s('text', { x: x + 10, y: yy + 72, 'font-size': 11, fill: tm }, cut(eq + ' equipos · ' + mod, 46)));
        const gl = [...res.gwCtrl[c.id]].sort().join(' · ');
        if (gl) svg.append(s('text', { x: x + 10, y: yy + 88, 'font-size': 10.5, fill: esCP ? '#93c5fd' : '#0b6bcb', 'font-weight': 600 }, cut('Integra: ' + gl, 46)));
        if (d.ev.falta) svg.append(s('circle', { cx: x + bw - 14, cy: yy + bh - 14, r: 7, fill: '#b42318' }));
      });
    });
    if (res.sin.filas) svg.append(s('text', { x: 20, y: H - 14, 'font-size': 12, fill: '#b42318', 'font-weight': 600 }, '⚠ ' + res.sin.filas + ' filas de equipos sin controlador (' + C.cable(res.sin) + ' puntos). Agregue controladores en el nivel correspondiente.'));
    return svg;
  }

  BMS.pDiagrama = (root) => {
    root.append(h('h2', null, 'Diagrama de controladores'),
      h('p', { class: 'hint' }, 'Se dibuja solo a partir de los niveles, controladores y equipos. Los puntos rojos marcan controladores cuya selección no cubre los puntos requeridos.'),
      h('div', { class: 'fila noprint' },
        h('button', { class: 'b', onclick: () => { const x = new XMLSerializer().serializeToString(document.querySelector('.diag svg')); BMS.descargar('diagrama-bms.svg', x, 'image/svg+xml'); } }, 'Descargar SVG'),
        h('button', { class: 'b', onclick: () => window.print() }, 'Imprimir / PDF'),
        h('button', { class: 'b p', onclick: () => BMS.ir('equipos') }, 'Siguiente: equipos por nivel →')),
      h('div', { class: 'diag' }, construir()));
  };
})();
