/* Láminas del diagrama con el cajetín Sinergia de 1100 × 750 mm (plantilla D-01-2 SINERGIA CAJETÍN 1100X750).
   El diagrama se reparte en las láminas necesarias cortando entre lazos; cada lámina lleva el marco, el cajetín (logo, control de revisiones, contenido,
   registro público, lámina y fecha) y su parte del diagrama dentro del área de dibujo (911 × 724 mm).
   Medidas tomadas del bloque del DWG: hoja de 1100 × 750.05 mm; marco interior a 51.81 mm del borde izquierdo y a 13.1 mm del inferior;
   tira del cajetín de 127 mm en el lado derecho. Coordenadas de la lámina en mm, con el origen abajo a la izquierda (como AutoCAD). */
(function () {
  const PX = 72, MM = 25.4 / PX;
  const SW = 1100, SH = 750.05;
  const AREA = { x0: 51.8138, x1: 963.0, y0: 13.1, y1: 737.0 };
  const AW = AREA.x1 - AREA.x0, AH = AREA.y1 - AREA.y0;
  const SEP = 100; /* separación entre láminas en el DXF */
  const T = (x, y) => [x + 70.2656, y - 12.5];

  /* líneas del bloque (coordenadas de la plantilla); w = grosor en mm */
  const LINEAS = [
    [-70.2656, 762.55, -70.2656, 12.5, 0.7], [1029.7344, 762.55, -70.2656, 762.55, 0.7], [1029.7344, 12.5, 1029.7344, 762.55, 0.7], [-70.2656, 12.5, 1029.7344, 12.5, 0.7],
    [1019.7344, 749.5, -18.4518, 749.5], [1019.7344, 25.6, -18.4518, 25.6], [1019.7344, 749.5, 1019.7344, 25.6], [-18.4518, 749.5, -18.4518, 25.6],
    [956.2344, 35.6, 956.2344, 25.6], [1000.4345, 169.4145, 1000.4345, 151.4145], [979.6285, 169.4145, 979.6285, 151.4145], [921.9751, 169.4145, 921.9751, 151.4145],
    [892.7344, 169.4145, 892.7344, 25.6], [892.7344, 169.4145, 892.7344, 749.5],
    [1019.7344, 35.6, 892.7344, 35.6], [1019.7344, 75.9158, 892.7344, 75.9158], [1019.7344, 169.4145, 892.7344, 169.4145], [1019.7344, 163.4145, 892.7344, 163.4145],
    [1019.7344, 157.4145, 892.7344, 157.4145], [1019.7344, 102.5547, 892.7344, 102.5547], [1019.7344, 151.4145, 892.7344, 151.4145]
  ];
  const LOGO = { x: 927.4649, y: 108.8879, w: 57.7, h: 37.2 }; /* esquina inferior izquierda y tamaño, en coordenadas de la plantilla */

  const quita = (s) => String(s || '').replace(/\*\*|==|!!/g, '');
  const parte = (txt, n) => { const w = String(txt).split(/\s+/), out = []; let l = ''; w.forEach((p) => { if ((l + ' ' + p).trim().length > n && l) { out.push(l); l = p; } else l = (l + ' ' + p).trim(); }); if (l) out.push(l); return out; };

  /* primitivas del cajetín de una lámina: líneas y textos (y = borde superior del texto) */
  function cajetin(d) {
    const lineas = LINEAS.map(([x1, y1, x2, y2, w]) => { const a = T(x1, y1), b = T(x2, y2); return { x1: a[0], y1: a[1], x2: b[0], y2: b[1], w: w || 0 }; });
    const textos = [];
    const tx = (x, y, h, t) => { if (!t) return; const p = T(x, y); textos.push({ x: p[0], y: p[1], h, t: String(t).toUpperCase() }); };
    tx(899.1136, 167.9448, 3.0, '# Rev.'); tx(927.4339, 167.9448, 3.0, 'Fecha y Descripción'); tx(985.0803, 167.9448, 3.0, 'Dibujo'); tx(1002.6143, 167.9448, 3.0, 'Aprob.');
    tx(899.1136, 162.2, 2.8, d.rev); tx(927.4339, 162.2, 2.8, [d.fecha, d.desc].filter(Boolean).join('  ')); tx(985.0803, 162.2, 2.8, d.dibujo);
    tx(895.894, 99.4052, 3.0, 'Contenido');
    const ti = parte(d.titulo, 38);
    ti.slice(0, 2).forEach((l, i) => tx(899.5859, 94.2 - i * 4.4, 3.0, l));
    if (d.hoja) tx(899.5859, 94.2 - 2 * 4.4, 3.0, d.hoja);
    tx(895.8175, 72.2345, 3.0, 'Información de registro público:');
    const campo = (y, rot, val) => { tx(895.8175, y, 3.0, rot); if (val) tx(895.8175 + rot.length * 2.3 + 3, y, 3.0, val); };
    campo(61.2004, 'Propietario:', d.propietario); campo(51.6708, 'Plano de catastro:', ''); campo(42.7882, 'Citas folio Real:', '');
    tx(895.894, 31.4918, 3.0, 'Lámina'); tx(918.0, 31.3438, 3.0, d.lamina); tx(959.5, 31.4918, 3.0, d.fecha);
    return { lineas, textos };
  }

  /* reparte el diagrama en láminas: toma la escala más grande que dé el menor número de láminas y corta entre lazos */
  function repartir(svg) {
    const VB = svg.viewBox.baseVal, W = VB.width, H = VB.height;
    const fin = Number(svg.getAttribute('data-fin')) || H;
    const cortes = JSON.parse(svg.getAttribute('data-cortes') || '[]').filter((c) => c > 0 && c < fin);
    const ajuste = AW / (W * MM);
    let mejor = null;
    [1, 0.98, 0.96, 0.94, 0.92, 0.9, 0.88].forEach((k) => {
      const esc = ajuste * k, tope = AH / (MM * esc), partes = [];
      let ini = 0;
      while (fin - ini > 1) {
        let fn;
        if (fin - ini <= tope) fn = fin;
        else { const c = cortes.filter((v) => v > ini + tope * 0.3 && v <= ini + tope); fn = c.length ? Math.max(...c) : ini + tope; }
        partes.push([ini, fn]); ini = fn;
      }
      if (!mejor || partes.length < mejor.partes.length) mejor = { esc, partes };
    });
    return mejor;
  }

  const rotuloLamina = (base, i) => { const m = /^(.*?)(\d+)$/.exec(String(base || 'BMS-01')); return m ? m[1] + String(Number(m[2]) + i).padStart(m[2].length, '0') : (base || 'BMS') + '-' + (i + 1); };
  function datosLamina(i, n) {
    const E = BMS.estado || {}, P = E.proyecto || {}, D = E.diagrama || {};
    const r = { lamina: rotuloLamina(D.lamina, i), titulo: 'Diagrama unifilar del sistema de monitoreo y control (BMS)', hoja: n > 1 ? 'Hoja ' + (i + 1) + ' de ' + n : '', rev: 'A', fecha: P.fecha || '', desc: 'Emisión para revisión', dibujo: 'SI', propietario: quita(P.propietario) };
    /* otras herramientas: BMS.cajetinDatos = (i, n, datos) => ({ lamina, titulo, hoja, rev, fecha, desc, dibujo, propietario }) para cambiar cualquier campo */
    return typeof BMS.cajetinDatos === 'function' ? Object.assign(r, BMS.cajetinDatos(i, n, r)) : r;
  }

  /* ---------- DXF ---------- */
  BMS.dxfLaminas = (svg) => {
    const { esc, partes } = repartir(svg), out = [];
    const g = (c, v) => out.push(String(c), String(v));
    const f = (v) => Math.round(v * 10000) / 10000;
    partes.forEach(([ya, yb], i) => {
      const ox = i * (SW + SEP), d = datosLamina(i, partes.length), c = cajetin(d);
      c.lineas.forEach((l) => {
        if (l.w) { g(0, 'POLYLINE'); g(8, 'BMS-CAJETIN'); g(66, 1); g(70, 0); g(10, 0); g(20, 0); g(30, 0); g(40, l.w); g(41, l.w); [[l.x1, l.y1], [l.x2, l.y2]].forEach(([x, y]) => { g(0, 'VERTEX'); g(8, 'BMS-CAJETIN'); g(10, f(ox + x)); g(20, f(y)); g(30, 0); }); g(0, 'SEQEND'); g(8, 'BMS-CAJETIN'); }
        else { g(0, 'LINE'); g(8, 'BMS-CAJETIN'); g(10, f(ox + l.x1)); g(20, f(l.y1)); g(30, 0); g(11, f(ox + l.x2)); g(21, f(l.y2)); g(31, 0); }
      });
      const txt = (x, y, h, t) => { g(0, 'TEXT'); g(8, 'BMS-CAJETIN-TEXTO'); g(10, f(x)); g(20, f(y)); g(30, 0); g(40, h); g(1, BMS.dxfTexto(t)); g(41, 0.95); g(7, 'CENTURY'); };
      c.textos.forEach((t) => txt(ox + t.x, t.y - t.h, t.h, t.t));
      const lg = T(LOGO.x, LOGO.y); /* el logo es una imagen; en el DXF se rotula con texto */
      txt(ox + lg[0] + 2, lg[1] + 22, 9, 'SINERGIA'); txt(ox + lg[0] + 2, lg[1] + 10, 9, 'INGENIERÍA');
      out.push(...BMS.svgADxf(svg.cloneNode(true), { entidades: true, banda: [ya, yb], esc, ox: ox + AREA.x0, oy: AREA.y1 }));
    });
    return BMS.dxfArmar(out);
  };

  /* ---------- PDF ---------- */
  let logoPng = null;
  async function logo() {
    if (logoPng !== null) return logoPng;
    try { const z = await JSZip.loadAsync(window.BMS_DOCX_BASE, { base64: true }); logoPng = 'data:image/png;base64,' + await z.file('word/media/image2.png').async('base64'); } catch (e) { logoPng = ''; }
    return logoPng;
  }
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a, hijos) => { const e = document.createElementNS(NS, n); Object.entries(a || {}).forEach(([k, v]) => e.setAttribute(k, v)); (hijos || []).forEach((h) => e.append(h)); return e; };
  async function laminasSvg(svg) {
    const { esc, partes } = repartir(svg), VB = svg.viewBox.baseVal, W = VB.width, png = await logo();
    return partes.map(([ya, yb], i) => {
      const d = datosLamina(i, partes.length), c = cajetin(d), Y = (y) => SH - y;
      const hoja = el('svg', { xmlns: NS, viewBox: '0 0 ' + SW + ' ' + SH, width: SW + 'mm', height: SH + 'mm', 'font-family': 'Century Gothic, Montserrat, Arial, sans-serif' });
      hoja.append(el('rect', { width: SW, height: SH, fill: '#fff' }));
      const dib = svg.cloneNode(true); dib.removeAttribute('style'); dib.removeAttribute('width'); dib.removeAttribute('height');
      Object.entries({ x: AREA.x0, y: Y(AREA.y1), width: W * MM * esc, height: (yb - ya) * MM * esc, viewBox: '0 ' + ya + ' ' + W + ' ' + (yb - ya), preserveAspectRatio: 'xMinYMin meet', overflow: 'hidden' }).forEach(([k, v]) => dib.setAttribute(k, v));
      hoja.append(dib);
      c.lineas.forEach((l) => hoja.append(el('line', { x1: l.x1, y1: Y(l.y1), x2: l.x2, y2: Y(l.y2), stroke: '#000', 'stroke-width': l.w || 0.25 })));
      c.textos.forEach((t) => { const e = el('text', { x: t.x, y: Y(t.y - t.h), 'font-size': t.h / 0.72, fill: '#000' }); e.textContent = t.t; hoja.append(e); });
      const lg = T(LOGO.x, LOGO.y);
      if (png) hoja.append(el('image', { href: png, x: lg[0], y: Y(lg[1] + LOGO.h), width: LOGO.w, height: LOGO.h, preserveAspectRatio: 'xMidYMid meet' }));
      return hoja;
    });
  }
  BMS.pdfLaminas = async (svg, titulo) => {
    const hojas = await laminasSvg(svg);
    const doc = document.createElement('div'); doc.id = 'pdf-doc'; doc.className = 'pdf-lamina'; doc.style.width = SW + 'mm';
    hojas.forEach((h) => { const w = document.createElement('div'); w.className = 'pdf-lam'; w.style.cssText = 'width:' + SW + 'mm;height:' + (SH - 0.1) + 'mm'; h.style.display = 'block'; w.append(h); doc.append(w); });
    document.body.append(doc);
    const ant = document.title; if (titulo) document.title = titulo;
    const st = document.createElement('style'); st.textContent = '@page { size: ' + SW + 'mm ' + SH + 'mm; margin: 0; }'; document.head.append(st);
    document.body.classList.add('pdf-imprime');
    const fin = () => { document.body.classList.remove('pdf-imprime'); document.title = ant; st.remove(); doc.remove(); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin); setTimeout(() => window.print(), 300);
    return hojas.length;
  };
  BMS.laminasInfo = (svg) => { const r = repartir(svg); return { laminas: r.partes.length, escala: Math.round(r.esc * 1000) / 1000, partes: r.partes }; };
})();
