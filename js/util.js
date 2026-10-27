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
  Object.assign(BMS, { h, uid, num, pad, cut, clone, descargar, leerArchivo });
})();
