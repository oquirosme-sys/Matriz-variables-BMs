/* Exporta el catálogo de variables a Excel en el formato "BMS Point Schedule" de Sinergia:
   una pestaña por disciplina, grupos numerados (1, 2…), subgrupos por equipo (1.1, 1.2…) con la cantidad editable,
   filas de punto con QTY y columnas Analogue In/Out y Digital In/Out (más INT, alarma, tendencia, interfaz y origen),
   TOTAL por sistema y GRAND TOTALS. Las cantidades y totales son fórmulas: al cambiar la cantidad de un equipo se recalculan.
   Usa ExcelJS (se carga desde cdnjs en index.html). */
(function () {
  const DISC = [
    { hoja: 'HVAC', ing: 'Mechanical', sub: 'Sistemas mecánicos — HVAC', cats: ['hvac', 'vent', 'plantas'] },
    { hoja: 'Fontaneria', ing: 'Plumbing', sub: 'Sistemas de fontanería y agua caliente', cats: ['acs', 'hidro'] },
    { hoja: 'Electrico', ing: 'Electrical', sub: 'Sistemas eléctricos e iluminación', cats: ['elec', 'ilum'] },
    { hoja: 'Incendio y seguridad', ing: 'Fire & Security', sub: 'Protección contra incendio y seguridad', cats: ['inc'] },
    { hoja: 'GRMS', ing: 'Guestroom', sub: 'Control de habitaciones, PMS y GRMS', cats: ['grms'] },
    { hoja: 'Instrumentos', ing: 'Instrumentation', sub: 'Instrumentos, válvulas y compuertas', cats: ['inst'] },
    { hoja: 'Miscelaneos', ing: 'Miscellaneous', sub: 'Equipos misceláneos', cats: ['misc'] }
  ];
  const COL = { grupo: 'FF9BC2E6', cantidad: 'FFFFF2CC', total: 'FFD9D9D9', gran: 'FFFFFF00' };
  const FINA = { style: 'thin' }, MEDIA = { style: 'medium' };
  const letra = (n) => String.fromCharCode(64 + n);
  const MAXC = 12; // A..L

  BMS.xlDisc = DISC;
  BMS.exportarCatalogoXlsx = async (soloBuffer) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet). Use "Exportar catálogo (JSON)".'); return; }
    const CAT = BMS.catEq, P = BMS.estado.proyecto;
    const wb = new ExcelJS.Workbook(); wb.creator = 'Sinergia Ingeniería'; wb.created = new Date();
    const usadas = new Set(), resumen = [];
    const colorTipos = {};
    DISC.forEach((d) => d.cats.forEach((c) => usadas.add(c)));
    const sueltas = CAT.categorias.filter((c) => !usadas.has(c.id)).map((c) => c.id);
    if (sueltas.length) DISC[DISC.length - 1].cats.push(...sueltas);

    const ws0 = wb.addWorksheet('Indice');
    DISC.forEach((d) => {
      const cats = d.cats.map((id) => CAT.categorias.find((c) => c.id === id)).filter(Boolean);
      const tiposDe = (id) => CAT.tipos.filter((t) => t.cat === id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      if (!cats.some((c) => tiposDe(c.id).length)) return;
      const ws = wb.addWorksheet(d.hoja.slice(0, 31), { views: [{ state: 'frozen', ySplit: 8, showGridLines: true }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
      [11.6, 62, 8, 9, 9, 9, 9, 11, 12, 12, 20, 60].forEach((w, i) => (ws.getColumn(i + 1).width = w));
      const c = (ref) => ws.getCell(ref);
      c('A2').value = 'BMS Point Schedule'; c('A3').value = d.sub;
      c('A4').value = 'Project:'; c('B4').value = P.nombre || '—';
      ['A2', 'A3'].forEach((r) => { c(r).font = { name: 'Calibri', size: 22, bold: true }; c(r).alignment = { vertical: 'middle', horizontal: 'left' }; ws.getRow(+r.slice(1)).height = 28.5; });
      ['A4', 'B4'].forEach((r) => { c(r).font = { name: 'Calibri', size: 14, italic: true }; c(r).alignment = { vertical: 'middle', horizontal: 'center' }; });
      /* encabezado */
      const enc = { A7: 'Ref No.', B7: 'BMS Point Schedule – Typical ' + d.ing + ' System Description', C7: 'QTY', D7: 'Analogue', F7: 'Digital', H7: 'INT (gateway)', I7: 'Alarma', J7: 'Tendencia', K7: 'Interfaz', L7: 'Origen / nota' };
      Object.entries(enc).forEach(([r, v]) => (c(r).value = v));
      ['A', 'B', 'C', 'H', 'I', 'J', 'K', 'L'].forEach((l) => ws.mergeCells(l + '7:' + l + '8'));
      ws.mergeCells('D7:E7'); ws.mergeCells('F7:G7');
      c('D8').value = 'In'; c('E8').value = 'Out'; c('F8').value = 'In'; c('G8').value = 'Out';
      for (let r = 7; r <= 8; r++) for (let k = 1; k <= MAXC; k++) {
        const x = ws.getCell(r, k);
        x.font = { name: 'Calibri', size: 12, bold: true, italic: true }; x.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        x.border = { top: r === 7 ? MEDIA : FINA, bottom: r === 8 ? MEDIA : FINA, left: k === 1 ? MEDIA : FINA, right: FINA };
      }
      ws.getRow(7).height = 18; ws.getRow(8).height = 18;

      let fila = 9, g = 0, equipos = 0, puntos = 0; const totales = [], grupoFilas = [];
      cats.forEach((cat) => {
        const ts = tiposDe(cat.id); if (!ts.length) return;
        g++;
        const filaGrupo = fila++, primera = fila;
        ws.getCell(filaGrupo, 1).value = g; ws.getCell(filaGrupo, 2).value = cat.nombre.toUpperCase();
        ts.forEach((t, i) => {
          equipos++;
          const fs = fila++;
          ws.getCell(fs, 1).value = g + '.' + (i + 1); ws.getCell(fs, 2).value = t.nombre + ' — qty = cantidad de equipos';
          ws.getCell(fs, 3).value = 1; ws.getCell(fs, 12).value = t.nota || '';
          ws.getCell(fs, 1).font = { name: 'Calibri', size: 11, italic: true }; ws.getCell(fs, 2).font = { name: 'Calibri', size: 11, italic: true };
          ws.getCell(fs, 3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0000FF' } };
          ws.getCell(fs, 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.cantidad } };
          ws.getCell(fs, 12).font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF595959' } }; ws.getCell(fs, 12).alignment = { wrapText: false, vertical: 'center' };
          t.pts.forEach((p) => {
            const r = fila++; puntos++;
            ws.getCell(r, 2).value = p.n; ws.getCell(r, 2).alignment = { horizontal: 'right' };
            ws.getCell(r, 3).value = { formula: 'SUM(D' + r + ':H' + r + ')' };
            [p.ai, p.ao, p.di, p.do, p.int].forEach((n, k) => { if (n) ws.getCell(r, 4 + k).value = { formula: n + '*$C$' + fs }; });
            ws.getCell(r, 9).value = p.alm || ''; ws.getCell(r, 10).value = p.tend || ''; ws.getCell(r, 11).value = p.ifc || '';
          });
        });
        const ft = fila++;
        ws.getCell(ft, 2).value = 'TOTAL'; ws.getCell(ft, 2).alignment = { horizontal: 'right' };
        for (let k = 4; k <= 8; k++) ws.getCell(ft, k).value = { formula: 'SUM(' + letra(k) + primera + ':' + letra(k) + (ft - 1) + ')' };
        ws.getCell(filaGrupo, 3).value = { formula: 'SUM(D' + ft + ':H' + ft + ')' };
        totales.push(ft); grupoFilas.push(filaGrupo);
      });
      const fg = fila++;
      ws.getCell(fg, 2).value = 'GRAND TOTALS';
      for (let k = 4; k <= 8; k++) ws.getCell(fg, k).value = { formula: totales.map((t) => letra(k) + t).join('+') };
      ws.getCell(fg, 3).value = { formula: 'SUM(D' + fg + ':H' + fg + ')' };
      /* formato de todas las celdas de la tabla */
      for (let r = 9; r <= fg; r++) for (let k = 1; k <= MAXC; k++) {
        const x = ws.getCell(r, k);
        if (!x.font) x.font = { name: 'Calibri', size: 11 };
        if (k !== 2 && k !== 12 && !(x.alignment && x.alignment.horizontal)) x.alignment = { horizontal: 'center', vertical: 'middle' };
        x.border = { top: FINA, bottom: FINA, left: k === 1 ? MEDIA : FINA, right: FINA };
        if (k === 12) x.border.right = MEDIA;
      }
      grupoFilas.forEach((r) => { for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(r, k); x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.grupo } }; x.font = { name: 'Calibri', size: 11, bold: true }; x.border.top = MEDIA; } ws.getCell(r, 2).alignment = { horizontal: 'left', vertical: 'middle' }; });
      totales.forEach((r) => { for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(r, k); x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.total } }; x.font = { name: 'Calibri', size: 11, bold: true }; x.border.bottom = MEDIA; } });
      for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(fg, k); x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.gran } }; x.font = { name: 'Calibri', size: 11, bold: true }; x.alignment = { horizontal: 'center', vertical: 'middle' }; x.border = { top: MEDIA, bottom: MEDIA, left: k === 1 ? MEDIA : FINA, right: k === MAXC ? MEDIA : FINA }; }
      ws.getRow(fg).height = 18;
      ws.autoFilter = undefined;
      const nota = fg + 2;
      ws.getCell(nota, 1).value = 'Notas:'; ws.getCell(nota, 1).font = { bold: true };
      [
        'En las filas de subgrupo (amarillo), QTY = cantidad de equipos y se puede editar; cada punto se multiplica por esa cantidad.',
        'Analogue In/Out = AI/AO, Digital In/Out = DI/DO. INT = puntos que llegan por integración (gateway o red) y no ocupan canales del controlador.',
        'Catálogo base de Sinergia para validación por disciplina; los cambios se registran en la herramienta de la matriz de puntos BMS.'
      ].forEach((t, i) => { ws.getCell(nota + 1 + i, 1).value = '• ' + t; ws.getCell(nota + 1 + i, 1).font = { size: 9 }; });
      resumen.push({ hoja: ws.name, disc: d.sub, sistemas: g, equipos, puntos, gran: fg });
    });

    /* índice */
    ws0.columns = [{ width: 24 }, { width: 46 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }];
    ws0.getCell('A2').value = 'BMS Point Schedule — Catálogo de variables'; ws0.getCell('A2').font = { size: 20, bold: true };
    ws0.getCell('A3').value = 'Proyecto: ' + (P.nombre || '—') + ' · Exportado: ' + new Date().toLocaleDateString('es-CR'); ws0.getCell('A3').font = { size: 12, italic: true };
    ['Pestaña', 'Disciplina', 'Sistemas', 'Equipos', 'Variables', 'AI', 'AO', 'DI', 'DO', 'INT'].forEach((t, i) => {
      const x = ws0.getCell(5, i + 1); x.value = t; x.font = { bold: true }; x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.grupo } }; x.alignment = { horizontal: 'center' }; x.border = { top: MEDIA, bottom: MEDIA, left: FINA, right: FINA };
    });
    resumen.forEach((r, i) => {
      const f = 6 + i;
      ws0.getCell(f, 1).value = { text: r.hoja, hyperlink: "#'" + r.hoja + "'!A1" }; ws0.getCell(f, 1).font = { color: { argb: 'FF0563C1' }, underline: true };
      ws0.getCell(f, 2).value = r.disc; ws0.getCell(f, 3).value = r.sistemas; ws0.getCell(f, 4).value = r.equipos; ws0.getCell(f, 5).value = r.puntos;
      [4, 5, 6, 7, 8].forEach((k, j) => (ws0.getCell(f, 6 + j).value = { formula: "'" + r.hoja + "'!" + letra(k) + r.gran }));
      for (let k = 1; k <= 10; k++) { const x = ws0.getCell(f, k); x.border = { top: FINA, bottom: FINA, left: FINA, right: FINA }; if (k > 2) x.alignment = { horizontal: 'center' }; }
    });
    const ft = 6 + resumen.length;
    ws0.getCell(ft, 2).value = 'TOTAL';
    for (let k = 3; k <= 10; k++) ws0.getCell(ft, k).value = { formula: 'SUM(' + letra(k) + '6:' + letra(k) + (ft - 1) + ')' };
    for (let k = 1; k <= 10; k++) { const x = ws0.getCell(ft, k); x.font = { bold: true }; x.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COL.gran } }; x.border = { top: MEDIA, bottom: MEDIA, left: FINA, right: FINA }; if (k > 2) x.alignment = { horizontal: 'center' }; }
    ws0.getCell(ft + 2, 1).value = 'Los totales de cada pestaña suponen 1 equipo de cada tipo; edite la cantidad (celda amarilla) para dimensionar.'; ws0.getCell(ft + 2, 1).font = { size: 9, italic: true };

    const buf = await wb.xlsx.writeBuffer();
    if (soloBuffer) return buf;
    BMS.descargar('Catalogo_Variables_BMS_' + (P.nombre || 'proyecto').replace(/[^\w\-]+/g, '_') + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };
  /* ---------- Importación: lee el Excel validado por cada disciplina y actualiza el catálogo ---------- */
  /* Interpreta las pestañas con el mismo formato de la exportación. Devuelve el resultado sin tocar el catálogo. */
  BMS.leerCatalogoXlsx = (buffer) => {
    const wb = XLSX.read(buffer, { type: 'array', cellFormula: true, sheetStubs: true });
    const CAT = BMS.catEq, norm = BMS.norm, tipos = [], avisos = [];
    const catPorNombre = (n) => { const c = CAT.categorias.find((x) => norm(x.nombre) === norm(n)); return c ? c.id : null; };
    wb.SheetNames.forEach((nombreHoja) => {
      if (norm(nombreHoja) === 'indice') return;
      const ws = wb.Sheets[nombreHoja]; if (!ws || !ws['!ref']) return;
      const rango = XLSX.utils.decode_range(ws['!ref']);
      const disc = DISC.find((d) => norm(d.hoja) === norm(nombreHoja));
      let catActual = disc ? disc.cats[0] : (CAT.categorias[0] || {}).id, actual = null, qty = 1, vistoEncabezado = false;
      const val = (r, c) => { const x = ws[XLSX.utils.encode_cell({ r, c })]; return x ? x : null; };
      const txt = (r, c) => { const x = val(r, c); return x && x.v != null ? String(x.v).trim() : ''; };
      const numero = (r, c) => {
        const x = val(r, c); if (!x) return 0;
        const f = x.f ? /^\+?(\d+(?:\.\d+)?)\*\$?C\$?\d+$/.exec(String(x.f).replace(/\s/g, '')) : null;
        if (f) return Math.round(parseFloat(f[1]));
        const v = typeof x.v === 'number' ? x.v : parseFloat(x.v);
        return isFinite(v) ? Math.round(v / (qty || 1)) : 0;
      };
      for (let r = rango.s.r; r <= rango.e.r; r++) {
        const A = txt(r, 0), B = txt(r, 1);
        if (!vistoEncabezado) { if (norm(A) === 'ref no.') vistoEncabezado = true; continue; }
        if (r < 8) continue;
        if (!B && !A) continue;
        if (/^grand totals$/i.test(B)) break;
        if (/^total$/i.test(B)) { actual = null; continue; }
        if (/^\d+$/.test(A) && B) { catActual = catPorNombre(B) || catActual; actual = null; continue; }
        if (/^\d+\.\d+$/.test(A) && B) {
          const nombre = B.replace(/\s+—\s+qty\s*=.*$/i, '').trim();
          const qv = val(r, 2); qty = qv && typeof qv.v === 'number' && qv.v > 0 ? qv.v : 1;
          actual = { hoja: nombreHoja, ref: A, nombre, cat: catActual, nota: txt(r, 11), pts: [] }; tipos.push(actual); continue;
        }
        if (!A && actual && B && !/^(notas?:|•)/i.test(B)) {
          actual.pts.push({ n: B, ai: numero(r, 3), ao: numero(r, 4), di: numero(r, 5), do: numero(r, 6), int: numero(r, 7), alm: txt(r, 8), tend: txt(r, 9), ifc: txt(r, 10) });
        }
      }
    });
    if (!tipos.length) avisos.push('No se encontró ningún equipo con el formato de la exportación (pestañas con "Ref No." y subgrupos numerados 1.1, 1.2…).');
    /* comparar contra el catálogo actual */
    tipos.forEach((t) => {
      const ex = CAT.tipos.find((x) => norm(x.nombre) === norm(t.nombre));
      t.existente = ex || null;
      if (!ex) { t.estado = 'nuevo'; return; }
      const mismo = (a, b) => a.n === b.n && a.ai === b.ai && a.ao === b.ao && a.di === b.di && a.do === b.do && a.int === b.int && (a.alm || '') === (b.alm || '') && (a.tend || '') === (b.tend || '') && (a.ifc || '') === (b.ifc || '');
      const porNombre = {}; ex.pts.forEach((p) => (porNombre[norm(p.n)] = p));
      const nuevos = t.pts.filter((p) => !porNombre[norm(p.n)]).length;
      const cambiados = t.pts.filter((p) => porNombre[norm(p.n)] && !mismo(p, porNombre[norm(p.n)])).length;
      const quitados = ex.pts.filter((p) => !t.pts.some((q) => norm(q.n) === norm(p.n))).length;
      t.cambios = { nuevos, cambiados, quitados };
      t.estado = nuevos || cambiados || quitados || (t.nota && t.nota !== (ex.nota || '')) ? 'cambiado' : 'igual';
    });
    return { tipos, avisos };
  };

  BMS.aplicarCatalogoXlsx = (res) => {
    const CAT = BMS.catEq;
    res.tipos.forEach((t) => {
      if (t.estado === 'igual') return;
      if (t.estado === 'nuevo') {
        const id = 'u_' + BMS.uid();
        CAT.tipos.push({ id, cat: t.cat, nombre: t.nombre, tag: '', gw: '', nota: t.nota || 'Importado desde la matriz validada', pts: t.pts.map((p, i) => ({ id: id + '_' + (i + 1), ...p })) });
      } else {
        const ex = t.existente;
        const antes = ex.pts.slice();
        ex.pts = t.pts.map((p) => { const o = antes.find((x) => BMS.norm(x.n) === BMS.norm(p.n)); return { id: o ? o.id : ex.id + '_' + BMS.uid(), ...p }; });
        if (t.nota) ex.nota = t.nota;
      }
    });
    BMS.guardarCatEq();
  };

  BMS.importarCatalogoXlsx = () => {
    if (!window.XLSX) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.xlsx,.xlsm';
    inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const res = BMS.leerCatalogoXlsx(new Uint8Array(rd.result));
          if (!res.tipos.length) { alert(res.avisos.join('\n')); return; }
          const nuevos = res.tipos.filter((t) => t.estado === 'nuevo'), cambiados = res.tipos.filter((t) => t.estado === 'cambiado'), iguales = res.tipos.filter((t) => t.estado === 'igual');
          const lin = (t) => '  · ' + t.ref + ' ' + t.nombre + (t.cambios ? ' (+' + t.cambios.nuevos + ' nuevas, ' + t.cambios.cambiados + ' cambiadas, -' + t.cambios.quitados + ' quitadas)' : '');
          if (!cambiados.length && !nuevos.length) { alert('El archivo coincide con el catálogo actual; no hay cambios que aplicar.'); return; }
          const msg = 'Equipos leídos: ' + res.tipos.length + '\n- Sin cambios: ' + iguales.length + '\n- Con cambios: ' + cambiados.length + (cambiados.length ? '\n' + cambiados.slice(0, 12).map(lin).join('\n') + (cambiados.length > 12 ? '\n  … y ' + (cambiados.length - 12) + ' más' : '') : '') + '\n- Nuevos: ' + nuevos.length + (nuevos.length ? '\n' + nuevos.slice(0, 8).map(lin).join('\n') : '') + '\n\nLos equipos del catálogo que no vengan en el archivo no se eliminan. ¿Aplicar los cambios al catálogo?';
          if (!confirm(msg)) return;
          BMS.aplicarCatalogoXlsx(res); BMS.rerender();
        } catch (e) { alert('No se pudo leer el archivo: ' + e.message); }
      };
      rd.readAsArrayBuffer(f);
    });
    inp.click();
  };
})();
