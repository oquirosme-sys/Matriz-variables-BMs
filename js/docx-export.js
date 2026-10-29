/* Exportación e importación de Word para las secuencias de operación.
   Exporta sobre la plantilla Sinergia (js/docx-base.js): membrete, estilos de títulos, viñetas, tablas con reglas horizontales
   y pie con número de página. Vocabulario de bloques:
     { t: 'h1' | 'h2' | 'p' | 'li', texto }      (**negrita** dentro del texto)
     { t: 'tabla', titulo?, fuente?, nota?, filas: [[…]] (la primera es el encabezado), cols?: [pesos], align?: ['l'|'r'], total?: bool }
     { t: 'imagen', png: Uint8Array, w, h, pie? } (w y h en px del PNG)
     { t: 'salto' }                                (salto de página)
     { t: 'horizontal' }                           (lo que sigue va en hojas apaisadas)
   Requiere JSZip (cdnjs). */
(function () {
  const ANCHO = { v: 8838, h: 12438 };               // ancho útil en twips (carta, márgenes de 3 cm)
  const ALTO_H = 6600;                                 // alto máximo de una figura en hoja apaisada (twips), dejando lugar al título y al pie
  const esc = (t) => String(t == null ? '' : t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const run = (t, o = {}) => '<w:r>' + (o.b || o.i || o.color || o.hl || o.rojo ? '<w:rPr>' + (o.b ? '<w:b/>' : '') + (o.i ? '<w:i/>' : '') + (o.rojo || o.hl ? '<w:color w:val="C00000"/>' : o.color ? '<w:color w:val="' + o.color + '"/>' : '') + '' + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(t) + '</w:t></w:r>';
  /* **negrita**, ==resaltado amarillo== (por validar), !!rojo!! (lo que debe modificarse); lo que va entre [corchetes] se resalta solo */
  const runs = (texto, o = {}) => {
    let b = false, hl = false, rojo = false, out = '';
    String(texto == null ? '' : texto).split(/(\*\*|==|!!)/).forEach((s) => {
      if (s === '**') { b = !b; return; }
      if (s === '==') { hl = !hl; return; }
      if (s === '!!') { rojo = !rojo; return; }
      if (!s) return;
      s.split(/(\[[^\]\n]{1,120}\])/).forEach((q) => { if (q) out += run(q, { ...o, b: o.b || b, rojo: o.rojo || rojo, hl: o.hl || hl || /^\[[^\]]+\]$/.test(q) }); });
    });
    return out;
  };
  const P = (texto, o = {}) => '<w:p><w:pPr>' + (o.estilo ? '<w:pStyle w:val="' + o.estilo + '"/>' : '') + (o.keep ? '<w:keepNext/>' : '') +
    (o.num != null ? '<w:numPr><w:ilvl w:val="' + (o.ilvl || 0) + '"/><w:numId w:val="' + o.num + '"/></w:numPr>' : '') + (o.jc ? '<w:jc w:val="' + o.jc + '"/>' : '') + '</w:pPr>' + runs(texto, o.run || {}) + '</w:p>';
  const H1 = (t) => '<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr></w:pPr>' + runs(t) + '</w:p>';
  const H2 = (t) => '<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:numPr><w:ilvl w:val="1"/><w:numId w:val="0"/></w:numPr></w:pPr>' + runs(t) + '</w:p>';
  const LI = (t) => P(t, { estilo: 'ListParagraph', num: 4 });
  const SALTO = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const campoSeq = (nombre, n) => '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> SEQ ' + nombre + ' \\* ARABIC </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>' + n + '</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>';
  const SECT = (apaisado, conRefs) => '<w:sectPr>' + (conRefs ? '<w:headerReference w:type="default" r:id="rId7"/><w:footerReference w:type="default" r:id="rId8"/>' : '') +
    (apaisado ? '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>' : '<w:pgSz w:w="12240" w:h="15840"/>') + '<w:pgMar w:top="1417" w:right="1701" w:bottom="1417" w:left="1701" w:header="708" w:footer="1134" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>';

  /* Tabla Sinergia: reglas horizontales, encabezado que se repite, anchos fijos, cifras a la derecha y celdas sin dato con raya. */
  function tabla(b, ancho, ctx) {
    const filas = (b.filas || []).filter((f) => f && f.length);
    if (!filas.length) return '';
    const n = Math.max(...filas.map((f) => f.length));
    const pesos = b.cols && b.cols.length === n ? b.cols : Array(n).fill(1);
    const sp = pesos.reduce((a, x) => a + x, 0);
    const w = pesos.map((x) => Math.floor((ancho * x) / sp)); w[n - 1] += ancho - w.reduce((a, x) => a + x, 0);
    const esNum = (t) => /^[-+]?[\d.,\s]*\d[\d.,\s%]*$/.test(String(t).trim()) || String(t).trim() === '—';
    const align = b.align || Array.from({ length: n }, (_, c) => (filas.slice(1).filter((f) => f[c] != null && String(f[c]).trim() !== '').length && filas.slice(1).filter((f) => f[c] != null && String(f[c]).trim() !== '').every((f) => esNum(f[c])) ? 'r' : 'l'));
    let x = '';
    ctx.tablas = (ctx.tablas || 0) + 1;
    x += '<w:p><w:pPr><w:pStyle w:val="TablaTitulo"/></w:pPr><w:r><w:t xml:space="preserve">' + (BMS.docxLang === 'en' ? 'Table No. ' : 'Tabla No. ') + '</w:t></w:r>' + campoSeq('Tabla', ctx.tablas) + '</w:p>';
    x += '<w:p><w:pPr><w:pStyle w:val="TablaTitulo"/><w:spacing w:before="0"/></w:pPr>' + runs(b.titulo || 'Tabla de datos') + '</w:p>';
    if (b.fuente) x += P(b.fuente, { estilo: 'TablaFuente' });
    x += '<w:tbl><w:tblPr><w:tblStyle w:val="TablaSinergia"/><w:tblW w:w="' + ancho + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="0420" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>' + w.map((v) => '<w:gridCol w:w="' + v + '"/>').join('') + '</w:tblGrid>';
    filas.forEach((f, i) => {
      x += '<w:tr><w:trPr><w:cantSplit/>' + (i === 0 ? '<w:tblHeader/>' : '') + '</w:trPr>';
      for (let c = 0; c < n; c++) {
        let t = f[c] == null || String(f[c]).trim() === '' ? '—' : String(f[c]);
        const ultima = b.total && i === filas.length - 1;
        x += '<w:tc><w:tcPr><w:tcW w:w="' + w[c] + '" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + (align[c] === 'r' ? 'right' : 'left') + '"/></w:pPr>' + runs(t, { b: ultima }) + '</w:p></w:tc>';
      }
      x += '</w:tr>';
    });
    x += '</w:tbl>';
    x += b.nota ? P(b.nota, { estilo: 'TablaNota' }) : '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
    return x;
  }

  function imagen(b, ancho, ctx) {
    ctx.imgs = ctx.imgs || [];
    const k = ctx.imgs.length + 1, rid = 'rIdImg' + k, nombre = 'diagrama' + k + '.png';
    ctx.imgs.push({ nombre, rid, data: b.png });
    const cxTw = ancho, cyTw = Math.round((ancho * b.h) / b.w), maxTw = ALTO_H;
    let wTw = cxTw, hTw = cyTw; if (hTw > maxTw) { wTw = Math.round((wTw * maxTw) / hTw); hTw = maxTw; }
    const cx = wTw * 635, cy = hTw * 635;
    ctx.figuras = (ctx.figuras || 0) + 1;
    return '<w:p><w:pPr><w:keepNext/><w:spacing w:after="0"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + (100 + k) + '" name="Diagrama ' + k + '"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="' + (100 + k) + '" name="' + nombre + '"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>' +
      (b.pie ? P(b.pie, { estilo: 'TablaFuente' }) : '');
  }

  /* Une los rótulos "Tabla No. n" + nombre y la nota posterior con la tabla que acompañan. */
  function normalizar(bloques) {
    const out = [];
    for (let i = 0; i < bloques.length; i++) {
      const b = bloques[i];
      if (b.t === 'p' && /^(tabla|table)\s+no\.?\s*\d*\s*$/i.test(String(b.texto).trim())) {
        const sig = bloques[i + 1];
        const titulo = sig && sig.t === 'p' ? sig.texto : '';
        const tab = bloques[i + (titulo ? 2 : 1)];
        if (tab && tab.t === 'tabla') { out.push({ ...tab, titulo: tab.titulo || titulo }); i += titulo ? 2 : 1;
          const nx = bloques[i + 1]; if (nx && nx.t === 'p' && /^(fuente|nota|source|note)\b/i.test(String(nx.texto).trim())) { out[out.length - 1].nota = nx.texto; i++; }
          continue; }
      }
      if (b.t === 'tabla' && !b.titulo) { const u = out[out.length - 1]; if (u && u.t === 'p' && String(u.texto).length <= 80 && !/^(tabla|table)\s+no/i.test(u.texto)) { out.pop(); out.push({ ...b, titulo: String(u.texto).replace(/[:.]\s*$/, '') }); continue; } }
      out.push(b);
    }
    return out;
  }

  BMS.docxXml = (portada, bloquesIn) => {
    const ctx = {}, bloques = normalizar(bloquesIn);
    const pr = (portada || []).map((x) => String(x || '').trim());
    let v = '', h = '', apaisado = false;
    const destino = () => (apaisado ? 'h' : 'v');
    const add = (xml) => { if (apaisado) h += xml; else v += xml; };
    /* portada */
    if (pr[1]) v += '<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr><w:jc w:val="center"/></w:pPr>' + runs(pr[1]) + '</w:p>';
    [pr[0], pr[2], pr[3]].forEach((t) => { if (t) v += P(t, { jc: 'center' }); });
    if (pr[4]) v += P(pr[4], { run: { i: true, color: '3C3F41' } });
    bloques.forEach((b) => {
      const ancho = apaisado ? ANCHO.h : ANCHO.v;
      if (b.t === 'h1') add(H1(b.texto));
      else if (b.t === 'h2') add(H2(b.texto));
      else if (b.t === 'li') add(LI(b.texto));
      else if (b.t === 'p') add(P(b.texto));
      else if (b.t === 'tabla') add(tabla(b, ancho, ctx));
      else if (b.t === 'imagen') add(imagen(b, ancho, ctx));
      else if (b.t === 'salto') add(SALTO);
      else if (b.t === 'horizontal' && !apaisado) { v += '<w:p><w:pPr>' + SECT(false, true) + '</w:pPr></w:p>'; apaisado = true; }
    });
    const cierre = SECT(apaisado, true);
    return { cuerpo: v + h + cierre, ctx };
  };

  BMS.exportarSecuenciasDocx = async (titulo, portada, bloques) => {
    if (!window.JSZip) throw new Error('No se pudo cargar la librería JSZip (se necesita internet).');
    const bin = atob(window.BMS_DOCX_BASE), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const zip = await JSZip.loadAsync(u8);
    const doc = await zip.file('word/document.xml').async('string');
    const { cuerpo, ctx } = BMS.docxXml(portada, bloques);
    const ini = doc.indexOf('<w:body>') + '<w:body>'.length;
    zip.file('word/document.xml', doc.slice(0, ini) + cuerpo + '</w:body></w:document>');
    /* pie: nombre del documento en una sola línea */
    let pie = await zip.file('word/footer1.xml').async('string');
    pie = pie.replace('Nombre Documento', esc(String(titulo || 'Secuencias de operación').slice(0, 34)));
    zip.file('word/footer1.xml', pie);
    /* imágenes */
    if (ctx.imgs && ctx.imgs.length) {
      let rels = await zip.file('word/_rels/document.xml.rels').async('string');
      ctx.imgs.forEach((im) => {
        zip.file('word/media/' + im.nombre, im.data);
        rels = rels.replace('</Relationships>', '<Relationship Id="' + im.rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' + im.nombre + '"/></Relationships>');
      });
      zip.file('word/_rels/document.xml.rels', rels);
    }
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  };

  /* Líneas de texto de un Word (párrafos y celdas), para cargar el estándar del hotel. */
  BMS.lineasDocx = async (buffer) => {
    const zip = await JSZip.loadAsync(buffer);
    const dom = new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'), 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    return [...dom.getElementsByTagNameNS(W, 'p')].map((p) => [...p.getElementsByTagNameNS(W, 't')].map((t) => t.textContent).join('').replace(/\s+/g, ' ').trim()).filter(Boolean);
  };

  /* ---------- Importación: Word → portada + bloques ---------- */
  BMS.leerSecuenciasDocx = async (buffer) => {
    if (!window.JSZip) throw new Error('No se pudo cargar la librería JSZip (se necesita internet).');
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml').async('string');
    const dom = new DOMParser().parseFromString(xml, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const hijos = (n, tag) => [...n.childNodes].filter((c) => c.localName === tag && c.namespaceURI === W);
    const texto = (p) => {
      let s = '';
      const corridas = [];
      const rec = (n) => [...n.childNodes].forEach((c) => {
        if (c.namespaceURI !== W) return;
        if (c.localName === 'r') {
          const rpr = hijos(c, 'rPr')[0]; const b = rpr ? hijos(rpr, 'b')[0] : null;
          const negrita = !!b && !['0', 'false'].includes(b.getAttributeNS(W, 'val'));
          let t = '';
          [...c.childNodes].forEach((x) => { if (x.localName === 't') t += x.textContent; else if (x.localName === 'tab') t += ' '; else if (x.localName === 'br') t += ' '; });
          const hi = rpr ? hijos(rpr, 'highlight')[0] : null, sh = rpr ? hijos(rpr, 'shd')[0] : null;
          const resaltado = (!!hi && hi.getAttributeNS(W, 'val') !== 'none') || (!!sh && /^(FFFF00|FFF2CC|FFFF99|FFEB9C|FFD966)$/i.test(sh.getAttributeNS(W, 'fill') || ''));
          const co = rpr ? hijos(rpr, 'color')[0] : null, cv = co ? (co.getAttributeNS(W, 'val') || '') : '';
          const rojo = /^(FF0000|C00000|CC0000|E00000|FF1111|D00000)$/i.test(cv);
          if (t) corridas.push({ t, b: negrita, h: resaltado, r: rojo });
        } else if (['hyperlink', 'ins', 'smartTag', 'sdt', 'sdtContent'].includes(c.localName)) rec(c);
      });
      rec(p);
      /* une corridas contiguas con el mismo formato y marca la negrita con ** */
      const m = []; corridas.forEach((c) => { const u = m[m.length - 1]; if (u && u.b === c.b && u.h === c.h && u.r === c.r) u.t += c.t; else m.push({ ...c }); });
      const todoNegrita = m.length && m.every((c) => c.b);
      s = m.map((c) => { let x = c.t.trim(); if (!x) return c.t; if (c.h) x = '==' + x + '=='; if (c.r) x = '!!' + x + '!!'; if (c.b && !todoNegrita) x = '**' + x + '**'; return (/^\s/.test(c.t) ? ' ' : '') + x + (/\s$/.test(c.t) ? ' ' : ''); }).join('');
      return s.replace(/\s+/g, ' ').trim();
    };
    const cuerpo = hijos(dom.getElementsByTagNameNS(W, 'body')[0], 'p').length ? dom.getElementsByTagNameNS(W, 'body')[0] : null;
    if (!cuerpo) throw new Error('El archivo no parece un documento de Word válido.');
    const portada = [], bloques = [];
    let visto = false;
    [...cuerpo.childNodes].forEach((el) => {
      if (el.namespaceURI !== W) return;
      if (el.localName === 'p') {
        const ppr = hijos(el, 'pPr')[0]; const est = ppr ? hijos(ppr, 'pStyle')[0] : null; const id = est ? est.getAttributeNS(W, 'val') : '';
        const num = !!(ppr && hijos(ppr, 'numPr')[0]);
        const t = texto(el); if (!t) return;
        if (/^Heading1$/i.test(id)) { visto = true; bloques.push({ t: 'h1', texto: t.replace(/\*\*/g, '') }); }
        else if (/^Heading2$/i.test(id) || /^Heading3$/i.test(id)) { visto = true; bloques.push({ t: 'h2', texto: t.replace(/\*\*/g, '') }); }
        else if (!visto) portada.push(t.replace(/\*\*/g, ''));
        else if (id === 'ListParagraph' || num) bloques.push({ t: 'li', texto: t });
        else bloques.push({ t: 'p', texto: t });
      } else if (el.localName === 'tbl' && visto) {
        const filas = hijos(el, 'tr').map((tr) => hijos(tr, 'tc').map((tc) => hijos(tc, 'p').map((p) => texto(p).replace(/\*\*/g, '')).filter(Boolean).join(' / ')));
        if (filas.length) bloques.push({ t: 'tabla', filas });
      }
    });
    /* si es una exportación de esta herramienta, los anexos generados se descartan: se vuelven a generar con los datos del proyecto */
    const i = bloques.findIndex((b) => b.t === 'h1' && BMS.esAnexoGenerado && BMS.esAnexoGenerado(b.texto));
    const util = i >= 0 ? bloques.slice(0, i) : bloques;
    while (portada.length < 5) portada.push('');
    return { portada: portada.slice(0, 5), bloques: util, descartados: i >= 0 ? bloques.length - i : 0 };
  };
})();
