/* Exporta el diagrama (SVG) a DXF (AutoCAD R12, el más compatible).
   Unidades: milímetros (la lámina es de 36 in de ancho = 2592 px a 72 px/in = 914.4 mm). Eje Y invertido respecto al SVG.
   Texto: estilo CENTURY con la tipografía Century Gothic (GOTHIC.TTF). Las líneas no atraviesan el interior de los círculos de clave (A, B, C…), para que la letra se lea al imprimir.
   Capas: una por clave de cableado (A, B, C, D), marco, dibujo, texto, texto secundario y alertas. */
(function () {
  const PX = 72, MM = 25.4 / PX;
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
    const f = (v) => Math.round(v * 10000) / 10000;
    const X = (x, dx) => f((x + dx) * MM), Y = (y, dy) => f((H - (y + dy)) * MM);
    /* círculos de clave (relleno blanco): las líneas se cortan en su interior */
    const claves = [];
    (function recolecta(nodo, dx, dy) {
      for (const e of nodo.children) {
        const tag = e.tagName.toLowerCase();
        if (tag === 'g') { const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(e.getAttribute('transform') || ''); recolecta(e, dx + (m ? num(m[1]) : 0), dy + (m ? num(m[2]) : 0)); }
        else if (tag === 'circle' && (e.getAttribute('fill') || '').toLowerCase() === '#fff') claves.push([X(num(e.getAttribute('cx')), dx), Y(num(e.getAttribute('cy')), dy), num(e.getAttribute('r')) * MM]);
      }
    })(svg, 0, 0);
    /* tramos de un segmento que quedan fuera de los círculos de clave */
    const fuera = (x1, y1, x2, y2) => {
      const dxs = x2 - x1, dys = y2 - y1, a = dxs * dxs + dys * dys, cortes = [];
      if (a > 0) claves.forEach(([cx, cy, r]) => {
        const fx = x1 - cx, fy = y1 - cy, b = 2 * (fx * dxs + fy * dys), cc = fx * fx + fy * fy - r * r, d = b * b - 4 * a * cc;
        if (d <= 0) return;
        const q = Math.sqrt(d), t0 = (-b - q) / (2 * a), t1 = (-b + q) / (2 * a);
        if (t1 > 0 && t0 < 1) cortes.push([Math.max(0, t0), Math.min(1, t1)]);
      });
      cortes.sort((u, v) => u[0] - v[0]);
      const tr = []; let t = 0;
      cortes.forEach(([u, v]) => { if (u > t + 1e-6) tr.push([t, u]); t = Math.max(t, v); });
      if (t < 1 - 1e-6) tr.push([t, 1]);
      return tr.map(([u, v]) => [f(x1 + dxs * u), f(y1 + dys * u), f(x1 + dxs * v), f(y1 + dys * v)]);
    };
    const dashed = (e) => !!e.getAttribute('stroke-dasharray');

    const poly = (pts, cerrado, capa, ancho, punteada) => {
      if (pts.length < 2) return;
      g(0, 'POLYLINE'); g(8, capa); if (punteada) g(6, 'DASHED'); g(66, 1); g(70, cerrado ? 1 : 0);
      g(10, 0); g(20, 0); g(30, 0);
      if (ancho) { g(40, f(ancho)); g(41, f(ancho)); }
      pts.forEach(([x, y]) => { g(0, 'VERTEX'); g(8, capa); g(10, x); g(20, y); g(30, 0); });
      g(0, 'SEQEND'); g(8, capa);
    };
    const linea = (X1, Y1, X2, Y2, capa, ancho, punteada) => {
      fuera(X1, Y1, X2, Y2).forEach(([x1, y1, x2, y2]) => lineaSimple(x1, y1, x2, y2, capa, ancho, punteada));
    };
    const lineaSimple = (x1, y1, x2, y2, capa, ancho, punteada) => {
      if (ancho >= 1.6) { poly([[x1, y1], [x2, y2]], false, capa, ancho * MM * 0.5, punteada); return; }
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
          g(0, 'CIRCLE'); g(8, capa); g(10, X(num(e.getAttribute('cx')), dx)); g(20, Y(num(e.getAttribute('cy')), dy)); g(30, 0); g(40, f(num(e.getAttribute('r')) * MM));
        } else if (tag === 'ellipse') {
          const cx = num(e.getAttribute('cx')), cy = num(e.getAttribute('cy')), rx = num(e.getAttribute('rx')), ry = num(e.getAttribute('ry')), pts = [];
          for (let i = 0; i < 32; i++) { const a = i / 32 * 2 * Math.PI; pts.push([X(cx + rx * Math.cos(a), dx), Y(cy + ry * Math.sin(a), dy)]); }
          poly(pts, true, capaTrazo(e), 0, false);
        } else if (tag === 'path') {
          const pts = ruta(e.getAttribute('d') || '', dx, dy);
          poly(pts.pts, pts.cerrado, capaTrazo(e), num(e.getAttribute('stroke-width')) >= 1.6 ? num(e.getAttribute('stroke-width')) * MM * 0.5 : 0, dashed(e));
        } else if (tag === 'text') {
          const t = e.textContent; if (!t) continue;
          const size = num(e.getAttribute('font-size')) || 9, ancla = e.getAttribute('text-anchor') === 'middle' ? 1 : e.getAttribute('text-anchor') === 'end' ? 2 : 0;
          const px = X(num(e.getAttribute('x')), dx), py = Y(num(e.getAttribute('y')), dy);
          const sec = ['#555', '#555555'].includes((e.getAttribute('fill') || '').toLowerCase());
          const alerta = (e.getAttribute('fill') || '').toLowerCase() === '#c00';
          g(0, 'TEXT'); g(8, alerta ? 'BMS-ALERTA' : sec ? 'BMS-TEXTO-SEC' : 'BMS-TEXTO');
          g(10, px); g(20, py); g(30, 0); g(40, f(size * 0.72 * MM)); g(1, esc(t)); g(41, 0.8); g(7, 'CENTURY');
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
    c(0, 'SECTION'); c(2, 'HEADER'); c(9, '$ACADVER'); c(1, 'AC1009'); c(9, '$INSUNITS'); c(70, 4); c(9, '$MEASUREMENT'); c(70, 1); c(9, '$LTSCALE'); c(40, 1); c(0, 'ENDSEC');
    c(0, 'SECTION'); c(2, 'TABLES');
    c(0, 'TABLE'); c(2, 'LTYPE'); c(70, 2);
    c(0, 'LTYPE'); c(2, 'CONTINUOUS'); c(70, 0); c(3, 'Solid line'); c(72, 65); c(73, 0); c(40, 0);
    c(0, 'LTYPE'); c(2, 'DASHED'); c(70, 0); c(3, 'Dashed'); c(72, 65); c(73, 2); c(40, 3.81); c(49, 2.54); c(49, -1.27);
    c(0, 'ENDTAB');
    c(0, 'TABLE'); c(2, 'LAYER'); c(70, Object.keys(CAPAS).length);
    Object.entries(CAPAS).forEach(([n, color]) => { c(0, 'LAYER'); c(2, n); c(70, 0); c(62, color); c(6, 'CONTINUOUS'); });
    c(0, 'ENDTAB');
    c(0, 'TABLE'); c(2, 'STYLE'); c(70, 2); c(0, 'STYLE'); c(2, 'STANDARD'); c(70, 0); c(40, 0); c(41, 1); c(50, 0); c(71, 0); c(42, 2.5); c(3, 'txt'); c(4, '');
    c(0, 'STYLE'); c(2, 'CENTURY'); c(70, 0); c(40, 0); c(41, 1); c(50, 0); c(71, 0); c(42, 2.5); c(3, 'GOTHIC.TTF'); c(4, ''); c(0, 'ENDTAB');
    c(0, 'ENDSEC');
    return [...cab, '0', 'SECTION', '2', 'ENTITIES', ...out, '0', 'ENDSEC', '0', 'EOF'].join('\r\n') + '\r\n';
  };
})();
