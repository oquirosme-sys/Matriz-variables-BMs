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
  /* PDF con el membrete Sinergia del Word, armado página por página (sin depender de las cajas de margen de @page):
     cada hoja carta lleva el logo y los datos de la empresa arriba y el contacto con «documento · Página N» abajo, y el contenido
     se reparte en ellas midiendo cada bloque: los bloques no se parten, los títulos no quedan solos al final y las tablas
     (div.pdf-tabla) se cortan por filas repitiendo el encabezado. Un div.pdf-salto fuerza hoja nueva. */
  const imprimirPaginado = async ({ nombre, titulo, nodos }) => {
    const ant = document.title; document.title = titulo || nombre;
    let logo = '';
    try {
      const z = await JSZip.loadAsync(window.BMS_DOCX_BASE, { base64: true });
      logo = 'data:image/png;base64,' + await z.file('word/media/image2.png').async('base64');
    } catch (e) { /* sin logo */ }
    /* las imágenes se miden ya cargadas */
    await Promise.all(nodos.flatMap((n) => (n.tagName === 'IMG' ? [n] : [...n.querySelectorAll('img')])).map((i) => (i.decode ? Promise.race([i.decode().catch(() => {}), new Promise((r) => setTimeout(r, 4000))]) : null)));
    const doc = h('div', { id: 'pdf-doc' }); document.body.append(doc);
    let cuerpo = null, n = 0;
    const nueva = () => {
      n++; cuerpo = h('div', { class: 'pdf-cuerpo' });
      doc.append(h('div', { class: 'pdf-pag' },
        logo ? h('img', { class: 'pdf-logo', src: logo }) : null,
        h('div', { class: 'pdf-emp' }, h('div', null, 'Sinergia Consultoría Mecánica y Eléctrica S.A'), h('div', null, 'Oficentro Plaza Roble, Edificio Pórtico, Escazú')),
        cuerpo,
        h('div', { class: 'pdf-pie' }, h('span', { class: 'c' }, 'www.sinergia.co.cr     info@sinergia.co.cr     Tel: 2215-3865'), h('span', { class: 'p' }, String(nombre).slice(0, 40) + ' · Página ' + n))));
    };
    const cabe = () => cuerpo.scrollHeight <= cuerpo.clientHeight + 1;
    const esTitulo = (e) => /^H[1-6]$/.test(e.tagName);
    /* hoja nueva; los títulos que quedaron solos al final de la anterior pasan con su contenido */
    const siguiente = () => {
      const huerf = [];
      while (cuerpo.children.length > 1 && esTitulo(cuerpo.lastElementChild)) huerf.unshift(cuerpo.removeChild(cuerpo.lastElementChild));
      nueva(); huerf.forEach((e) => cuerpo.append(e));
    };
    const dividir = (nodo) => {
      const tabla = nodo.querySelector('table'), hijos = [...nodo.children], iT = hijos.indexOf(tabla);
      if (iT < 0) return;
      const antes = hijos.slice(0, iT), despues = hijos.slice(iT + 1), cab = tabla.rows[0], filas = [...tabla.rows].slice(1);
      nodo.remove();
      const crear = (primera) => { const w = nodo.cloneNode(false); if (primera) antes.forEach((a) => w.append(a)); const t = tabla.cloneNode(false); t.append(cab.cloneNode(true)); w.append(t); return { w, t }; };
      let cur = crear(true); cuerpo.append(cur.w);
      if (!cabe() && cuerpo.children.length > 1) { cur.w.remove(); siguiente(); cuerpo.append(cur.w); }
      filas.forEach((fila) => {
        cur.t.append(fila);
        if (cabe()) return;
        cur.t.removeChild(fila);
        if (cur.t.rows.length <= 1) { cur.w.remove(); siguiente(); cuerpo.append(cur.w); cur.t.append(fila); return; }
        siguiente(); cur = crear(false); cuerpo.append(cur.w); cur.t.append(fila);
      });
      despues.forEach((d) => { cuerpo.append(d); if (!cabe() && cuerpo.children.length > 1) { cuerpo.removeChild(d); siguiente(); cuerpo.append(d); } });
    };
    const poner = (nodo) => {
      if (nodo.classList && nodo.classList.contains('pdf-salto')) { if (cuerpo.children.length) nueva(); return; }
      cuerpo.append(nodo);
      /* una tabla más ancha que la hoja se reduce para que quepa completa */
      if (nodo.scrollWidth > cuerpo.clientWidth + 1) (nodo.querySelector('table') || nodo).style.zoom = cuerpo.clientWidth / nodo.scrollWidth;
      if (cabe()) return;
      if (nodo.classList.contains('pdf-tabla') && nodo.querySelector('table')) { dividir(nodo); return; }
      if (cuerpo.children.length === 1) return; /* más alto que la hoja: se deja entero */
      cuerpo.removeChild(nodo); siguiente(); cuerpo.append(nodo);
    };
    nueva(); nodos.forEach(poner);
    const st = document.createElement('style'); st.textContent = '@page { size: letter; margin: 0; }'; document.head.append(st);
    document.body.classList.add('pdf-imprime');
    const fin = () => { document.body.classList.remove('pdf-imprime'); document.title = ant; st.remove(); doc.remove(); window.removeEventListener('afterprint', fin); };
    window.addEventListener('afterprint', fin); setTimeout(() => window.print(), 200);
  };
  Object.assign(BMS, { h, uid, num, pad, cut, clone, descargar, leerArchivo, norm, buscarTipos, imprimirPaginado });
})();
