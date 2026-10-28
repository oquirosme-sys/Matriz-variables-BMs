/* Exporta el diagrama (SVG) a DXF (AutoCAD R12, el más compatible).
   Unidades: pulgadas (la lámina es de 36 in de ancho = 2592 px a 72 px/in). Eje Y invertido respecto al SVG.
   Capas: una por clave de cableado (A, B, C, D), marco, dibujo, texto, texto secundario y alertas. */
(function () {
  const PX = 72;
  const CAPAS = {
    'BMS-A-BACNET-IP': 31, 'BMS-B-BACNET-MSTP': 1, 'BMS-C-MODBUS-RTU': 4, 'BMS-E-MODBUS-TCP': 5, 'BMS-D-SENALES': 6,
    'BMS-MARCO': 8, 'BMS-DIBUJO': 7, 'BMS-TEXTO': 7, 'BMS-TEXTO-SEC': 8, 'BMS-ALERTA': 1
  };
  const POR_COLOR = { '#ff9e7f': 'BMS-A-BACNET-IP', '#ff0000': 'BMS-B-BACNET-MSTP', '#00ffff': 'BMS-C-MODBUS-RTU', '#0a2fa8': 'BMS-E-MODBUS-TCP', '#ff00ff': 'BMS-D-SENALES', '#bbb': 'BMS-MARCO', '#c00': 'BMS-ALERTA' };
  const capaTrazo = (e) => POR_COLOR[(e.getAttribute('stroke') || '').toLowerCase()] || 'BMS-DIBUJO';
  const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
  /* Texto: los caracteres fuera de ASCII se escriben como \U+XXXX para no depender de la página de códigos. */
  const esc = (t) => String(t).replace(/⚠/g, '!').replace(/[^\x20-\x7e]/g, (c) => '\\U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));

  BMS.svgADxf = (svg) => {
    const vb = svg.viewBox.baseVal, H = vb.height;
    const out = [];
    const g = (code, val) => out.push(String(code), String(val));
    const f = (v) => (Math.round(v * 10000) / 10000).toString();
    const X = (x, dx) => f((x + dx) / PX), Y = (y, dy) => f((H - (y + dy)) / PX);
    const dashed = (e) => !!e.getAttribute('stroke-dasharray');

    const poly = (pts, cerrado, capa, ancho, punteada) => {
      if (pts.length < 2) return;
      g(0, 'POLYLINE'); g(8, capa); if (punteada) g(6, 'DASHED'); g(66, 1); g(70, cerrado ? 1 : 0);
      g(10, 0); g(20, 0); g(30, 0);
      if (ancho) { g(40, f(ancho)); g(41, f(ancho)); }
      pts.forEach(([x, y]) => { g(0, 'VERTEX'); g(8, capa); g(10, x); g(20, y); g(30, 0); });
      g(0, 'SEQEND'); g(8, capa);
    };
    const linea = (x1, y1, x2, y2, capa, ancho, punteada) => {
      if (ancho >= 1.6) { poly([[x1, y1], [x2, y2]], false, capa, ancho / PX * 0.5, punteada); return; }
      g(0, 'LINE'); g(8, capa); if (punteada) g(6, 'DASHED'); g(10, x1); g(20, y1); g(30, 0); g(11, x2); g(21, y2); g(31, 0);
    };

    function recorrer(nodo, dx, dy) {
      for (const e of nodo.children) {
        const tag = e.tagName.toLowerCase();
        if (tag === 'g') {
          const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(e.getAttribute('transform') || '');
          recorrer(e, dx + (m ? num(m[1]) : 0), dy + (m ? num(m[2]) : 0));
        } else if (tag === 'line') {
          linea(X(num(e.getAttribute('x1')), dx), Y(num(e.getAttribute('y1')), dy), X(num(e.getAttribute('x2')), dx), Y(num(e.getAttribute('y2')), dy), capaTrazo(e), num(e.getAttribute('stroke-width')), dashed(e));
        } else if (tag === 'rect') {
          const x = num(e.getAttribute('x')), y = num(e.getAttribute('y')), w = num(e.getAttribute('width')), hh = num(e.getAttribute('height'));
          if (!e.getAttribute('stroke') && w >= 2592) continue; /* fondo blanco de la hoja */
          poly([[X(x, dx), Y(y, dy)], [X(x + w, dx), Y(y, dy)], [X(x + w, dx), Y(y + hh, dy)], [X(x, dx), Y(y + hh, dy)]], true, capaTrazo(e), 0, dashed(e));
        } else if (tag === 'circle') {
          const capa = (e.getAttribute('fill') || '').toLowerCase() === '#c00' ? 'BMS-ALERTA' : (e.getAttribute('fill') === '#111' ? 'BMS-DIBUJO' : capaTrazo(e));
          g(0, 'CIRCLE'); g(8, capa); g(10, X(num(e.getAttribute('cx')), dx)); g(20, Y(num(e.getAttribute('cy')), dy)); g(30, 0); g(40, f(num(e.getAttribute('r')) / PX));
        } else if (tag === 'ellipse') {
          const cx = num(e.getAttribute('cx')), cy = num(e.getAttribute('cy')), rx = num(e.getAttribute('rx')), ry = num(e.getAttribute('ry')), pts = [];
          for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI; pts.push([X(cx + rx * Math.cos(a), dx), Y(cy + ry * Math.sin(a), dy)]); }
          poly(pts, true, capaTrazo(e), 0, false);
        } else if (tag === 'path') {
          const pts = ruta(e.getAttribute('d') || '', dx, dy);
          poly(pts.pts, pts.cerrado, capaTrazo(e), num(e.getAttribute('stroke-width')) >= 1.6 ? num(e.getAttribute('stroke-width')) / PX * 0.5 : 0, dashed(e));
        } else if (tag === 'text') {
          const t = e.textContent; if (!t) continue;
          const size = num(e.getAttribute('font-size')) || 9, ancla = e.getAttribute('text-anchor') === 'middle' ? 1 : e.getAttribute('text-anchor') === 'end' ? 2 : 0;
          const px = X(num(e.getAttribute('x')), dx), py = Y(num(e.getAttribute('y')), dy);
          const sec = ['#555', '#555555'].includes((e.getAttribute('fill') || '').toLowerCase());
          const alerta = (e.getAttribute('fill') || '').toLowerCase() === '#c00';
          g(0, 'TEXT'); g(8, alerta ? 'BMS-ALERTA' : sec ? 'BMS-TEXTO-SEC' : 'BMS-TEXTO');
          g(10, px); g(20, py); g(30, 0); g(40, f(size * 0.72 / PX)); g(1, esc(t)); g(41, 0.85); g(7, 'STANDARD');
          if (ancla) { g(72, ancla); g(11, px); g(21, py); g(31, 0); }
        }
      }
    }
    /* Ruta SVG (M, L, H, V absolutos y q relativo) a lista de puntos. */
    function ruta(d, dx, dy) {
      const tok = d.match(/[MLHVQZmlhvqz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
      const pts = []; let i = 0, cmd = '', x = 0, y = 0, cerrado = false;
      const P = (a, b) => pts.push([X(a, dx), Y(b, dy)]);
      while (i < tok.length) {
        if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
        if (cmd === 'Z' || cmd === 'z') { cerrado = true; continue; }
        if (cmd === 'M' || cmd === 'L') { x = num(tok[i++]); y = num(tok[i++]); P(x, y); if (cmd === 'M') cmd = 'L'; }
        else if (cmd === 'H') { x = num(tok[i++]); P(x, y); }
        else if (cmd === 'V') { y = num(tok[i++]); P(x, y); }
        else if (cmd === 'q') {
          const c1 = [x + num(tok[i]), y + num(tok[i + 1])], p2 = [x + num(tok[i + 2]), y + num(tok[i + 3])]; i += 4;
          for (let k = 1; k <= 8; k++) { const u = k / 8; P((1 - u) * (1 - u) * x + 2 * (1 - u) * u * c1[0] + u * u * p2[0], (1 - u) * (1 - u) * y + 2 * (1 - u) * u * c1[1] + u * u * p2[1]); }
          x = p2[0]; y = p2[1];
        } else i++;
      }
      return { pts, cerrado };
    }
    recorrer(svg, 0, 0);

    /* Archivo: HEADER, TABLES (tipos de línea, capas, estilo), ENTITIES */
    const cab = [];
    const c = (code, val) => cab.push(String(code), String(val));
    c(0, 'SECTION'); c(2, 'HEADER'); c(9, '$ACADVER'); c(1, 'AC1009'); c(9, '$LTSCALE'); c(40, 1); c(0, 'ENDSEC');
    c(0, 'SECTION'); c(2, 'TABLES');
    c(0, 'TABLE'); c(2, 'LTYPE'); c(70, 2);
    c(0, 'LTYPE'); c(2, 'CONTINUOUS'); c(70, 0); c(3, 'Solid line'); c(72, 65); c(73, 0); c(40, 0);
    c(0, 'LTYPE'); c(2, 'DASHED'); c(70, 0); c(3, 'Dashed'); c(72, 65); c(73, 2); c(40, 0.15); c(49, 0.1); c(49, -0.05);
    c(0, 'ENDTAB');
    c(0, 'TABLE'); c(2, 'LAYER'); c(70, Object.keys(CAPAS).length);
    Object.entries(CAPAS).forEach(([n, color]) => { c(0, 'LAYER'); c(2, n); c(70, 0); c(62, color); c(6, 'CONTINUOUS'); });
    c(0, 'ENDTAB');
    c(0, 'TABLE'); c(2, 'STYLE'); c(70, 1); c(0, 'STYLE'); c(2, 'STANDARD'); c(70, 0); c(40, 0); c(41, 1); c(50, 0); c(71, 0); c(42, 0.2); c(3, 'txt'); c(4, ''); c(0, 'ENDTAB');
    c(0, 'ENDSEC');
    return [...cab, '0', 'SECTION', '2', 'ENTITIES', ...out, '0', 'ENDSEC', '0', 'EOF'].join('\r\n') + '\r\n';
  };
})();
