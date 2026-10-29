/* Exporta el proyecto a Excel en el formato "BMS Point Schedule" de Sinergia (el mismo del catálogo de variables):
   una pestaña por disciplina, sistemas numerados, un renglón por equipo del proyecto con su nivel, tag y controlador,
   los puntos de cada equipo debajo (cantidad editable y totales por fórmula), TOTAL por sistema y GRAND TOTALS.
   Cada pestaña lleva su tabla con el nombre de la pestaña: en las disciplinas es un rango con nombre (Tabla_HVAC…);
   en las demás es una tabla de Excel (filtros, bandas y fila de totales) que se llama igual que la pestaña.
   Módulo 3 (Equipos por nivel): disciplinas + tabla «Equipos_por_nivel».
   Módulo 4 (Resumen): disciplinas + Resumen_Nivel, Resumen_Controlador, Nivel_x_Controlador y Resumen_Sistema.
   Usa ExcelJS (cdnjs). */
(function () {
  const COL = { grupo: 'FF9BC2E6', cantidad: 'FFFFF2CC', total: 'FFD9D9D9', gran: 'FFFFFF00' };
  const FINA = { style: 'thin' }, MEDIA = { style: 'medium' };
  const letra = (n) => String.fromCharCode(64 + n);
  const MAXC = 14; // A..N
  const limpia = (s) => String(s || 'proyecto').replace(/[^\w\-]+/g, '_');
  const relleno = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  /* ---------- pestañas por disciplina ---------- */
  function hojasDisciplina(wb, res, C, E, P, resumen) {
    const DISC = BMS.xlDisc, CAT = BMS.catEq;
    const filas = C.filasOrdenadas(res).filter((f) => f.tipo && f.eq.qty > 0);
    const usadas = new Set(DISC.flatMap((d) => d.cats));
    DISC.forEach((d) => {
      const cats = d.cats.map((id) => CAT.categorias.find((c) => c.id === id)).filter(Boolean);
      const delaCat = (id) => filas.filter((f) => f.tipo.cat === id);
      if (!cats.some((c) => delaCat(c.id).length)) return;
      const nombreHoja = d.hoja.replace(/ /g, '_').slice(0, 31), tabla = 'Tabla_' + nombreHoja.replace(/[^\w]/g, '_');
      const ws = wb.addWorksheet(nombreHoja, { views: [{ state: 'frozen', ySplit: 8, showGridLines: true }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
      [11.6, 62, 8, 9, 9, 9, 9, 11, 9, 16, 16, 12, 12, 20].forEach((w, i) => (ws.getColumn(i + 1).width = w));
      const c = (ref) => ws.getCell(ref);
      c('A2').value = 'BMS Point Schedule'; c('A3').value = d.sub;
      c('A4').value = 'Project:'; c('B4').value = P.nombre || '—';
      c('A5').value = 'Tabla:'; c('B5').value = tabla + ' (pestaña ' + nombreHoja + ')';
      ['A2', 'A3'].forEach((r) => { c(r).font = { name: 'Calibri', size: 22, bold: true }; c(r).alignment = { vertical: 'middle', horizontal: 'left' }; ws.getRow(+r.slice(1)).height = 28.5; });
      ['A4', 'B4', 'A5', 'B5'].forEach((r) => { c(r).font = { name: 'Calibri', size: 12, italic: true }; c(r).alignment = { vertical: 'middle', horizontal: r[0] === 'A' ? 'center' : 'left' }; });
      const enc = { A7: 'Ref No.', B7: 'BMS Point Schedule – Typical ' + d.ing + ' System Description', C7: 'QTY', D7: 'Analogue', F7: 'Digital', H7: 'INT (gateway)', I7: 'Nivel', J7: 'Tag', K7: 'Controlador', L7: 'Alarma', M7: 'Tendencia', N7: 'Interfaz' };
      Object.entries(enc).forEach(([r, v]) => (c(r).value = v));
      ['A', 'B', 'C', 'H', 'I', 'J', 'K', 'L', 'M', 'N'].forEach((l) => ws.mergeCells(l + '7:' + l + '8'));
      ws.mergeCells('D7:E7'); ws.mergeCells('F7:G7');
      c('D8').value = 'In'; c('E8').value = 'Out'; c('F8').value = 'In'; c('G8').value = 'Out';
      for (let r = 7; r <= 8; r++) for (let k = 1; k <= MAXC; k++) {
        const x = ws.getCell(r, k);
        x.font = { name: 'Calibri', size: 12, bold: true, italic: true }; x.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        x.border = { top: r === 7 ? MEDIA : FINA, bottom: r === 8 ? MEDIA : FINA, left: k === 1 ? MEDIA : FINA, right: FINA };
      }
      ws.getRow(7).height = 18; ws.getRow(8).height = 18;

      let fila = 9, g = 0, equipos = 0, puntos = 0; const totales = [], grupoFilas = [], subFilas = [];
      cats.forEach((cat) => {
        const fs0 = delaCat(cat.id); if (!fs0.length) return;
        g++;
        const filaGrupo = fila++, primera = fila;
        ws.getCell(filaGrupo, 1).value = g; ws.getCell(filaGrupo, 2).value = cat.nombre.toUpperCase();
        fs0.forEach((f, i) => {
          equipos++;
          const fs = fila++, n = C.nivelDe(f.eq.nivel), ct = f.ctrlId ? C.nombreCtrl(C.ctrlDe(f.ctrlId)) : '';
          const lvl = n ? n.codigo : '', tag = f.eq.tag || '';
          subFilas.push(fs);
          ws.getCell(fs, 1).value = g + '.' + (i + 1); ws.getCell(fs, 2).value = f.tipo.nombre + ' — qty = cantidad de equipos';
          ws.getCell(fs, 3).value = f.eq.qty; ws.getCell(fs, 9).value = lvl; ws.getCell(fs, 10).value = tag; ws.getCell(fs, 11).value = ct;
          ws.getCell(fs, 1).font = { name: 'Calibri', size: 11, italic: true }; ws.getCell(fs, 2).font = { name: 'Calibri', size: 11, italic: true };
          ws.getCell(fs, 3).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0000FF' } };
          ws.getCell(fs, 3).fill = relleno(COL.cantidad);
          f.puntos.filter((p) => p.incl).forEach((p) => {
            const r = fila++; puntos++;
            ws.getCell(r, 2).value = p.p.n; ws.getCell(r, 2).alignment = { horizontal: 'right' };
            ws.getCell(r, 3).value = { formula: 'SUM(D' + r + ':H' + r + ')' };
            [p.p.ai, p.p.ao, p.p.di, p.p.do, p.p.int].forEach((v, k) => { if (v) ws.getCell(r, 4 + k).value = { formula: v + '*$C$' + fs }; });
            ws.getCell(r, 9).value = lvl; ws.getCell(r, 10).value = tag; ws.getCell(r, 11).value = ct;
            ws.getCell(r, 12).value = p.p.alm || ''; ws.getCell(r, 13).value = p.p.tend || ''; ws.getCell(r, 14).value = p.p.ifc || '';
            for (let k = 9; k <= 11; k++) ws.getCell(r, k).font = { name: 'Calibri', size: 10, color: { argb: 'FF7F7F7F' } };
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
      for (let r = 9; r <= fg; r++) for (let k = 1; k <= MAXC; k++) {
        const x = ws.getCell(r, k);
        if (!x.font) x.font = { name: 'Calibri', size: 11 };
        if (k !== 2 && !(x.alignment && x.alignment.horizontal)) x.alignment = { horizontal: 'center', vertical: 'middle' };
        x.border = { top: FINA, bottom: FINA, left: k === 1 ? MEDIA : FINA, right: k === MAXC ? MEDIA : FINA };
      }
      grupoFilas.forEach((r) => { for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(r, k); x.fill = relleno(COL.grupo); x.font = { name: 'Calibri', size: 11, bold: true }; x.border.top = MEDIA; } ws.getCell(r, 2).alignment = { horizontal: 'left', vertical: 'middle' }; });
      totales.forEach((r) => { for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(r, k); x.fill = relleno(COL.total); x.font = { name: 'Calibri', size: 11, bold: true }; x.border.bottom = MEDIA; } });
      for (let k = 1; k <= MAXC; k++) { const x = ws.getCell(fg, k); x.fill = relleno(COL.gran); x.font = { name: 'Calibri', size: 11, bold: true }; x.alignment = { horizontal: 'center', vertical: 'middle' }; x.border = { top: MEDIA, bottom: MEDIA, left: k === 1 ? MEDIA : FINA, right: k === MAXC ? MEDIA : FINA }; }
      ws.getRow(fg).height = 18;
      /* la tabla de la pestaña: rango con nombre ligado a la pestaña */
      wb.definedNames.add("'" + nombreHoja + "'!$A$7:$" + letra(MAXC) + '$' + fg, tabla);
      const nota = fg + 2;
      ws.getCell(nota, 1).value = 'Notas:'; ws.getCell(nota, 1).font = { bold: true };
      [
        'Un renglón por equipo del proyecto (nivel, tag y controlador); QTY = cantidad de equipos y se puede editar: cada punto se multiplica por esa cantidad.',
        'Analogue In/Out = AI/AO, Digital In/Out = DI/DO. INT = puntos que llegan por integración (gateway o red) y no ocupan canales del controlador.',
        'La tabla de esta pestaña se llama «' + tabla + '» (rango con nombre; en el cuadro de nombres de Excel se selecciona completa).'
      ].forEach((t, i) => { ws.getCell(nota + 1 + i, 1).value = '• ' + t; ws.getCell(nota + 1 + i, 1).font = { size: 9 }; });
      resumen.push({ hoja: nombreHoja, tabla, desc: d.sub, filas: equipos, puntos, gran: fg });
    });
    void usadas;
  }

  /* ---------- tablas de Excel planas (una por pestaña, con el nombre de la pestaña) ---------- */
  function tablaPlana(wb, resumen, nombre, desc, cols, rows, numericas) {
    const ws = wb.addWorksheet(nombre, { views: [{ state: 'frozen', ySplit: 6 }], pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.getCell('A2').value = 'BMS Point Schedule'; ws.getCell('A2').font = { name: 'Calibri', size: 22, bold: true };
    ws.getCell('A3').value = desc; ws.getCell('A3').font = { name: 'Calibri', size: 14, bold: true };
    ws.getCell('A4').value = 'Tabla: ' + nombre + ' · Proyecto: ' + (BMS.estado.proyecto.nombre || '—'); ws.getCell('A4').font = { size: 11, italic: true };
    ws.addTable({
      name: nombre, ref: 'A6', headerRow: true, totalsRow: !!numericas && rows.length > 0, style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: cols.map((n, i) => ({ name: n, filterButton: true, totalsRowFunction: numericas && numericas.includes(i) ? 'sum' : 'none', totalsRowLabel: numericas && i === 0 ? 'TOTAL' : undefined })),
      rows: rows.length ? rows : [cols.map(() => '')]
    });
    cols.forEach((n, i) => { ws.getColumn(i + 1).width = Math.max(10, Math.min(46, Math.max(n.length + 4, ...rows.slice(0, 200).map((r) => String(r[i] == null ? '' : r[i]).length + 2)))); });
    resumen.push({ hoja: nombre, tabla: nombre, desc, filas: rows.length, puntos: '' });
  }

  function indice(wb, titulo, resumen, P) {
    const ws0 = wb.getWorksheet('Indice') || wb.addWorksheet('Indice');
    ws0.columns = [{ width: 26 }, { width: 26 }, { width: 52 }, { width: 11 }, { width: 11 }];
    ws0.getCell('A2').value = titulo; ws0.getCell('A2').font = { size: 20, bold: true };
    ws0.getCell('A3').value = 'Proyecto: ' + (P.nombre || '—') + ' · Exportado: ' + new Date().toLocaleDateString('es-CR'); ws0.getCell('A3').font = { size: 12, italic: true };
    ['Pestaña', 'Tabla', 'Contenido', 'Renglones', 'Variables'].forEach((t, i) => { const x = ws0.getCell(5, i + 1); x.value = t; x.font = { bold: true }; x.fill = relleno(COL.grupo); x.alignment = { horizontal: 'center' }; x.border = { top: MEDIA, bottom: MEDIA, left: FINA, right: FINA }; });
    resumen.forEach((r, i) => {
      const f = 6 + i;
      ws0.getCell(f, 1).value = { text: r.hoja, hyperlink: "#'" + r.hoja + "'!A1" }; ws0.getCell(f, 1).font = { color: { argb: 'FF0563C1' }, underline: true };
      ws0.getCell(f, 2).value = r.tabla; ws0.getCell(f, 3).value = r.desc; ws0.getCell(f, 4).value = r.filas; ws0.getCell(f, 5).value = r.puntos;
      for (let k = 1; k <= 5; k++) { const x = ws0.getCell(f, k); x.border = { top: FINA, bottom: FINA, left: FINA, right: FINA }; if (k > 3) x.alignment = { horizontal: 'center' }; }
    });
  }

  function base() {
    const E = BMS.estado, C = BMS.calc, P = E.proyecto, res = C.todo(), mot = C.motor(res, P.marca);
    const wb = new ExcelJS.Workbook(); wb.creator = 'Sinergia Ingeniería'; wb.created = new Date();
    wb.addWorksheet('Indice');
    return { E, C, P, res, mot, wb, resumen: [] };
  }
  const guardar = async (wb, P, prefijo) => {
    const buf = await wb.xlsx.writeBuffer();
    BMS.descargar(prefijo + limpia(P.nombre) + '.xlsx', new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    return buf;
  };

  /* Módulo 3: equipos por nivel */
  BMS.exportarEquiposXlsx = async (soloBuffer) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const { E, C, P, res, wb, resumen } = base();
    hojasDisciplina(wb, res, C, E, P, resumen);
    const rows = C.filasOrdenadas(res).filter((f) => f.tipo && f.eq.qty > 0).map((f) => {
      const n = C.nivelDe(f.eq.nivel), cat = BMS.catEq.categorias.find((x) => x.id === f.tipo.cat);
      return [n ? n.codigo : '', n ? n.nombre : '', f.ref, f.eq.tag || '', f.tipo.nombre, cat ? cat.nombre : '', f.eq.qty, f.ctrlId ? C.nombreCtrl(C.ctrlDe(f.ctrlId)) : 'Sin asignar', f.t.ai, f.t.ao, f.t.di, f.t.do, f.t.int, C.cable(f.t) + f.t.int, f.eq.obs || ''];
    });
    tablaPlana(wb, resumen, 'Equipos_por_nivel', 'Equipos por nivel, con tag, controlador y puntos', ['Nivel', 'Nombre del nivel', 'Ref', 'Tag', 'Equipo', 'Sistema', 'Cantidad', 'Controlador', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total puntos', 'Observación'], rows, [6, 8, 9, 10, 11, 12, 13]);
    indice(wb, 'BMS Point Schedule — Equipos por nivel', resumen, P);
    if (soloBuffer) return wb.xlsx.writeBuffer();
    return guardar(wb, P, 'Equipos_por_nivel_');
  };

  /* Módulo 4: resumen */
  BMS.exportarResumenXlsx = async (soloBuffer) => {
    if (!window.ExcelJS) { alert('No se pudo cargar la librería de Excel (se necesita internet).'); return; }
    const { E, C, P, res, mot, wb, resumen } = base();
    const fila = (t) => { const rv = C.conReserva(t, P.reserva); return { ...t, cab: C.cable(t), res: C.cable(rv) }; };
    hojasDisciplina(wb, res, C, E, P, resumen);
    tablaPlana(wb, resumen, 'Resumen_Nivel', 'Resumen de variables por nivel', ['Nivel', 'Nombre', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Cableados con reserva'],
      E.niveles.map((n) => { const f = fila(res.porNivel[n.id]); return [n.codigo, n.nombre, f.eq, f.ai, f.ao, f.di, f.do, f.int, f.cab, f.res]; }), [2, 3, 4, 5, 6, 7, 8, 9]);
    tablaPlana(wb, resumen, 'Resumen_Controlador', 'Resumen de variables y selección por controlador', ['Controlador', 'Tipo', 'Nivel', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total cableados', 'Cableados con reserva', 'Marca', 'Selección', 'Verificación'],
      mot.detalle.map((d) => { const f = fila(d.t), n = C.nivelDe(d.c.nivel); const sel = d.cfg.base ? d.cfg.baseQty + '×' + d.cfg.base + Object.keys(d.cfg.modulos || {}).filter((k) => d.cfg.modulos[k]).map((k) => ' + ' + d.cfg.modulos[k] + '×' + k).join('') : ''; return [C.nombreCtrl(d.c), d.c.tipo === 'CP' ? 'Principal' : 'Secundario', n ? n.codigo : '', f.eq, f.ai, f.ao, f.di, f.do, f.int, f.cab, f.res, P.marca, sel, !f.cab ? 'Sin puntos' : d.ev.ok ? 'Cubre' : 'Faltan ' + d.ev.falta]; }), [3, 4, 5, 6, 7, 8, 9, 10]);
    const ctrls = E.controladores, m = {};
    res.filas.forEach((f) => { const k = f.eq.nivel + '|' + (f.ctrlId || '-'); m[k] = (m[k] || 0) + C.cable(f.t) + f.t.int; });
    if (ctrls.length) {
      const nombres = ctrls.map((c) => C.nombreCtrl(c));
      tablaPlana(wb, resumen, 'Nivel_x_Controlador', 'Puntos totales por nivel y controlador (incluye INT)', ['Nivel', ...nombres, 'Sin asignar'],
        E.niveles.map((n) => [n.codigo, ...ctrls.map((c) => m[n.id + '|' + c.id] || 0), m[n.id + '|-'] || 0]), nombres.map((_, i) => i + 1).concat([nombres.length + 1]));
    }
    tablaPlana(wb, resumen, 'Resumen_Sistema', 'Resumen de variables por sistema', ['Sistema', 'Equipos', 'AI', 'AO', 'DI', 'DO', 'INT', 'Total'],
      BMS.catEq.categorias.map((cat) => { const t = res.porCat[cat.id]; return [cat.nombre, t.eq, t.ai, t.ao, t.di, t.do, t.int, C.cable(t) + t.int]; }), [1, 2, 3, 4, 5, 6, 7]);
    indice(wb, 'BMS Point Schedule — Resumen de variables', resumen, P);
    if (soloBuffer) return wb.xlsx.writeBuffer();
    return guardar(wb, P, 'Resumen_variables_');
  };
})();
