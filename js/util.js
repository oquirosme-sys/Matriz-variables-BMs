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
  Object.assign(BMS, { h, uid, num, pad, cut, clone, descargar, leerArchivo, norm, buscarTipos });
})();
