/* Pestaña 6: secuencias de operación. Documento editable (portada + bloques) ligado en vivo al proyecto, exportable a Word en formato
   Sinergia con anexos generados desde el proyecto, importable desde Word, y validado contra el estándar del hotel. */
(function () {
  const { h, cut } = BMS;
  const num = (n) => Number(n || 0).toLocaleString('en-US');
  const NOMRED = { A: 'BACnet/IP', B: 'BACnet MS/TP', C: 'Modbus RTU', E: 'Modbus TCP/IP', D: 'Señales cableadas' };
  const TIPOS = [['h1', 'Título 1'], ['h2', 'Título 2'], ['p', 'Párrafo'], ['li', 'Viñeta'], ['tabla', 'Tabla'], ['vivo', 'En vivo (proyecto)']];
  const VIVOS = [['equipos', 'Lista de equipos del sistema'], ['puntos', 'Totales de puntos del sistema'], ['tabla', 'Tabla de equipos y puntos del sistema']];
  const ANEXOS = /^Anexo [A-Z]\.\s*(Diagrama unifilar|Resumen de variables|Lista de controladores|Variables por controlador|Validación contra el estándar)/i;
  BMS.esAnexoGenerado = (t) => ANEXOS.test(String(t).trim());

  /* Requisitos base del estándar Fairfield CALA, tomados del documento de secuencias. Reemplácelos por el texto del estándar del hotel. */
  const ESTANDAR_BASE = [
    '15A.15.A | El BAS es obligatorio si hay una planta central o VRF que atienda más de tres zonas con 300 000 Btu/h (50 t) o más, o sistemas con más de tres zonas y ventiladores de 10 hp o más',
    '15A.15 | Red BACnet/IP sobre Ethernet entre servidor, controladores y gateways; cliente web con usuario y contraseña por nivel de acceso y cierre automático de sesión por inactividad',
    '15A.15 | Servidor central con gráficos a color: una pantalla por equipo o zona, resumen por piso con color según la desviación de la temperatura respecto del setpoint',
    '15A.15 | Puerto de conexión para laptop en cada tablero de controladores para ajustar setpoints localmente',
    '15A.15 | UPS con 4 horas de respaldo para el servidor y los controladores, y 10 % de capacidad de reserva en puntos',
    '15A.15 | Todos los controladores, estaciones y componentes BACnet deben estar listados por BACnet Testing Laboratories (BTL)',
    '15A.15 | Servidor con procesador de cuatro núcleos, 6 GB de RAM y disco de 500 GB, capaz de guardar un año de tendencias',
    '15A.15 | Todo punto, horario, setpoint, tendencia y alarma se expone como objeto BACnet',
    '15A.15.B.1 | Lógica de demanda y reset: el BMS monitorea la demanda de zona y de sistema, detecta zonas que fuerzan el reset y permite al operador retirarlas del algoritmo',
    '15A.15.B.2.c | Cada comando tiene al menos un estado de retroalimentación',
    '15A.15.B.3.a | Cada entrada analógica tiene al menos una alarma alta y una baja; reserva de 10 % de puntos',
    '15A.15.B.3.b | Tendencias con retención de un año',
    '15A.15 | Alarmas con prioridad y reconocimiento: nivel, hora, usuario que reconoce y comentario obligatorio para el cierre',
    '15A.15 | Horarios semanales y calendario de excepciones, editables desde la interfaz web',
    '15A.15 | Pérdida de comunicación o de energía: puntos no confiables, alarma mayor y rearranque escalonado',
    '15A.16 | Pruebas de aceptación por un tercero según ASHRAE Guideline 202: todo el equipo central y una muestra estadística de las unidades terminales',
    '15A.9.G.8 | DOAS de 100 % aire exterior con recuperador de energía y ventiladores de velocidad variable; mantener el espacio a 24 °C y 50 % HR',
    '15A.9.K | GRMS: setpoints de habitación desocupada, cierre de compuertas de ventilación a los 20 min de desocupación e integración con el PMS',
    '15A.12.C | Tanque de combustible: nivel remoto, detección de fugas, monitoreo intersticial y protección contra sobrellenado; dimensionado para 8 horas a plena carga',
    '14.7 | Control de humo y presurización de escaleras: mínimo 12.5 Pa y fuerza de apertura de puertas no mayor a 133 N',
    '14.5 | Alarma de incendio: el BMS recibe las señales del FACP y no puede silenciarlas; las funciones de seguridad de vida las ejecuta el FACP',
    '15B.4 | Medición de agua: caudal y totalizador cada hora y alarma de fuga',
    '15A | Submedición eléctrica por tableros: HVAC, iluminación, fuerza, cocina y lavandería'
  ].join('\n');

  const inicial = () => ({ portada: ['', 'Secuencias de operación del BMS/BAS', '', '', ''], bloques: [], opciones: { b: true, c: true, d: true, e: true, f: true, detalle: false }, estandar: { nombre: 'Estándar Fairfield CALA (abril 2026)', texto: ESTANDAR_BASE } });

  /* ---------- ligado en vivo con el proyecto ---------- */
  const catDe = (id) => BMS.catEq.categorias.find((c) => c.id === id);
  const corto = (t) => String(t).replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  const sumaPuntos = (t) => `AI ${num(t.ai)}, AO ${num(t.ao)}, DI ${num(t.di)}, DO ${num(t.do)} e INT ${num(t.int)}`;
  function resolverTexto(txt) {
    if (txt == null || String(txt).indexOf('{{') < 0) return txt;
    const E = BMS.estado, P = E.proyecto, res = BMS.calc.todo();
    const mapa = { proyecto: P.nombre || 'el proyecto', ubicacion: P.ubicacion || '', marca: P.marca, reserva: P.reserva, niveles: E.niveles.length, controladores: E.controladores.length, equipos: res.total.eq, puntos: sumaPuntos(res.total), propietario: P.propietario || '' };
    return String(txt).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in mapa ? mapa[k] : m));
  }
  function resolverVivo(b) {
    const C = BMS.calc, res = C.todo(), cat = catDe(b.cat), nom = cat ? cat.nombre : 'sistema';
    const filas = res.filas.filter((f) => f.tipo && f.tipo.cat === b.cat && f.eq.qty > 0);
    if (!filas.length) return [{ t: 'p', texto: b.fuente === 'equipos' ? '**Equipos:** ningún equipo cargado todavía en «' + nom + '».' : 'Sin equipos cargados en «' + nom + '».' }];
    if (b.fuente === 'equipos') {
      const g = new Map(); filas.forEach((f) => { const o = g.get(f.tipo.id) || { t: f.tipo, qty: 0, tags: [] }; o.qty += f.eq.qty; if (f.eq.tag && !/-$/.test(f.eq.tag)) o.tags.push(f.eq.tag); g.set(f.tipo.id, o); });
      return [{ t: 'p', texto: '**Equipos:** ' + [...g.values()].map((o) => corto(o.t.nombre) + (o.tags.length ? ' (' + o.tags.slice(0, 3).join(', ') + ')' : '') + (o.qty > 1 ? ' ×' + o.qty : '')).join('; ') + '.' }];
    }
    const t = filas.reduce((a, f) => { ['ai', 'ao', 'di', 'do', 'int'].forEach((k) => (a[k] += f.t[k])); return a; }, C.vacio());
    if (b.fuente === 'puntos') return [{ t: 'p', texto: '**Puntos del sistema:** ' + sumaPuntos(t) + ' (' + num(C.cable(t) + t.int) + ' en total).' }];
    const g = new Map(); filas.forEach((f) => { const o = g.get(f.tipo.id) || { t: f.tipo, qty: 0, c: C.vacio(), tags: [] }; o.qty += f.eq.qty; ['ai', 'ao', 'di', 'do', 'int'].forEach((k) => (o.c[k] += f.t[k])); if (f.eq.tag && !/-$/.test(f.eq.tag)) o.tags.push(f.eq.tag); g.set(f.tipo.id, o); });
    return [{ t: 'p', texto: 'Tabla No. 0' }, { t: 'p', texto: 'Equipos y variables — ' + nom }, { t: 'tabla', total: true, cols: [6, 2, 1, 1, 1, 1, 1, 1], filas: [['Equipo', 'Tag(s)', 'Cant.', 'AI', 'AO', 'DI', 'DO', 'INT'], ...[...g.values()].map((o) => [corto(o.t.nombre), o.tags.slice(0, 3).join(', ') || '—', num(o.qty), num(o.c.ai), num(o.c.ao), num(o.c.di), num(o.c.do), num(o.c.int)]), ['Total', '—', num([...g.values()].reduce((a, o) => a + o.qty, 0)), num(t.ai), num(t.ao), num(t.di), num(t.do), num(t.int)]] }];
  }
  function resolverBloques(bloques) {
    const out = [];
    bloques.forEach((b) => {
      if (b.t === 'vivo') out.push(...resolverVivo(b));
      else if (b.t === 'tabla') out.push({ ...b, filas: b.filas.map((f) => f.map((c) => resolverTexto(c))) });
      else out.push({ ...b, texto: resolverTexto(b.texto) });
    });
    return out;
  }

  /* ---------- validación contra el estándar del hotel ---------- */
  const PARADAS = new Set('para como cada debe deben desde sobre entre este esta estos estas cuando donde segun tiene tienen sera seran puede pueden todo toda todos todas otros otras mismo misma hacia hasta tambien solo solamente cualquier'.split(' '));
  const raices = (t) => [...new Set(BMS.norm(t).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !PARADAS.has(w)).map((w) => w.slice(0, 6)))];
  const valoresDe = (t) => [...String(t).matchAll(/(\d+(?:[.,]\d+)?)\s?(%|horas?|h\b|min\b|s\b|°c|pa\b|n\b|ppm|psi|gpm|kw|btu\/h|btu|hp|gb|aÃ±os?|año|años)/gi)].map((m) => ({ txt: m[0], n: m[1].replace(',', '.'), u: m[2].toLowerCase().replace(/^horas?$/, 'h') }));
  const analizarEstandar = (texto) => String(texto || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l0, i) => {
    let l = l0;
    let ref = '', req;
    if (BMS.trad && BMS.trad.esIngles(l)) l = BMS.trad.aEs(l);
    req = l;
    if (l.includes('|')) { const k = l.indexOf('|'); ref = l.slice(0, k).trim(); req = l.slice(k + 1).trim(); }
    else { const m = /^(§?\s*\d[\w.\-]*)\s+(.*)$/.exec(l); if (m) { ref = m[1]; req = m[2]; } }
    return { n: i + 1, ref, req, orig: l0 };
  });

  function textoDelDocumento() {
    const S = BMS.estado.secuencias;
    /* los párrafos agregados por «Completar la secuencia» siguen pendientes (en rojo) y no cuentan como cobertura */
    const util = S.bloques.filter((b) => !/Redactar cómo la secuencia lo cumple/.test(b.texto || ''));
    const bl = resolverBloques(util);
    const propio = util.filter((b) => b.t !== 'vivo').map((b) => (b.t === 'tabla' ? b.filas.flat().join(' ') : b.texto || '')).join(' \n ');
    const todo = bl.map((b) => (b.t === 'tabla' ? b.filas.flat().join(' ') : b.texto || '')).join(' \n ');
    return { todo: BMS.norm(todo), propio: BMS.norm(propio), crudo: bl };
  }

  /* del estándar completo del hotel solo interesan los requisitos que tocan la operación y el control (secuencias, alarmas, horarios, setpoints, BMS…) */
  const TEMAS = ['secuenc', 'operaci', 'opera ', 'control', 'alarm', 'setpoint', 'set point', 'set-point', 'horari', 'bacnet', 'tendenc', 'reset', 'arranque', 'apagad', 'encendid', 'comando', 'retroaliment', 'monitor', 'bms', 'bas ', 'automatiz', 'ocupad', 'enclavamiento', 'interlock', 'prioridad', 'rearranque', 'modo ', 'sensor', 'calendario', 'deshabilit', 'habilit', 'supervis', 'grms', 'pms', 'lazo', 'pid', 'sequence', 'schedule', 'trend'];
  const VERBOS = /\b(debe|deben|deber[aá]|deber[aá]n|requiere|requieren|ser[aá]|ser[aá]n|se debe|shall|must|should|no podr[aá]|tendr[aá]|proveer|contar[aá]|permit)\b/i;
  function soloOperacion(lineas) {
    /* encabezados y pies de página (se repiten) y líneas duplicadas se descartan */
    const cuenta = new Map(); lineas.forEach((l) => { const k = l.replace(/\d+/g, '#'); cuenta.set(k, (cuenta.get(k) || 0) + 1); });
    const vistos = new Set();
    return lineas.filter((l) => {
      const k = l.replace(/\d+/g, '#'); if ((cuenta.get(k) >= 3 && l.length < 90) || vistos.has(l)) return false; vistos.add(l);
      const n = ' ' + BMS.norm(l) + ' ';
      if (n.length < 60) return false;
      const t = TEMAS.filter((k) => n.includes(k)).length;
      return t >= 3 || (t >= 1 && VERBOS.test(l));
    });
  }
  /* el documento se separa en dos: secuencias del BMS y secuencias del sistema de alarma contra incendio */
  const ES_INC = /incend|facp|humo|presuriz|rociador|sprinkler|nfpa|escalera|detecci[o]n de/;
  const docDe = (h1) => (h1.doc === 'inc' || h1.doc === 'bms' ? h1.doc : (!/^\s*Anexo\b/i.test(h1.texto || '') && ES_INC.test(BMS.norm(h1.texto || '')) ? 'inc' : 'bms'));
  const DOCS = { bms: 'Secuencias del BMS', inc: 'Secuencias de alarma contra incendio' };
  /* bloques de un documento: cada sección (Título 1 y su contenido) va al documento que le corresponde */
  function bloquesDe(bl, doc) {
    const out = []; let actual = 'bms';
    bl.forEach((b) => { if (b.t === 'h1') actual = docDe(b); if (actual === doc) out.push(b); });
    return out;
  }
  const MAX_REQ = 600; /* tope de requisitos revisados, para que un estándar muy largo no deje la página lenta */
  function validarCalc() {
    const E = BMS.estado, S = E.secuencias, P = E.proyecto, C = BMS.calc, res = C.todo(), mot = C.motor(res, P.marca);
    const doc = textoDelDocumento();
    const tdoc = new Set(raices(doc.todo)), compactoDoc = doc.todo.replace(/\s+/g, '').replace(/,/g, '.');
    const reqs = analizarEstandar(S.estandar && S.estandar.texto).slice(0, MAX_REQ).map((r) => {
      const rs = raices(r.req);
      const hit = rs.filter((x) => tdoc.has(x)), falt = rs.filter((x) => !tdoc.has(x));
      const vals = valoresDe(r.req);
      const UN = { h: ['h', 'hora', 'horas'], min: ['min', 'minuto', 'minutos'], 'año': ['ano', 'anos'], 'años': ['ano', 'anos'] };
      const hay = (v) => (UN[v.u] || [BMS.norm(v.u)]).some((u) => new RegExp('(?<![\d.])' + v.n.replace(/\./g, '\.') + u.replace(/[.*+?^${}()|[\]\\/]/g, '\$&')).test(compactoDoc));
      const sinVal = vals.filter((v) => !hay(v));
      const cob = rs.length ? hit.length / rs.length : 1;
      const estado = cob >= 0.6 && !sinVal.length ? 'ok' : cob >= 0.3 || (cob >= 0.6 && sinVal.length) ? 'parcial' : 'falta';
      const palabras = falt.slice(0, 8).map((x) => { const w = BMS.norm(r.req).split(/[^a-z0-9]+/).find((y) => y.slice(0, 6) === x); return w || x; });
      const obs = estado === 'ok' ? 'Cubierto en las secuencias.' : [palabras.length ? 'Sin tratar en las secuencias: ' + palabras.join(', ') + '.' : '', sinVal.length ? 'No aparece el valor del estándar: ' + sinVal.map((v) => v.txt).join(', ') + '.' : ''].filter(Boolean).join(' ');
      return { ...r, estado, cob, obs };
    });
    /* comprobaciones del proyecto */
    const pr = [];
    const add = (nivel, tema, obs) => pr.push({ nivel, tema, obs });
    if (Number(P.reserva) < 10) add('falta', 'Reserva de puntos', 'La reserva configurada es ' + P.reserva + ' % y el estándar pide 10 % (15A.15.B.3.a).');
    const sistemasConEq = BMS.catEq.categorias.filter((c) => res.filas.some((f) => f.tipo && f.tipo.cat === c.id && f.eq.qty > 0));
    sistemasConEq.forEach((c) => {
      const ras = raices(c.nombre).slice(0, 3);
      const titulos = BMS.norm(S.bloques.filter((b) => b.t === 'h1' || b.t === 'h2').map((b) => b.texto || '').join(' '));
      if (!ras.some((x) => titulos.includes(x))) add('falta', 'Sistema sin secuencia', 'El proyecto tiene equipos en «' + c.nombre + '» pero no hay una sección de secuencia con ese tema.');
    });
    const tipos = new Map(); res.filas.filter((f) => f.tipo && f.eq.qty > 0).forEach((f) => tipos.set(f.tipo.id, f.tipo));
    const sinDescribir = [...tipos.values()].filter((t) => { const ras = raices(corto(t.nombre)).slice(0, 2); return ras.length && !ras.some((x) => doc.propio.includes(x)); });
    if (sinDescribir.length) add('parcial', 'Equipos sin secuencia descrita', 'No se menciona en el texto de las secuencias: ' + sinDescribir.slice(0, 14).map((t) => corto(t.nombre)).join('; ') + (sinDescribir.length > 14 ? '; y ' + (sinDescribir.length - 14) + ' más' : '') + '.');
    const aiSinAlarma = [...tipos.values()].filter((t) => t.pts.some((p) => p.ai > 0 && !p.alm && !t.ip));
    if (aiSinAlarma.length) add('parcial', 'Entradas analógicas sin alarma', 'Cada entrada analógica debe tener alarma alta y baja (15A.15.B.3.a). Tipos con variables analógicas sin alarma definida: ' + aiSinAlarma.slice(0, 10).map((t) => corto(t.nombre)).join('; ') + (aiSinAlarma.length > 10 ? '; y ' + (aiSinAlarma.length - 10) + ' más' : '') + '.');
    const sinEstado = [...tipos.values()].filter((t) => t.pts.some((p) => p.do > 0) && !t.pts.some((p) => p.di > 0 || p.ai > 0 || p.int > 0));
    if (sinEstado.length) add('parcial', 'Comandos sin retroalimentación', 'Cada comando debe tener un estado (15A.15.B.2.c). Equipos con comando y sin estado: ' + sinEstado.slice(0, 10).map((t) => corto(t.nombre)).join('; ') + '.');
    const corchetes = []; S.bloques.forEach((b) => { const t = b.t === 'tabla' ? b.filas.flat().join(' ') : b.texto || ''; (t.match(/\[[^\]]{1,60}\]/g) || []).forEach((m) => corchetes.push(m)); });
    if (corchetes.length) add('parcial', 'Valores propuestos por validar', corchetes.length + ' valores entre corchetes [ ] pendientes de validar por el diseñador (por ejemplo ' + [...new Set(corchetes)].slice(0, 5).join(', ') + ').');
    /* la validación se limita a temas de secuencias de operación; el dimensionamiento de controladores se revisa en la pestaña Controladores */
    if (!S.bloques.length) add('falta', 'Secuencias vacías', 'Todavía no hay secuencias redactadas.');
    const cuenta = (a) => a.reduce((x, r) => { x[r.estado || r.nivel] = (x[r.estado || r.nivel] || 0) + 1; return x; }, { ok: 0, parcial: 0, falta: 0 });
    return { reqs, pr, cuentaReqs: cuenta(reqs), cuentaPr: cuenta(pr) };
  }
  /* el estándar y el documento solo se vuelven a analizar cuando cambian (o con «Revalidar»); abrir la pestaña reutiliza el último resultado */
  const hash = (t) => { let x = 5381; for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0; return t.length + ':' + x; };
  let cacheVal = null;
  function validar(forzar) {
    const E = BMS.estado, S = E.secuencias;
    const clave = hash((S.estandar && S.estandar.texto) || '') + '|' + hash(textoDelDocumento().todo) + '|' + hash(JSON.stringify([E.proyecto, E.niveles, E.controladores, E.equipos, S.bloques.length]));
    if (!forzar && cacheVal && cacheVal.clave === clave) return cacheVal.val;
    const val = validarCalc(); cacheVal = { clave, val }; return val;
  }
  const chipDe = (e) => h('span', { class: 'chip ' + (e === 'ok' ? 'ok' : e === 'parcial' ? 'warn' : 'bad') }, e === 'ok' ? 'Cumple' : e === 'parcial' ? 'Parcial' : 'No cumple / falta');

  /* ---------- anexos generados desde el proyecto ---------- */
  const svgAPartes = (svg, escala) => new Promise((resolve, reject) => {
    const vb = svg.viewBox.baseVal, W = vb.width, H = vb.height;
    svg.setAttribute('width', W * escala); svg.setAttribute('height', H * escala);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = async () => {
      try {
        const n = Math.max(1, Math.ceil(H / (W * 0.62))), sliceH = Math.ceil(H / n), partes = [];
        for (let i = 0; i < n; i++) {
          const y0 = i * sliceH, hh = Math.min(sliceH, H - y0);
          const c = document.createElement('canvas'); c.width = W * escala; c.height = Math.round(hh * escala);
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(img, 0, y0 * escala, W * escala, hh * escala, 0, 0, W * escala, hh * escala);
          const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
          partes.push({ png: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height });
        }
        URL.revokeObjectURL(url); resolve(partes);
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('No se pudo convertir el diagrama a imagen.'));
    img.src = url;
  });

  async function generarAnexos(op, letra0) {
    const E = BMS.estado, P = E.proyecto, C = BMS.calc;
    const res = C.todo(), mot = C.motor(res, P.marca), M = BMS.catCt.marcas[P.marca];
    const out = [{ t: 'horizontal' }]; let L = letra0, primero = true;
    const anexo = (titulo, intro) => { if (!primero) out.push({ t: 'salto' }); primero = false; out.push({ t: 'h1', texto: 'Anexo ' + String.fromCharCode(65 + L++) + '. ' + titulo }); if (intro) out.push({ t: 'p', texto: intro }); };
    const cab = ['AI', 'AO', 'DI', 'DO', 'INT'];
    const fila5 = (t) => [t.ai, t.ao, t.di, t.do, t.int].map(num);
    const totalizar = (ts) => ts.reduce((a, t) => { ['ai', 'ao', 'di', 'do', 'int', 'eq'].forEach((k) => (a[k] += t[k])); return a; }, C.vacio());
    const detMap = Object.fromEntries(mot.detalle.map((x) => [x.c.id, x]));

    if (op.b) {
      anexo('Diagrama unifilar del sistema de monitoreo y control', 'Lámina generada con los niveles, controladores, equipos y comunicaciones del proyecto. Se presenta en partes a ancho de hoja para su lectura; el archivo editable (SVG y DXF) se obtiene en la herramienta de la matriz de puntos.');
      const partes = await svgAPartes(BMS.diag.construir(), 2);
      partes.forEach((p, i) => { if (i) out.push({ t: 'salto' }); out.push({ t: 'imagen', ...p, pie: 'Figura No. ' + (i + 1) + ' — Diagrama unifilar del BMS, parte ' + (i + 1) + ' de ' + partes.length }); });
    }
    if (op.c) {
      anexo('Resumen de variables y totales por nivel', 'Las cantidades corresponden a la Matriz de Puntos del proyecto. AI y AO son entradas y salidas analógicas, DI y DO son digitales; INT son puntos que llegan por integración de red o gateway y no ocupan canales del controlador. La reserva aplicada a los puntos cableados es del ' + P.reserva + ' %.');
      const cats = BMS.catEq.categorias.filter((c) => res.porCat[c.id] && res.porCat[c.id].filas);
      const tc = totalizar(cats.map((c) => res.porCat[c.id]));
      out.push({ t: 'tabla', titulo: 'Resumen de variables por sistema', cols: [5, 1, 1, 1, 1, 1, 1, 1.2], filas: [['Sistema', 'Equipos', ...cab, 'Total'], ...cats.map((c) => { const t = res.porCat[c.id]; return [c.nombre, num(t.eq), ...fila5(t), num(C.cable(t) + t.int)]; }), ['Total del proyecto', num(tc.eq), ...fila5(tc), num(C.cable(tc) + tc.int)]], total: true });
      const lv = E.niveles.filter((n) => res.porNivel[n.id] && res.porNivel[n.id].filas);
      const tl = totalizar(lv.map((n) => res.porNivel[n.id]));
      out.push({ t: 'tabla', titulo: 'Totales de variables por nivel', nota: 'Nota: "Cableados" suma AI, AO, DI y DO; "Con reserva" aplica el ' + P.reserva + ' % de reserva a cada tipo de canal.', cols: [4, 1, 1, 1, 1, 1, 1, 1.4, 1.4], filas: [['Nivel', 'Equipos', ...cab, 'Cableados', 'Con reserva'], ...lv.map((n) => { const t = res.porNivel[n.id]; return [n.codigo + ' — ' + n.nombre, num(t.eq), ...fila5(t), num(C.cable(t)), num(C.cable(C.conReserva(t, P.reserva)))]; }), ['Total', num(tl.eq), ...fila5(tl), num(C.cable(tl)), num(C.cable(C.conReserva(tl, P.reserva)))]], total: true });
      const porTipo = new Map();
      res.filas.filter((f) => f.tipo && f.eq.qty > 0).forEach((f) => { const o = porTipo.get(f.tipo.id) || { tipo: f.tipo, t: C.vacio(), qty: 0 }; o.qty += f.eq.qty; ['ai', 'ao', 'di', 'do', 'int'].forEach((k) => (o.t[k] += f.t[k])); porTipo.set(f.tipo.id, o); });
      const lt = [...porTipo.values()].sort((a, b) => a.tipo.nombre.localeCompare(b.tipo.nombre, 'es'));
      const tt = totalizar(lt.map((o) => ({ ...o.t, eq: o.qty })));
      out.push({ t: 'tabla', titulo: 'Lista de variables resumida por tipo de equipo', cols: [6, 1, 1, 1, 1, 1, 1, 1.2], filas: [['Equipo', 'Cant.', ...cab, 'Total'], ...lt.map((o) => [o.tipo.nombre, num(o.qty), ...fila5(o.t), num(C.cable(o.t) + o.t.int)]), ['Total', num(tt.eq), ...fila5(tt), num(C.cable(tt) + tt.int)]], total: true });
    }
    if (op.d) {
      anexo('Lista de controladores y dispositivos', 'Controladores con el modelo seleccionado para la marca ' + P.marca + ', dispositivos de red e integraciones, y lista de materiales de controladores y módulos. Los modelos se validan con el integrador antes de emitir.');
      const resumenCfg = (cfg) => (cfg.base ? cfg.baseQty + '× ' + cfg.base + Object.keys(cfg.modulos || {}).filter((k) => cfg.modulos[k]).map((k) => ' + ' + cfg.modulos[k] + '× ' + k).join('') : 'Sin hardware (solo integración)');
      out.push({ t: 'tabla', titulo: 'Controladores del sistema', cols: [2.2, 1, 1.2, 2.2, 1.6, 4.4, 1.2, 1.2], filas: [['Controlador', 'Tipo', 'Nivel', 'Cuarto / ubicación', 'Panel', 'Modelo y módulos', 'Cableados', 'Con reserva'],
        ...mot.detalle.map((d) => { const n = C.nivelDe(d.c.nivel); return [C.nombreCtrl(d.c), d.c.tipo === 'CP' ? 'Principal' : 'Secundario', n ? n.codigo : '—', d.c.ubicacion || '—', (E.gabDim && E.gabDim[C.gabDe(d.c) || d.c.id]) || C.panelSugerido(C.unidadesPanel(d.c, detMap)), resumenCfg(d.cfg), num(C.cable(d.t)), num(C.cable(d.req))]; })] });
      const disp = [];
      if (mot.motor) disp.push([mot.motor.cod + ' — ' + (mot.motor.desc || 'motor de red'), 'Motor de red / supervisor', '1', '—', '—']);
      BMS.diag.gateways(res, C.nivelDe).forEach((g) => disp.push([g.gw + ' (' + g.items.map((i) => corto(i.tipo.nombre)).join(', ') + ')', 'Gateway ' + NOMRED[g.clave], '1', [...new Set(g.items.flatMap((i) => [...i.niv]))].join(', ') || '—', num(g.items.reduce((a, i) => a + i.ints, 0))]));
      BMS.diag.paneles(res, C.nivelDe).forEach((p) => disp.push([corto(p.tipo.nombre) + (p.tags.length ? ' (' + p.tags.slice(0, 3).join(', ') + ')' : ''), 'Equipo de red ' + NOMRED[p.clave], num(p.qty), [...p.niv].join(', ') || '—', num(p.int)]));
      out.push({ t: 'tabla', titulo: 'Dispositivos de red e integraciones', cols: [6, 3, 1, 2, 1.4], filas: [['Dispositivo', 'Tipo y protocolo', 'Cant.', 'Niveles', 'Puntos INT'], ...(disp.length ? disp : [['—', '—', '—', '—', '—']])] });
      const bom = Object.keys(mot.bom || {}).map((cod) => { const m = M && (M.bases.find((x) => x.cod === cod) || M.modulos.find((x) => x.cod === cod)); return [cod, m ? m.desc.replace(/\s*\[.*?\]/g, '') : '—', M && M.bases.some((x) => x.cod === cod) ? 'Controlador' : 'Módulo', num(mot.bom[cod])]; });
      if (mot.motor) bom.push([mot.motor.cod, mot.motor.desc || '—', 'Motor de red', '1']);
      const cajas = new Map(); const vistos = new Set();
      mot.detalle.forEach((d) => { const k = C.gabDe(d.c) || d.c.id; if (vistos.has(k)) return; vistos.add(k); const dim = (E.gabDim && E.gabDim[k]) || C.panelSugerido(C.unidadesPanel(d.c, detMap)); cajas.set(dim, (cajas.get(dim) || 0) + 1); });
      [...cajas.entries()].forEach(([dim, q]) => bom.push([dim, C.panelModelo(dim), 'Caja', String(q)]));
      out.push({ t: 'tabla', titulo: 'Lista de controladores y módulos', cols: [3, 7, 2, 1], filas: [['Código', 'Descripción', 'Tipo', 'Cant.'], ...(bom.length ? bom : [['—', '—', '—', '—']])] });
    }
    if (op.e) {
      anexo('Variables por controlador', 'Equipos y variables asignados a cada controlador. Los equipos marcados como "(red)" se conectan por BACnet, Modbus o gateway: sus variables son internas del equipo y se cuentan como INT.');
      mot.detalle.forEach((d) => {
        const filas = res.filas.filter((f) => f.ctrlId === d.c.id && f.tipo && f.eq.qty > 0);
        if (!filas.length) return;
        const n = C.nivelDe(d.c.nivel);
        out.push({ t: 'h2', texto: C.nombreCtrl(d.c) + ' — ' + (n ? n.codigo + ' · ' + n.nombre : '') });
        const tt = totalizar(filas.map((f) => f.t));
        out.push({ t: 'tabla', titulo: 'Equipos y puntos de ' + C.nombreCtrl(d.c), cols: [6, 2, 1, 1, 1, 1, 1, 1], filas: [['Equipo', 'Tag(s)', 'Cant.', ...cab], ...filas.map((f) => [corto(f.tipo.nombre) + (f.ip || f.tipo.gw ? ' (red)' : ''), f.eq.tag || '—', num(f.eq.qty), ...fila5(f.t)]), ['Total', '—', num(tt.eq), ...fila5(tt)]], total: true });
        if (op.detalle) {
          const rows = [];
          filas.forEach((f) => f.puntos.filter((p) => p.incl).forEach((p) => ['ai', 'ao', 'di', 'do', 'int'].forEach((k, ki) => { if (p[k] > 0) rows.push([corto(f.tipo.nombre) + (f.eq.tag ? ' ' + f.eq.tag : ''), p.p.n, cab[ki], num(p[k])]); })));
          if (rows.length) out.push({ t: 'tabla', titulo: 'Variables de ' + C.nombreCtrl(d.c), cols: [4, 6, 1, 1], filas: [['Equipo', 'Variable', 'Clase', 'Cant.'], ...rows] });
        }
      });
    }
    if (op.f) {
      const v = validar(), S = E.secuencias;
      anexo('Validación contra el estándar del hotel', 'Revisión de las secuencias y del proyecto contra «' + ((S.estandar && S.estandar.nombre) || 'el estándar del hotel') + '». La revisión de requisitos compara términos y valores del estándar con el texto de las secuencias; no reemplaza la validación del diseñador. Cumple: ' + v.cuentaReqs.ok + ' · Parcial: ' + v.cuentaReqs.parcial + ' · No cumple o falta: ' + v.cuentaReqs.falta + '.');
      const nom = (e) => (e === 'ok' ? 'Cumple' : '!!' + (e === 'parcial' ? 'Parcial' : 'No cumple / falta') + '!!');
      const rojo = (e, t) => (e === 'ok' || !t ? t : '!!' + t + '!!');
      if (v.reqs.length) out.push({ t: 'tabla', titulo: 'Requisitos del estándar frente a las secuencias', cols: [1.4, 6, 1.4, 6], filas: [['Referencia', 'Requisito del estándar', 'Estado', 'Observación'], ...v.reqs.map((r) => [r.ref || '—', r.req, nom(r.estado), rojo(r.estado, r.obs)])] });
      out.push({ t: 'tabla', titulo: 'Comprobaciones del proyecto', cols: [4, 1.4, 9], filas: [['Tema', 'Estado', 'Observación'], ...(v.pr.length ? v.pr.map((r) => [r.tema, nom(r.nivel), rojo(r.nivel, r.obs)]) : [['Sin observaciones', 'Cumple', 'No se encontraron diferencias.']])] });
    }
    return out;
  }
  const letraSiguiente = (bloques) => { let m = 0; bloques.forEach((b) => { const x = b.t === 'h1' ? /^Anexo ([A-Z])\./i.exec(b.texto) : null; if (x) m = Math.max(m, x[1].toUpperCase().charCodeAt(0) - 64); }); return m; };

  /* ---------- estructura base desde el proyecto (con bloques en vivo) ---------- */
  function estructuraBase() {
    const E = BMS.estado, P = E.proyecto, res = BMS.calc.todo();
    const b = [];
    const portada = ['{{proyecto}} — {{ubicacion}}', 'Secuencias de operación del BMS/BAS', 'Documento complementario a la Matriz de Puntos', [P.preparado || 'Sinergia Ingeniería', P.fecha, P.estado].filter(Boolean).join(' · '), 'Los valores entre corchetes [ ] son propuestas iniciales que debe validar el diseñador mecánico o eléctrico antes de emitir.'];
    b.push({ t: 'h1', texto: '0. Alcance, referencias y arquitectura' }, { t: 'h2', texto: '0.1 Alcance' }, { t: 'p', texto: 'Este documento describe cómo opera cada sistema monitoreado o controlado por el BMS de {{proyecto}}: {{equipos}} equipos con {{puntos}}. Los números de punto corresponden a la Matriz de Puntos y cada sección lleva su referencia SOO-n.' });
    b.push({ t: 'h2', texto: '0.2 Referencias' }, { t: 'li', texto: '[Estándar del propietario, edición]' }, { t: 'li', texto: 'ASHRAE 135 (BACnet) y ASHRAE Guideline 36.' });
    b.push({ t: 'h2', texto: '0.3 Arquitectura general' }, { t: 'li', texto: 'Red BACnet/IP sobre Ethernet entre servidor, controlador principal y gateways; troncal BACnet MS/TP entre controladores. {{controladores}} controladores en {{niveles}} niveles; marca {{marca}}.' }, { t: 'li', texto: 'UPS con 4 horas de respaldo para el servidor y los controladores, y {{reserva}} % de capacidad de reserva en puntos.' });
    b.push({ t: 'h2', texto: '0.4 Prioridad de comandos' }, { t: 'p', texto: 'De mayor a menor: (1) seguridad de vida desde el FACP, (2) selector HOA local en el equipo, (3) protecciones del equipo, (4) modo emergencia del BMS, (5) comandos manuales del operador, (6) horarios y lazos automáticos. Un nivel superior siempre anula al inferior.' });
    b.push({ t: 'h2', texto: '0.5 Criterios generales de alarma y tendencia' }, { t: 'li', texto: 'Cada entrada analógica tiene al menos una alarma alta y una baja; cada comando tiene al menos un estado de retroalimentación.' }, { t: 'li', texto: 'Alarmas en tres niveles: crítica, mayor y aviso.' }, { t: 'li', texto: 'Tendencias: 15 min para temperaturas y humedades, 1 h para medición y filtros, y por cambio de valor para estados; retención de un año.' });
    let n = 0;
    BMS.catEq.categorias.forEach((cat) => {
      if (!res.filas.some((x) => x.tipo && x.tipo.cat === cat.id && x.eq.qty > 0)) return;
      n++;
      b.push({ t: 'h1', texto: 'SOO-' + n + '. ' + cat.nombre }, { t: 'vivo', fuente: 'equipos', cat: cat.id }, { t: 'vivo', fuente: 'puntos', cat: cat.id },
        { t: 'li', texto: '**Habilitación y horario:** [por definir].' }, { t: 'li', texto: '**Control:** [por definir].' }, { t: 'li', texto: '**Alarmas:** [por definir].' });
    });
    b.push({ t: 'h1', texto: 'Anexo A. Parámetros por confirmar' }, { t: 'p', texto: 'Tabla No. 1' }, { t: 'p', texto: 'Parámetros por confirmar antes de emitir' }, { t: 'tabla', filas: [['Parámetro', 'Valor propuesto', 'Quien valida'], ['—', '—', '—']] });
    return { portada, bloques: b };
  }

  /* complementa las secuencias existentes con la estructura base: agrega solo lo que falta (secciones, subsecciones y bloques vivos) y no toca el texto ya escrito */
  function complementar(S) {
    const base = estructuraBase();
    const clave = (t) => BMS.norm(String(t || '').replace(/^\s*(SOO-\d+|Anexo [A-Z]|\d+(\.\d+)*)[.\s]+/i, '')).replace(/[^a-z0-9]+/g, ' ').trim();
    const mismo = (a, b) => { const x = clave(a), y = clave(b); if (x === y) return true; const rx = raices(x), ry = raices(y); if (!rx.length || !ry.length) return false; const c = rx.filter((r) => ry.includes(r)).length; return c / Math.min(rx.length, ry.length) >= 0.6; };
    const secciones = (bl) => { const out = []; bl.forEach((b) => { if (b.t === 'h1' || !out.length) out.push({ h: b.t === 'h1' ? b : null, b: b.t === 'h1' ? [] : [b] }); else out[out.length - 1].b.push(b); }); return out; };
    const subs = (bl) => { const out = []; bl.forEach((b) => { if (b.t === 'h2' || !out.length) out.push({ h: b.t === 'h2' ? b : null, b: [b] }); else out[out.length - 1].b.push(b); }); return out; };
    const ex = secciones(S.bloques), nuevas = [], cuenta = { secciones: 0, subsecciones: 0, vivos: 0 };
    const llave = (b) => b.t === 'vivo' ? 'vivo:' + b.fuente + ':' + b.cat + ':' + (b.fuente === 'tabla' ? 1 : 0) : '';
    secciones(base.bloques).forEach((sb) => {
      const e = sb.h && ex.find((x) => x.h && mismo(x.h.texto, sb.h.texto));
      if (!e) { nuevas.push(sb); cuenta.secciones++; return; }
      const tiene = new Set(e.b.map(llave).filter(Boolean));
      const faltan = sb.b.filter((b) => b.t === 'vivo' && !tiene.has(llave(b)));
      if (faltan.length) { e.b = [...faltan, ...e.b]; cuenta.vivos += faltan.length; }
      const yaSub = e.b.filter((b) => b.t === 'h2').map((b) => b.texto);
      subs(sb.b.filter((b) => b.t !== 'vivo')).filter((g) => g.h && !yaSub.some((t) => mismo(t, g.h.texto))).forEach((g) => { e.b.push(...g.b); cuenta.subsecciones++; });
    });
    /* las secciones nuevas van antes del primer anexo del documento, o al final si no hay */
    let corte = ex.findIndex((x) => x.h && /^\s*Anexo\b/i.test(x.h.texto)); if (corte < 0) corte = ex.length;
    const salida = [...ex.slice(0, corte), ...nuevas.filter((x) => !/^\s*Anexo\b/i.test(x.h.texto)), ...ex.slice(corte), ...nuevas.filter((x) => /^\s*Anexo\b/i.test(x.h.texto) && !ex.some((y) => y.h && mismo(y.h.texto, x.h.texto)))];
    S.bloques = salida.flatMap((x) => (x.h ? [x.h] : []).concat(x.b));
    S.portada = (S.portada || []).concat(['', '', '', '', '']).slice(0, 5).map((v, i) => (String(v || '').trim() ? v : base.portada[i] || ''));
    return cuenta;
  }

  /* ---------- biblioteca de redacción: párrafos de secuencia en español para los temas habituales del estándar del hotel ----------
     Cada entrada se activa por palabras clave (en español o inglés) y toma del requisito los valores con unidad (minutos, %, °C, Pa…),
     que quedan en rojo para validarlos contra los datos del diseño. */
  const BIBLIOTECA = [
    { k: ['unoccupied', 'purge', 'desocupad', 'ciclo de purga', 'outside air and exhaust'], es: 'Cuando la habitación permanece desocupada durante 20 minutos, el controlador de habitación cierra automáticamente las compuertas de aire exterior y de extracción y la habitación ejecuta un ciclo de purga de 1 hora. Mientras está desocupada, la temperatura y la humedad se mantienen en los valores de habitación desocupada y, al detectar ocupación, se restablece el modo normal.' },
    { k: ['room controller', 'controlador de habitaci', 'key card', 'tarjeta de acceso', 'occupancy based', 'master lighting'], es: 'El controlador de habitación regula la temperatura, la ventilación mediante las compuertas de aire de reposición y de extracción, y la humedad, según la ocupación. Si el código lo exige, comanda también el relé maestro de iluminación por ocupación. Recibe del PMS el estado de renta y el de la cerradura de la puerta de entrada, está en red con el BMS y con la consola del operador del hotel, y no se permiten ranuras de tarjeta de acceso.' },
    { k: ['doas', '100 % outside', '100% outside', 'energy recovery', 'recuperador', 'dedicated outdoor'], es: 'La unidad de aire exterior dedicado (DOAS) opera con 100 % de aire exterior y recuperador de energía, con ventiladores de velocidad variable. El BMS mantiene el espacio a 24 °C y 50 % de humedad relativa, modula la velocidad de los ventiladores y la recuperación de energía, y genera alarma ante falla de ventilador, filtro sucio o temperatura de suministro fuera de rango.' },
    { k: ['demand', 'reset', 'demanda'], es: 'El BMS monitorea la demanda de cada zona y de cada sistema, detecta las zonas que fuerzan el reset del setpoint de suministro y permite al operador retirarlas del algoritmo. El reset se limita a los valores máximo y mínimo definidos por el diseño.' },
    { k: ['feedback', 'retroaliment', 'command status'], es: 'Cada comando tiene al menos un estado de retroalimentación. Cuando el estado no coincide con el comando después del retardo definido, el BMS genera una alarma de falla de comando.' },
    { k: ['analog input', 'entrada anal', 'high and low alarm', 'alarma alta'], es: 'Cada entrada analógica tiene al menos una alarma alta y una baja, con retardo y prioridad configurables. El BMS reserva 10 % de capacidad de puntos para ampliaciones.' },
    { k: ['trend', 'tendencia', 'history', 'historial'], es: 'El BMS registra tendencias de todas las variables analógicas y de los estados, con retención de 1 año, y las muestra en gráficos que el operador puede exportar.' },
    { k: ['alarm priority', 'prioridad de alarma', 'acknowledge', 'reconocimiento', 'alarms shall'], es: 'Las alarmas se clasifican por prioridad y se presentan con nivel, hora, usuario que las reconoce y comentario obligatorio para el cierre. Las alarmas críticas se notifican de inmediato al operador del hotel.' },
    { k: ['schedule', 'calendar', 'horario', 'calendario'], es: 'Los horarios semanales y el calendario de excepciones se editan desde la interfaz web del BMS, con prioridad configurable y retorno automático al horario normal al terminar la excepción.' },
    { k: ['loss of communication', 'loss of power', 'pérdida de comunicaci', 'perdida de energ', 'power failure'], es: 'Ante la pérdida de comunicación o de energía, los puntos afectados se marcan como no confiables, el BMS genera una alarma mayor y, al restablecerse la energía, los equipos rearrancan de forma escalonada para limitar la demanda.' },
    { k: ['ups', 'uninterruptible', 'backup power', 'respaldo'], es: 'El servidor y los controladores cuentan con UPS de 4 horas de respaldo. El BMS avisa al operar en batería y genera alarma mayor por falla o batería baja.' },
    { k: ['server', 'servidor', 'graphics', 'gráficos', 'workstation', 'web client', 'cliente web', 'password', 'contraseña'], es: 'El servidor central del BMS ofrece gráficos a color, una pantalla por equipo o zona y un resumen por piso con color según la desviación de la temperatura respecto del setpoint. El acceso del cliente web es por usuario y contraseña con niveles de acceso, y la sesión se cierra automáticamente por inactividad.' },
    { k: ['laptop', 'portátil', 'portatil', 'service port', 'puerto de conexi'], es: 'Cada tablero de controladores cuenta con un puerto de conexión para laptop que permite ajustar los setpoints y revisar el estado localmente.' },
    { k: ['bacnet', 'btl', 'object', 'objeto'], es: 'La red es BACnet/IP sobre Ethernet entre servidor, controladores y gateways. Todo punto, horario, setpoint, tendencia y alarma se expone como objeto BACnet, y los controladores, estaciones y componentes están listados por BACnet Testing Laboratories (BTL).' },
    { k: ['fuel', 'combustible', 'tank', 'tanque', 'overfill', 'sobrellenado', 'interstitial'], es: 'El BMS monitorea el nivel remoto del tanque de combustible, la detección de fugas, el monitoreo intersticial y la protección contra sobrellenado, con autonomía de 8 horas a plena carga, y genera alarma por nivel bajo, fuga o sobrellenado.' },
    { k: ['smoke', 'humo', 'stair', 'escalera', 'pressurization', 'presuriz'], es: 'Ante una señal del FACP, el sistema de control de humo presuriza las escaleras a un mínimo de 12.5 Pa, con una fuerza de apertura de puertas no mayor a 133 N. El BMS supervisa los estados y las alarmas, y no puede anular las funciones de seguridad de vida.' },
    { k: ['facp', 'fire alarm', 'alarma de incendio', 'life safety', 'seguridad de vida'], es: 'El BMS recibe las señales del FACP y no puede silenciarlas ni reponerlas; las funciones de seguridad de vida las ejecuta el FACP. Ante una alarma de incendio, el BMS detiene los equipos definidos en la matriz causa-efecto y registra el evento.' },
    { k: ['water meter', 'medición de agua', 'water consumption', 'flow totalizer', 'leak alarm'], es: 'El BMS mide el caudal de agua con totalizador cada hora y genera alarma de fuga cuando detecta consumo continuo fuera de horario.' },
    { k: ['submeter', 'submedici', 'electrical meter', 'energy meter', 'medidor de energ'], es: 'El BMS registra la submedición eléctrica por tableros de HVAC, iluminación, fuerza, cocina y lavandería, con demanda y consumo cada hora.' },
    { k: ['ashrae guideline 202', 'commissioning', 'acceptance test', 'pruebas de aceptaci', 'third party', 'tercero'], es: 'Las pruebas de aceptación las realiza un tercero según ASHRAE Guideline 202, sobre todo el equipo central y una muestra estadística de las unidades terminales.' },
    { k: ['required if', 'central plant', 'planta central', 'bas is required', 'bas es obligatorio'], es: 'El BAS es obligatorio si hay una planta central o un VRF que atienda más de tres zonas con 300 000 Btu/h (50 t) o más, o sistemas con más de tres zonas y ventiladores de 10 hp o más.' }
  ];
  /* pone en el párrafo de la biblioteca los valores que trae el requisito (misma unidad) y los marca en rojo para validarlos */
  function aplicarValores(es, reqOriginal) {
    const vals = [...String(reqOriginal).matchAll(BMS.trad.NUM_UN)].map((m) => ({ n: m[1], u: m[2].toLowerCase().replace(/^(hours?|horas?|h)$/, 'h').replace(/^(minutes?|minutos?|min)$/, 'min').replace(/^(years?|años?)$/, 'a'), txt: m[0] }));
    const usados = new Set();
    return es.replace(BMS.trad.NUM_UN, (m, n, u) => {
      const uk = u.toLowerCase().replace(/^(hours?|horas?|h)$/, 'h').replace(/^(minutes?|minutos?|min)$/, 'min').replace(/^(years?|años?)$/, 'a');
      const i = vals.findIndex((v, j) => !usados.has(j) && v.u === uk);
      if (i >= 0) { usados.add(i); return '!!' + vals[i].n + m.slice(n.length) + '!!'; }
      return '!!' + m + '!!';
    });
  }
  function redactarRequisito(reqEs, reqOriginal) {
    const base = (reqOriginal || reqEs), low = BMS.norm(base) + ' ' + BMS.norm(reqEs);
    let mejor = null, pm = 0;
    BIBLIOTECA.forEach((e) => { const sc = e.k.filter((k) => low.includes(BMS.norm(k))).length; if (sc > pm) { pm = sc; mejor = e; } });
    if (mejor && pm >= 1) return aplicarValores(mejor.es, base);
    return null;
  }

  /* convierte un requisito del estándar en un párrafo de secuencia en español; los valores del estándar quedan en rojo para validarlos con el diseño */
  function redactar(req) {
    let t = String(req).replace(/\s+/g, ' ').trim().replace(/^[a-z]\.\s+/i, '');
    t = t.replace(/\b(\p{L}+s)\s+(también\s+|automáticamente\s+)?debe\b/giu, (m, a, b) => a + ' ' + (b || '') + 'deben');
    t = t.replace(/\bdebe automáticamente\b/gi, 'debe de forma automática').replace(/\bdeben automáticamente\b/gi, 'deben de forma automática');
    t = t.replace(BMS.trad.NUM_UN, (m) => '!!' + m + '!!');
    t = t.replace(/\b(\w+)\s+!!/g, '$1 !!').replace(/!!\s*!!/g, '');
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return /[.;:]$/.test(t.replace(/!!$/, '')) ? t : t + '.';
  }

  /* ---------- completar la secuencia: redacta lo que falta para cumplir el estándar y deja en rojo lo que se debe actualizar ---------- */
  function completarSecuencia(S) {
    const E = BMS.estado, res = BMS.calc.todo(), cuenta = { secciones: 0, redactados: 0, requisitos: 0 };
    const c0 = complementar(S); cuenta.secciones = c0.secciones;
    const lista = (a, n) => { const u = [...new Set(a)]; return u.slice(0, n).join(', ') + (u.length > n ? ' y ' + (u.length - n) + ' más' : ''); };
    const PEND = { 'Habilitación y horario': '[por definir]', 'Control': '[por definir]', 'Alarmas': '[por definir]' };
    /* 1. secciones SOO-n con marcadores «[por definir]»: se redactan a partir de las variables del catálogo */
    S.bloques.forEach((b, i) => {
      if (b.t !== 'li') return;
      const m = /^\*\*(Habilitación y horario|Control|Alarmas):\*\*\s*\[por definir\]\.?$/.exec(b.texto || ''); if (!m) return;
      let k = i; while (k >= 0 && S.bloques[k].t !== 'h1') k--;
      const cat = k >= 0 && BMS.catEq.categorias.find((c) => BMS.norm(S.bloques[k].texto).includes(BMS.norm(c.nombre)));
      if (!cat) return;
      const tipos = new Map(); res.filas.filter((f) => f.tipo && f.tipo.cat === cat.id && f.eq.qty > 0).forEach((f) => tipos.set(f.tipo.id, f.tipo));
      const T = [...tipos.values()], pts = (t) => t.pts || [];
      let texto;
      if (m[1] === 'Habilitación y horario') {
        const con = T.filter((t) => pts(t).some((p) => p.do > 0)).map((t) => corto(t.nombre));
        texto = '**Habilitación y horario:** ' + (con.length ? 'el BMS habilita y deshabilita ' + lista(con, 6) + ' según el horario semanal y el calendario de excepciones, editables desde la interfaz web; el selector local en el equipo tiene prioridad sobre el comando del BMS. ' : 'el BMS supervisa el sistema sin comandar equipos; los estados se registran con su hora. ') + '!!Confirmar horarios, condiciones de arranque y retardos.!!';
      } else if (m[1] === 'Control') {
        const ao = []; T.forEach((t) => pts(t).filter((p) => p.ao > 0 || /setpoint|set point/i.test(p.n)).forEach((p) => ao.push(p.n)));
        texto = '**Control:** ' + (ao.length ? 'el BMS ajusta ' + lista(ao, 5) + ' dentro de los límites definidos por el diseño y vigila la respuesta del equipo; ' : 'el equipo mantiene su control propio y el BMS lee sus variables principales; ') + 'ante pérdida de comunicación el equipo continúa con su último modo seguro. !!Confirmar setpoints, límites y modos de operación.!!';
      } else {
        const al = []; T.forEach((t) => pts(t).filter((p) => p.alm).forEach((p) => al.push(p.n)));
        texto = '**Alarmas:** ' + (al.length ? 'se generan alarmas para ' + lista(al, 6) + ', con prioridad, reconocimiento por el operador y tendencia con retención de un año. ' : 'toda entrada analógica tiene alarma alta y baja, y todo comando tiene su estado de retroalimentación; las tendencias se retienen un año. ') + '!!Confirmar umbrales, retardos y prioridad de cada alarma.!!';
      }
      S.bloques[i] = { t: 'li', texto }; cuenta.redactados++;
    });
    /* 2. requisitos del estándar que las secuencias no cubren: se agrega un párrafo en la sección del tema, con lo pendiente en rojo */
    const v = validar(true), titulos = () => S.bloques.map((b, i) => ({ b, i })).filter((x) => x.b.t === 'h1');
    const yaEsta = (r) => S.bloques.some((b) => b.req === r.req);
    const pendientes = v.reqs.filter((r) => r.estado !== 'ok' && !yaEsta(r));
    let general = S.bloques.findIndex((b) => b.t === 'h1' && /Requisitos del estándar por incorporar/i.test(b.texto));
    pendientes.forEach((r) => {
      const rr = raices(r.req); let mejor = -1, pm = 0;
      titulos().forEach((x) => { if (/^\s*Anexo\b/i.test(x.b.texto) || /Requisitos del estándar por incorporar/i.test(x.b.texto)) return; const rs = raices(x.b.texto); const sc = rs.filter((q) => rr.includes(q)).length; if (sc > pm) { pm = sc; mejor = x.i; } });
      const txt = redactarRequisito(r.req, r.orig) || ('!!' + redactar(r.req).replace(/!!/g, '') + '!!');
      if (S.bloques.some((b) => b.texto === txt)) return;
      const li = { t: 'li', req: r.req, texto: txt };
      if (mejor >= 0) { let f = mejor + 1; while (f < S.bloques.length && S.bloques[f].t !== 'h1') f++; S.bloques.splice(f, 0, li); }
      else {
        if (general < 0) { let a = S.bloques.findIndex((b) => b.t === 'h1' && /^\s*Anexo\b/i.test(b.texto)); if (a < 0) a = S.bloques.length; S.bloques.splice(a, 0, { t: 'h1', texto: 'Requisitos del estándar por incorporar' }, { t: 'p', texto: 'Requisitos del estándar del hotel sobre operación y control que las secuencias deben tratar. Lo marcado en rojo se debe redactar o confirmar antes de emitir.' }); general = a; }
        let f = general + 1; while (f < S.bloques.length && S.bloques[f].t !== 'h1') f++; S.bloques.splice(f, 0, li);
      }
      cuenta.requisitos++;
    });
    return cuenta;
  }

  BMS.seq = { completarSecuencia, complementar, generarAnexos, resolverBloques, resolverTexto, validar, letraSiguiente, estructuraBase };

  /* ---------- página ---------- */
  const pagina = (root) => {
    const E = BMS.estado;
    E.secuencias = E.secuencias || inicial();
    const S = E.secuencias; S.opciones = Object.assign({ b: true, c: true, d: true, e: true, f: true, detalle: false }, S.opciones || {});
    S.estandar = S.estandar || { nombre: 'Estándar del hotel', texto: '' };
    const ini = S.bloques.map((x, i) => (x.t === 'h1' ? i : -1)).filter((i) => i >= 0);
    if (BMS.ui.secSel == null || BMS.ui.secSel >= ini.length) BMS.ui.secSel = ini.length ? 0 : -1;
    const sel = BMS.ui.secSel;
    const estado = h('span', { class: 'mute' });
    const guardar = () => BMS.touch();
    const nuevoTipo = (tipo) => (tipo === 'tabla' ? { t: 'tabla', filas: [['Columna 1', 'Columna 2'], ['', '']] } : tipo === 'vivo' ? { t: 'vivo', fuente: 'equipos', cat: (BMS.catEq.categorias[0] || {}).id } : { t: tipo, texto: '' });
    const val = validar();
    const nObs = val.cuentaReqs.falta + val.cuentaReqs.parcial + val.pr.length;

    const exportar = async (doc = 'bms') => {
      try {
        estado.textContent = 'Generando el documento' + (doc === 'bms' ? ' y los anexos…' : '…');
        const mios = bloquesDe(S.bloques, doc);
        const letra0 = letraSiguiente(mios);
        const anexos = doc === 'bms' && ['b', 'c', 'd', 'e', 'f'].some((k) => S.opciones[k]) ? await generarAnexos(S.opciones, letra0) : [];
        let portada = S.portada.map((x) => resolverTexto(x));
        if (doc === 'inc' && /^Secuencias de operación del BMS\/BAS$/i.test((portada[1] || '').trim())) portada[1] = 'Secuencias de operación del sistema de alarma contra incendio';
        const en = S.opciones.idioma === 'en';
        let titulo = doc === 'inc' ? 'Alarma contra incendio' : 'Secuencias de operación', bl = [...resolverBloques(mios), ...anexos];
        BMS.docxLang = en ? 'en' : 'es';
        if (en) { portada = portada.map((x) => BMS.trad.aEn(x)); bl = BMS.trad.bloques(bl); titulo = doc === 'inc' ? 'Fire alarm sequences' : 'Sequences of operation'; if (bl.pendientes) estado.textContent = bl.pendientes + ' texto(s) sin traducir quedaron en rojo en el Word…'; }
        const blob = await BMS.exportarSecuenciasDocx(titulo, portada, bl);
        BMS.descargar((S.opciones.idioma === 'en' ? (doc === 'inc' ? 'Fire_alarm_sequences_' : 'Sequences_of_operation_') : doc === 'inc' ? 'Secuencias_alarma_contra_incendio_' : 'Secuencias_de_operacion_BMS_') + (E.proyecto.nombre || 'proyecto').replace(/[^\w\-]+/g, '_') + '.docx', blob);
        estado.textContent = 'Documento exportado (' + Math.round(blob.size / 1024) + ' KB).';
      } catch (e) { estado.textContent = ''; alert('No se pudo exportar: ' + e.message); }
    };
    const archivo = (accept, alLeer, comoTexto) => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
      inp.addEventListener('change', () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => alLeer(rd.result, f); comoTexto ? rd.readAsText(f) : rd.readAsArrayBuffer(f); });
      inp.click();
    };
    /* ---- lectura del estándar: Excel, Word, PDF y texto; uno o varios archivos, o una carpeta ---- */
    const EXT_EST = /\.(txt|md|csv|docx|xlsx|xls|xlsm|pdf)$/i;
    const leerBuf = (f) => new Promise((ok, no) => { const rd = new FileReader(); rd.onload = () => ok(rd.result); rd.onerror = () => no(rd.error); rd.readAsArrayBuffer(f); });
    const cargarPdfJs = () => window.pdfjsLib ? Promise.resolve(window.pdfjsLib) : new Promise((ok, no) => {
      const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      sc.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(window.pdfjsLib); };
      sc.onerror = () => no(new Error('no se pudo cargar el lector de PDF (se necesita internet)')); document.head.append(sc);
    });
    async function lineasPdf(buf) {
      const lib = await cargarPdfJs(), pdf = await lib.getDocument({ data: buf }).promise, out = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const items = (await (await pdf.getPage(n)).getTextContent()).items.filter((i) => i.str.trim()), filas = [];
        items.forEach((i) => { const y = Math.round(i.transform[5]); let f = filas.find((r) => Math.abs(r.y - y) < 3); if (!f) filas.push(f = { y, it: [] }); f.it.push(i); });
        filas.sort((a, b) => b.y - a.y).forEach((r) => out.push(r.it.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()));
      }
      /* une las líneas de continuación: una línea nueva empieza con numeración, viñeta o mayúscula tras un punto */
      const res = []; out.forEach((l) => { if (!res.length || /^(§?\d[\w.\-]*[\s)]|[•\-–·]|[A-Z]\.)/.test(l) || /[.:;]$/.test(res[res.length - 1])) res.push(l); else res[res.length - 1] += ' ' + l; });
      return res;
    }
    function lineasExcel(buf) {
      const wb = XLSX.read(buf, { type: 'array' }), out = [];
      wb.SheetNames.forEach((n) => XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: '', raw: false }).forEach((r) => {
        const c = r.map((x) => String(x).trim()).filter(Boolean); if (!c.length) return;
        if (c.length === 1 && c[0].length < 4) return;
        if (/^(ref(erencia)?\.?|item|n[o°.]*|#|c[oó]digo)$/i.test(c[0]) && c.length > 1 && c.join(' ').length < 60) return;
        out.push(c.length > 1 && c[0].length <= 24 && !/\s{2,}/.test(c[0]) ? c[0] + ' | ' + c.slice(1).join(' — ') : c.join(' — '));
      }));
      return out;
    }
    async function lineasDe(f) {
      if (/\.(txt|md|csv)$/i.test(f.name)) return (await f.text()).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const buf = await leerBuf(f);
      if (/\.docx$/i.test(f.name)) return BMS.lineasDocx(buf);
      if (/\.pdf$/i.test(f.name)) return lineasPdf(buf);
      return lineasExcel(buf);
    }
    function cargarEstandar() {
      const inp = document.createElement('input'); inp.type = 'file';
      inp.accept = '.pdf,application/pdf';
      inp.addEventListener('change', async () => {
        const fs = [...inp.files].filter((f) => /\.pdf$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));
        if (!fs.length) { alert('Seleccione un archivo PDF.'); return; }
        const S = BMS.estado.secuencias, lineas = [], fallos = [];
        for (const f of fs) { try { const l = await lineasDe(f); lineas.push(...l); } catch (e) { fallos.push(f.name + ': ' + e.message); } }
        if (!lineas.length) { alert('No se pudo leer texto de los archivos.' + (fallos.length ? '\n' + fallos.join('\n') : '')); return; }
        const total = lineas.length; lineas.splice(0, lineas.length, ...lineas.map((l) => (BMS.trad.esIngles(l) ? BMS.trad.aEs(l) : l)));
        const utiles = soloOperacion(lineas);
        if (!utiles.length) { alert('No se encontraron requisitos de operación y control en el PDF (' + total + ' líneas leídas). Pegue en el cuadro los requisitos que quiere validar.'); return; }
        lineas.splice(0, lineas.length, ...utiles);
        alert('Del PDF se tomaron ' + utiles.length + ' requisitos de operación y control (de ' + total + ' líneas leídas). Revise la lista y quite o agregue líneas en el cuadro si hace falta.');
        if (lineas.length > 600 && !confirm('El archivo tiene ' + lineas.length + ' líneas de texto. Para que la herramienta siga ágil solo se usarán las primeras 600 líneas. ¿Continuar?\n\nSi el estándar es largo, pegue en el cuadro solo los requisitos que quiere validar.')) return;
        lineas.splice(600);
        let agregar = false;
        if ((S.estandar.texto || '').trim()) agregar = !confirm('Ya hay requisitos cargados.\n\nAceptar = reemplazarlos con ' + fs.length + ' archivo(s).\nCancelar = agregar al final.');
        S.estandar.texto = (agregar ? S.estandar.texto.replace(/\s+$/, '') + '\n' : '') + lineas.join('\n');
        S.estandar.texto = S.estandar.texto.slice(0, 60000); S.estandar.filtrado = true;
        const nom = fs[0].name.replace(/\.\w+$/, '');
        if (!agregar || !S.estandar.nombre) S.estandar.nombre = nom;
        guardar(); BMS.rerender();
        if (fallos.length) alert('Se cargaron ' + (fs.length - fallos.length) + ' archivo(s). No se pudieron leer:\n' + fallos.join('\n'));
      });
      inp.click();
    }
    const barra = h('div', { class: 'fila noprint' },
      h('button', { class: 'b p', title: 'Word con las secuencias del BMS y los anexos', onclick: () => exportar('bms') }, 'Exportar Word — BMS'),
      h('button', { class: 'b p', title: 'Word aparte con las secuencias del sistema de alarma contra incendio', onclick: () => exportar('inc') }, 'Exportar Word — Alarma contra incendio'),
      h('button', { class: 'b', title: 'Lee un Word con el formato de las secuencias (Título 1 = sección, Título 2 = subsección, viñetas y tablas)', onclick: () => archivo('.docx', async (buf) => {
        try {
          const r = await BMS.leerSecuenciasDocx(buf);
          if (S.bloques.length && !confirm('Se leyeron ' + r.bloques.length + ' bloques' + (r.descartados ? ' (se descartaron ' + r.descartados + ' de anexos generados, que se vuelven a generar al exportar)' : '') + '. Esto reemplaza las secuencias actuales. ¿Continuar?')) return;
          S.portada = r.portada; S.bloques = r.bloques; BMS.ui.secSel = 0; BMS.touch(); BMS.rerender();
        } catch (e) { alert('No se pudo importar: ' + e.message); }
      }) }, 'Importar desde Word'),
      h('button', { class: 'b', title: 'Agrega las secciones SOO-n, subsecciones y bloques ligados en vivo que falten, sin tocar lo ya escrito', onclick: () => {
        const vacio = !S.bloques.length;
        const c = complementar(S); BMS.ui.secSel = 0; BMS.touch(); BMS.rerender();
        if (!vacio) setTimeout(() => alert('Se complementaron las secuencias: ' + c.secciones + ' sección(es) nueva(s), ' + c.subsecciones + ' subsección(es) y ' + c.vivos + ' bloque(s) ligado(s) agregados. Lo ya escrito no se modificó.'), 50);
      } }, 'Cargar estructura base del proyecto'),
      h('button', { class: 'b p', title: 'Redacta lo que falta para cumplir el estándar del hotel: completa las secciones por sistema con las variables del proyecto y agrega los requisitos no cubiertos. Lo que se debe actualizar queda en rojo', onclick: () => {
        if (!S.estandar.texto.trim() && !confirm('No hay estándar del hotel cargado; solo se completarán las secciones del proyecto. ¿Continuar?')) return;
        const c = completarSecuencia(S); validar(true); BMS.touch(); BMS.rerender();
        setTimeout(() => alert('Secuencia completada: ' + c.secciones + ' sección(es) nueva(s), ' + c.redactados + ' párrafo(s) redactado(s) con las variables del proyecto y ' + c.requisitos + ' requisito(s) del estándar redactado(s) como secuencia. Los datos que debe validar con el diseño quedan en rojo.'), 50);
      } }, 'Completar la secuencia'),
      h('button', { class: 'b', title: 'Sube el PDF del estándar del hotel para validar las secuencias', onclick: () => { BMS.ui.secSel = -2; cargarEstandar(); } }, 'Subir estándar del hotel (PDF)'),
      h('button', { class: 'b x', onclick: () => { if (confirm('¿Vaciar las secuencias de operación? (el estándar del hotel se conserva)')) { const est = S.estandar; E.secuencias = inicial(); E.secuencias.estandar = est; BMS.ui.secSel = -1; BMS.touch(); BMS.rerender(); } } }, 'Vaciar'), estado);

    const lista = h('div', { class: 'lista' }, h('div', { class: 'grp' }, 'Documento'),
      h('div', { class: 'it' + (sel === -1 ? ' on' : ''), onclick: () => { BMS.ui.secSel = -1; BMS.rerender(); } }, h('span', null, 'Portada y anexos')),
      h('div', { class: 'it' + (sel === -2 ? ' on' : ''), onclick: () => { BMS.ui.secSel = -2; BMS.rerender(); } }, h('span', null, 'Validación con el estándar'), h('span', { class: 'badge', style: nObs ? { color: 'var(--bad)' } : null }, nObs)),
      );
    ['bms', 'inc'].forEach((d) => {
      lista.append(h('div', { class: 'grp' }, DOCS[d]));
      let hay = false;
      ini.forEach((bi, k) => {
        if (docDe(S.bloques[bi]) !== d) return; hay = true;
        const fin = k + 1 < ini.length ? ini[k + 1] : S.bloques.length;
        lista.append(h('div', { class: 'it' + (sel === k ? ' on' : ''), onclick: () => { BMS.ui.secSel = k; BMS.rerender(); } }, h('span', null, cut(S.bloques[bi].texto, 44)), h('span', { class: 'badge' }, fin - bi - 1)));
      });
      if (!hay) lista.append(h('div', { class: 'mute', style: { fontSize: '12px', padding: '4px 10px' } }, 'Sin secciones'));
    });
    lista.append(h('div', { class: 'it', style: { color: 'var(--accent)' }, onclick: () => { S.bloques.push({ t: 'h1', texto: 'Nueva sección' }); BMS.ui.secSel = ini.length; guardar(); BMS.rerender(); } }, h('span', null, '+ Agregar sección')));

    let derecha;
    if (sel === -2) {
      /* validación con el estándar del hotel */
      const conteo = (c) => h('span', null, h('span', { class: 'chip ok' }, c.ok + ' cumplen'), ' ', h('span', { class: 'chip warn' }, c.parcial + ' parciales'), ' ', h('span', { class: 'chip bad' }, c.falta + ' no cumplen'));
      derecha = h('div', null,
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Estándar del hotel'),
          h('p', { class: 'hint' }, 'Pegue los requisitos del estándar del hotel, o cárguelos desde un PDF, uno por línea (opcional: "referencia | requisito"). La herramienta revisa en vivo si las secuencias los tratan y con qué valores, y señala lo que falta. Se preasigna una base de requisitos Fairfield CALA tomada del documento de secuencias; reemplácela por el texto del estándar.'),
          h('label', { class: 'f' }, 'Nombre del estándar', h('input', { class: 'in', value: S.estandar.nombre || '', onchange: (e) => { S.estandar.nombre = e.target.value; guardar(); } })),
          h('label', { class: 'f', style: { marginTop: '8px' } }, 'Requisitos (uno por línea)', h('textarea', { class: 'in', rows: 12, style: { width: '100%' }, value: S.estandar.texto || '', onchange: (e) => { S.estandar.texto = e.target.value; S.estandar.filtrado = true; guardar(); BMS.rerender(); } })),
          h('div', { class: 'fila' },
            h('button', { class: 'b', onclick: () => cargarEstandar() }, 'Cargar estándar (PDF)'),
            h('button', { class: 'b', onclick: () => { if (!S.estandar.texto || confirm('Esto reemplaza los requisitos actuales por la base Fairfield CALA. ¿Continuar?')) { S.estandar.texto = ESTANDAR_BASE; S.estandar.nombre = 'Estándar Fairfield CALA (abril 2026)'; guardar(); BMS.rerender(); } } }, 'Usar la base Fairfield CALA'),
            h('button', { class: 'b', onclick: () => { validar(true); BMS.rerender(); } }, 'Revalidar'))),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Comprobaciones del proyecto'), h('div', { class: 'fila' }, conteo(val.cuentaPr)),
          val.pr.length ? h('table', { class: 't' }, h('thead', null, h('tr', null, ['Tema', 'Estado', 'Observación'].map((x) => h('th', null, x)))), h('tbody', null, val.pr.map((r) => h('tr', null, h('td', { style: { fontWeight: 600 } }, r.tema), h('td', { class: 'c' }, chipDe(r.nivel)), h('td', null, r.obs))))) : h('p', { class: 'hint' }, 'Sin observaciones.')),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Requisitos del estándar frente a las secuencias'), h('div', { class: 'fila' }, conteo(val.cuentaReqs)),
          val.reqs.length ? h('div', { class: 'scroll' }, h('table', { class: 't' }, h('thead', null, h('tr', null, ['Ref.', 'Requisito', 'Estado', 'Observación'].map((x) => h('th', null, x)))), h('tbody', null, val.reqs.map((r) => h('tr', null, h('td', { class: 'c' }, r.ref || '—'), h('td', { style: { maxWidth: '420px' } }, r.req), h('td', { class: 'c' }, chipDe(r.estado)), h('td', { style: { maxWidth: '380px' } }, r.obs)))))) : h('p', { class: 'hint' }, 'Cargue los requisitos del estándar para validar.')));
    } else if (sel === -1) {
      const campo = (rot, i, ph) => h('label', { class: 'f' }, rot, h('input', { class: 'in', placeholder: ph || '', value: S.portada[i] || '', onchange: (e) => { S.portada[i] = e.target.value; guardar(); } }));
      const casilla = (rot, k) => h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: !!S.opciones[k], onchange: (e) => { S.opciones[k] = e.target.checked; guardar(); } }), rot);
      derecha = h('div', null,
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Portada'), h('p', { class: 'hint' }, 'Puede usar marcadores ligados en vivo al proyecto: {{proyecto}}, {{ubicacion}}, {{marca}}, {{reserva}}, {{niveles}}, {{controladores}}, {{equipos}} y {{puntos}}; funcionan también en cualquier párrafo, viñeta o tabla.'), h('div', { class: 'grid' },
          campo('Proyecto y ubicación', 0, '{{proyecto}} — {{ubicacion}}'), campo('Título del documento', 1), campo('Entregable / referencia', 2, 'Entregable 60 % — Comentario #…'), campo('Autor · fecha · estado', 3, 'Sinergia Ingeniería · fecha · Borrador'), campo('Nota inicial', 4, 'Aclaración sobre valores entre corchetes'))),
        h('div', { class: 'card' }, h('h3', { style: { marginTop: 0 } }, 'Anexos generados al exportar'),
          h('p', { class: 'hint' }, 'Se generan con los datos actuales del proyecto (niveles, controladores, equipos, marca y reserva) y siguen la letra del último anexo del documento. Van en hojas apaisadas.'),
          h('label', { class: 'f', style: { maxWidth: '320px', marginBottom: '10px' } }, 'Idioma del documento exportado', h('select', { class: 'in', value: S.opciones.idioma || 'es', onchange: (e) => { S.opciones.idioma = e.target.value; guardar(); } }, h('option', { value: 'es' }, 'Español'), h('option', { value: 'en' }, 'English (traducción con glosario; lo no traducido sale en rojo)'))),
          h('div', { style: { display: 'grid', gap: '6px' } }, casilla('Diagrama unifilar (imagen en partes a ancho de hoja)', 'b'), casilla('Resumen de variables por sistema y por tipo de equipo, y totales por nivel', 'c'), casilla('Lista de controladores, dispositivos de red y materiales', 'd'), casilla('Variables por controlador (equipos y puntos)', 'e'), casilla('   … detallando cada variable por controlador (documento más largo)', 'detalle'), casilla('Validación contra el estándar del hotel (observaciones)', 'f'))));
    } else {
      const bi = ini[sel], fin = sel + 1 < ini.length ? ini[sel + 1] : S.bloques.length;
      const filas = [];
      for (let i = bi; i < fin; i++) {
        const b = S.bloques[i];
        const mover = (d) => { const j = i + d; if (j < 0 || j >= S.bloques.length) return; [S.bloques[i], S.bloques[j]] = [S.bloques[j], S.bloques[i]]; guardar(); BMS.rerender(); };
        const ctrl = h('div', { style: { display: 'flex', gap: '4px', alignItems: 'flex-start' } },
          h('select', { class: 'in', style: { width: '120px' }, value: b.t, onchange: (e) => { const t = e.target.value; if (t === b.t) return; if (t === 'tabla' || t === 'vivo') S.bloques[i] = nuevoTipo(t); else if (b.t === 'tabla' || b.t === 'vivo') S.bloques[i] = { t, texto: '' }; else b.t = t; guardar(); BMS.rerender(); } }, TIPOS.map(([v, tx]) => h('option', { value: v }, tx))),
          h('button', { class: 'b s', title: 'Subir', onclick: () => mover(-1) }, '↑'), h('button', { class: 'b s', title: 'Bajar', onclick: () => mover(1) }, '↓'),
          h('button', { class: 'b s', title: 'Agregar un párrafo debajo', onclick: () => { S.bloques.splice(i + 1, 0, nuevoTipo('p')); guardar(); BMS.rerender(); } }, '＋'),
          b.t === 'h1' ? h('select', { class: 'in', title: 'Documento al que pertenece esta sección', style: { width: '170px' }, value: docDe(b), onchange: (e) => { b.doc = e.target.value; guardar(); BMS.rerender(); } }, Object.entries(DOCS).map(([v, tx]) => h('option', { value: v }, tx))) : null,
          h('button', { class: 'b x', title: 'Eliminar', onclick: () => { if (b.t === 'h1' && !confirm('Es el título de la sección; se elimina solo el título y su contenido pasa a la sección anterior. ¿Continuar?')) return; S.bloques.splice(i, 1); guardar(); BMS.rerender(); } }, '✕'));
        let cont;
        if (b.t === 'vivo') {
          const prev = resolverVivo(b).filter((x) => x.t === 'p' && !/^Tabla No/.test(x.texto)).map((x) => x.texto.replace(/\*\*/g, '')).join(' ') || (b.fuente === 'tabla' ? 'Tabla de equipos y puntos (se arma al exportar).' : '');
          cont = h('div', null, h('div', { class: 'fila', style: { margin: 0 } },
            h('select', { class: 'in', value: b.fuente, onchange: (e) => { b.fuente = e.target.value; guardar(); BMS.rerender(); } }, VIVOS.map(([v, tx]) => h('option', { value: v }, tx))),
            h('select', { class: 'in', value: b.cat, onchange: (e) => { b.cat = e.target.value; guardar(); BMS.rerender(); } }, BMS.catEq.categorias.map((c) => h('option', { value: c.id }, c.nombre))),
            h('span', { class: 'chip gw' }, 'ligado en vivo')),
            h('div', { class: 'mute', style: { fontSize: '12px', marginTop: '4px' } }, cut(prev, 600)));
        } else if (b.t === 'tabla') {
          const t = b.filas;
          cont = h('div', { style: { overflowX: 'auto' } }, h('table', { class: 't', style: { width: 'auto' } }, h('tbody', null, t.map((fl, r) => h('tr', null, fl.map((c, k) => h('td', { style: { padding: '1px' } }, h('input', { class: 'in', style: { width: '150px', fontWeight: r === 0 ? 700 : 400 }, value: c, onchange: (e) => { t[r][k] = e.target.value; guardar(); } }))), h('td', null, h('button', { class: 'b x s', title: 'Quitar fila', onclick: () => { t.splice(r, 1); if (!t.length) t.push(['', '']); guardar(); BMS.rerender(); } }, '✕')))))),
            h('div', { class: 'fila' },
              h('button', { class: 'b s', onclick: () => { t.push(Array(Math.max(...t.map((x) => x.length))).fill('')); guardar(); BMS.rerender(); } }, '+ Fila'),
              h('button', { class: 'b s', onclick: () => { t.forEach((x) => x.push('')); guardar(); BMS.rerender(); } }, '+ Columna'),
              h('button', { class: 'b s', onclick: () => { if (t[0].length > 1) { t.forEach((x) => x.pop()); guardar(); BMS.rerender(); } } }, '− Columna'),
              h('span', { class: 'mute', style: { fontSize: '12px' } }, 'La primera fila es el encabezado. Antes de la tabla agregue un párrafo "Tabla No. n" y otro con el nombre de la tabla.')));
        } else {
          const raw = b.texto || '';
          cont = h('div', null, h('textarea', { class: 'in', style: { width: '100%', fontWeight: b.t === 'h1' || b.t === 'h2' ? 700 : 400 }, rows: b.t === 'h1' || b.t === 'h2' ? 1 : Math.max(2, Math.ceil(raw.length / 105)), value: raw, onchange: (e) => { b.texto = e.target.value; guardar(); BMS.rerender(); } }),
            raw.indexOf('{{') >= 0 ? h('div', { class: 'mute', style: { fontSize: '12px' } }, 'Vista en vivo: ' + resolverTexto(raw)) : null);
        }
        filas.push(h('div', { style: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--line)', alignItems: 'start' } }, ctrl, cont));
      }
      derecha = h('div', null, h('div', { class: 'card' }, ...filas,
        h('div', { class: 'fila' }, ...[['p', '+ Párrafo'], ['li', '+ Viñeta'], ['h2', '+ Subtítulo'], ['tabla', '+ Tabla'], ['vivo', '+ Bloque en vivo']].map(([t, tx]) => h('button', { class: 'b', onclick: () => { S.bloques.splice(fin, 0, nuevoTipo(t)); guardar(); BMS.rerender(); } }, tx)))));
    }

    root.append(h('h2', null, 'Secuencias de operación'),
      h('p', { class: 'hint' }, 'Documento de secuencias del BMS en formato Sinergia, ligado en vivo al proyecto: las listas de equipos, los totales, los marcadores {{…}} y los anexos se actualizan con lo que se va llenando. Se exporta a Word con anexos (diagrama, variables y totales por nivel, controladores y dispositivos, variables por controlador, validación), se puede importar de nuevo, y se valida contra el estándar del hotel. Los valores entre corchetes [ ] son propuestas por validar.'),
      barra, h('div', { class: 'split' }, lista, derecha));
  };
  /* deja el estado guardado en una forma válida (datos de versiones anteriores o incompletos) */
  function sanear(E) {
    const base = inicial(), S = E.secuencias = (E.secuencias && typeof E.secuencias === 'object') ? E.secuencias : base;
    const txt = (v) => (v == null ? '' : String(v));
    S.portada = Array.from({ length: 5 }, (_, i) => txt((Array.isArray(S.portada) ? S.portada : [])[i]));
    S.bloques = (Array.isArray(S.bloques) ? S.bloques : []).filter((b) => b && ['h1', 'h2', 'p', 'li', 'tabla', 'vivo'].includes(b.t)).map((b) => {
      if (b.t === 'tabla') return { ...b, filas: (Array.isArray(b.filas) ? b.filas : []).map((f) => (Array.isArray(f) ? f : [f]).map(txt)) };
      if (b.t === 'vivo') return b;
      return { ...b, texto: txt(b.texto != null ? b.texto : b.x) };
    });
    if (!S.estandar || typeof S.estandar !== 'object') S.estandar = { nombre: 'Estándar del hotel', texto: txt(S.estandar) };
    S.estandar.texto = txt(S.estandar.texto); S.estandar.nombre = txt(S.estandar.nombre);
    /* un estándar largo guardado antes del filtro se reduce una vez a los requisitos de operación y control */
    const ls = S.estandar.texto.split(/\r?\n/).filter(Boolean);
    if (!S.estandar.filtrado && ls.length > 60) { S.estandar.texto = soloOperacion(ls.map((l) => (BMS.trad.esIngles(l) ? BMS.trad.aEs(l) : l))).join('\n'); S.estandar.filtrado = true; BMS.touch(); }
  }
  BMS.pSecuencias = (root) => {
    try { sanear(BMS.estado); return pagina(root); } catch (e) {
      console.error(e);
      root.append(h('h2', null, 'Secuencias de operación'), h('div', { class: 'card' }, h('p', null, 'No se pudo mostrar esta pestaña: ' + e.message),
        h('div', { class: 'fila' }, h('button', { class: 'b x', onclick: () => { if (confirm('Esto vacía las secuencias guardadas (el proyecto no se toca). ¿Continuar?')) { BMS.estado.secuencias = inicial(); BMS.touch(); BMS.rerender(); } } }, 'Restablecer secuencias'))));
    }
  };

})();
