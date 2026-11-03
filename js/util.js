/* Utilidades generales: creación de DOM, formato y espacio de nombres BMS. */
window.BMS = window.BMS || {};
BMS.ui = { pagina: 'proyecto', nivelSel: null };
(function () {
  const h = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    let valor;
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'value') valor = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') e[k] = true;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (function add(list) {
      for (const c of list) {
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c);
        else e.append(c.nodeType ? c : document.createTextNode(c));
      }
    })(kids);
    if (valor !== undefined) e.value = valor;
    return e;
  };
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const num = (v, def = 0) => { const n = parseFloat(v); return isFinite(n) ? n : def; };
  const pad = (n) => String(n).padStart(2, '0');
  const cut = (s, n) => { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const descargar = (nombre, contenido, tipo) => {
    const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo || 'text/plain' });
    const a = h('a', { href: URL.createObjectURL(blob), download: nombre });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const leerArchivo = (accept, cb) => {
    const i = h('input', { type: 'file', accept });
    i.addEventListener('change', () => {
      const f = i.files[0]; if (!f) return;
      const r = new FileReader(); r.onload = () => cb(r.result, f); r.readAsText(f);
    });
    i.click();
  };
  /* Búsqueda predictiva de equipos del catálogo: sin tildes ni mayúsculas, por nombre, tag, sistema, nota y variables; tolera una letra errada. */
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const dist1 = (a, b) => { if (Math.abs(a.length - b.length) > 1) return false; let i = 0, j = 0, e = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; } else { if (++e > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } } } return e + (a.length - i) + (b.length - j) <= 1; };
  const buscarTipos = (q, max = 12) => {
    const toks = norm(q).split(/\s+/).filter(Boolean), cats = {};
    BMS.catEq.categorias.forEach((c) => (cats[c.id] = norm(c.nombre)));
    if (!toks.length) return BMS.catEq.tipos.slice(0, max);
    const pasada = (difuso) => {
      const res = [];
      for (const t of BMS.catEq.tipos) {
        const nombre = norm(t.nombre), pal = nombre.split(/[^a-z0-9]+/).filter(Boolean), extra = norm([t.tag, t.gw, cats[t.cat], t.nota].join(' ')), pts = norm(t.pts.map((p) => p.n).join(' '));
        let sc = 0, ok = true;
        for (const k of toks) {
          if (nombre.startsWith(k)) sc += 100; else if (pal.some((w) => w.startsWith(k))) sc += 60; else if (nombre.includes(k)) sc += 40; else if (extra.includes(k)) sc += 20; else if (pts.includes(k)) sc += 8;
          else if (difuso && k.length >= 4 && pal.some((w) => dist1(k, w) || dist1(k, w.slice(0, k.length)))) sc += 15; else { ok = false; break; }
        }
        if (ok) res.push({ t, sc });
      }
      return res;
    };
    let r = pasada(false); if (!r.length) r = pasada(true);
    r.sort((a, b) => b.sc - a.sc || a.t.nombre.localeCompare(b.t.nombre));
    return r.slice(0, max).map((x) => x.t);
  };
  /* Imprime a PDF con el membrete Sinergia del Word: logo y datos de la empresa arriba, contacto y «documento · Página N» abajo (cajas de margen de @page; Chrome/Edge recientes).
     El contenido se limita con la clase de <body> (clase): el CSS de impresión de esa clase decide qué se ve. */
  const imprimirSinergia = async ({ nombre, titulo, clase, apaisado }) => {
    const ant = document.title; document.title = titulo || nombre;
    let logo = '';
    try {
      const z = await JSZip.loadAsync(window.BMS_DOCX_BASE, { base64: true });
      const b64 = await z.file('word/media/image2.png').async('base64');
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="215" height="77" viewBox="0 0 215 77"><image width="215" height="77" href="data:image/png;base64,' + b64 + '"/></svg>';
      logo = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29') + '")';
    } catch (e) { /* sin logo */ }
    const cad = (t) => '"' + String(t).replace(/[\\"]/g, (m) => '\\' + m).replace(/\n/g, ' ') + '"';
    const st = document.createElement('style');
    st.textContent = '@page { size: letter' + (apaisado ? ' landscape' : '') + '; margin: 34mm 13.5mm 26mm 13.5mm;' +
      ' @top-left { content: ' + (logo || '""') + '; vertical-align: top; padding-top: 8.5mm; }' +
      ' @top-right { content: "Sinergia Consultoría Mecánica y Eléctrica S.A\\A Oficentro Plaza Roble, Edificio Pórtico, Escazú"; white-space: pre; text-align: right; vertical-align: top; padding: 9mm 16.5mm 0 0; font: 8pt Calibri, Arial, sans-serif; color: #000; }' +
      ' @bottom-left { content: "www.sinergia.co.cr     info@sinergia.co.cr     Tel: 2215-3865"; width: 62%; text-align: left; vertical-align: top; padding: 4mm 0 0 16.5mm; font: 9pt "Yu Gothic UI Semibold", "Yu Gothic UI", Montserrat, Arial, sans-serif; color: #385623; white-space: nowrap; }' +
      ' @bottom-right { content: ' + cad(String(nombre).slice(0, 40) + ' · Página ') + ' counter(page); width: 38%; text-align: right; vertical-align: top; padding: 4.6mm 16.5mm 0 0; font: 8pt Montserrat, Arial, sans-serif; color: #808080; white-space: nowrap; overflow: hidden; } }';
    document.head.append(st);
    document.body.classList.add(clase);
    const fin = () => { document.body.classList.remove(clase); document.title = ant; st.remove(); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin); setTimeout(() => window.print(), 150);
  };
  Object.assign(BMS, { h, uid, num, pad, cut, clone, descargar, leerArchivo, norm, buscarTipos, imprimirSinergia });
})();
