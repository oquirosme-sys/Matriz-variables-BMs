/* Estado del proyecto y capa de persistencia.
   BMS.Repo es la única capa que toca el almacenamiento (hoy localStorage).
   En el paso 2 se reemplaza por Supabase manteniendo la misma interfaz (promesas). */
(function () {
  const { uid, clone } = BMS;
  const K = { proyecto: 'bms.proyecto.v1', catEq: 'bms.cat.equipos.v1', catCt: 'bms.cat.ctrl.v1' };

  const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  BMS.Repo = {
    async cargarProyecto() { return leer(K.proyecto); },
    async guardarProyecto(p) { return escribir(K.proyecto, p); },
    async cargarCatalogoEquipos() { return leer(K.catEq); },
    async guardarCatalogoEquipos(c) { return escribir(K.catEq, c); },
    async cargarCatalogoControladores() { return leer(K.catCt); },
    async guardarCatalogoControladores(c) { return escribir(K.catCt, c); }
  };

  BMS.hoy = () => new Date().toISOString().slice(0, 10);

  BMS.proyectoNuevo = () => ({
    v: 1,
    proyecto: { nombre: '', propietario: '', ubicacion: '', preparado: '', fecha: BMS.hoy(), estado: 'Borrador', marca: 'JCI', reserva: 10, motor: 'auto' },
    niveles: [],
    controladores: [],
    equipos: []
  });

  BMS.proyectoEjemplo = () => {
    const p = BMS.proyectoNuevo();
    Object.assign(p.proyecto, {
      nombre: 'BMS Fairfield Guayabos',
      propietario: 'Hotel Fairfield by Marriott',
      ubicacion: 'Guayabos, Curridabat, Costa Rica',
      preparado: 'Sinergia Ingeniería'
    });
    const defs = [['S2', 'Sótano 2'], ['S1', 'Sótano 1'], ['N1', 'Nivel 1'], ['N2', 'Nivel 2'], ['N3', 'Nivel 3'], ['N4', 'Nivel 4'], ['N5', 'Nivel 5'], ['N6', 'Nivel 6'], ['N7', 'Nivel 7'], ['AZ', 'Azotea']];
    p.niveles = defs.map(([codigo, nombre]) => ({ id: uid(), codigo, nombre }));
    const n1 = p.niveles.find((n) => n.codigo === 'N1');
    p.controladores.push({ id: uid(), tipo: 'CP', nivel: n1.id, consec: 1, ubicacion: 'Cuarto de TI [por confirmar]', obs: 'Motor de red; servidor y switch BMS', modo: 'auto' });
    /* Controladores según el plano EB-6200 (niveles S2, S1, N1 y N2) y la matriz (resto de niveles). */
    const nv = (c) => p.niveles.find((n) => n.codigo === c).id;
    const cs = (c, consec, ubicacion, gab, obs) => p.controladores.push({ id: uid(), tipo: 'CS', nivel: nv(c), consec, ubicacion: ubicacion || '', gab: gab || '', obs: obs || '', modo: 'auto' });
    cs('S2', 1, 'Cuarto de bombas S2', 'GAB-S2-01'); cs('S2', 2, 'Cuarto de bombas S2', 'GAB-S2-01');
    cs('S1', 1, 'Cuarto eléctrico S1', 'GAB-S1-01'); cs('S1', 2, 'Cuarto eléctrico S1', 'GAB-S1-01'); cs('S1', 7, 'Cuarto de ventilación S1');
    cs('N1', 1, 'Cuarto de TI [por confirmar]');
    cs('N2', 1, 'Cocina N2'); cs('N2', 2, 'Cuarto técnico N2'); cs('N2', 3, 'Cuarto técnico N2');
    ['N3', 'N4', 'N5', 'N6', 'N7', 'AZ'].forEach((c) => cs(c, 1));
    p.gabDim = { 'GAB-S2-01': '70x50 cm', 'GAB-S1-01': '70x50 cm' };
    /* Equipos: plano EB-6200 donde está rotulado; matriz Fairfield para el resto (distribución por nivel propuesta, por confirmar). */
    const q = (c, tipoId, qty, tag) => p.equipos.push({ id: uid(), nivel: nv(c), tipoId, qty, tag, ctrl: 'auto', obs: '', excl: [] });
    q('S2', 'acs_cal', 3, 'ACH-C'); q('S2', 'iny', 1, 'INY-S201'); q('S2', 'ef_simple', 3, 'EX-S2'); q('S2', 'il_panel', 2, 'TIL-S2'); q('S2', 'bp', 1, 'BP-1'); q('S2', 'bn', 1, 'BN-1'); q('S2', 'bomba_cte', 1, 'BCE-'); q('S2', 'cis', 2, 'CIS-1/2'); q('S2', 'bpl', 2, 'BPL-'); q('S2', 'tci', 1, 'TCI-1');
    q('S1', 'cargador_ev', 4, 'EV-'); q('S1', 'sensor_co', 1, 'CO-1'); q('S1', 'il_panel', 2, 'TIL-S1'); q('S1', 'iny', 3, 'INY-S1'); q('S1', 'ef_simple', 4, 'EX-S1');
    q('S1', 'sub', 1, 'SUB-1'); q('S1', 'tr', 1, 'TX-01'); q('S1', 'ge', 1, 'GEN-01'); q('S1', 'ats', 1, 'ATS-1'); q('S1', 'mm_full', 1, 'ION 8650'); q('S1', 'mm', 8, 'MM-1…8'); q('S1', 'itp', 10, 'ITP1…10');
    q('N1', 'bci', 1, 'BCI-1'); q('N1', 'bj', 1, 'BJ-1'); q('N1', 'ups_gen', 1, 'UPS-01'); q('N1', 'il_panel', 2, 'TIL-N1'); q('N1', 'ef_simple', 6, 'EX-N1'); q('N1', 'asc', 2, 'ASC-'); q('N1', 'vrf_evap', 5, 'UE-1…5');
    q('N1', 'dx_mane', 8, 'BCU-0201…S201'); /* 8 manejadoras BCU según la tabla de especificaciones (Fitness, Food prep, Restaurante, Área de estar, Recepción, Comedor) */
    q('N1', 'facp_gw', 1, 'FACP-GW'); q('N1', 'seg_gw', 1, 'SEG-GW'); q('N1', 'grms_gw', 1, 'GRMS-GW'); q('N1', 'pms', 1, 'PMS-IF');
    q('N2', 'campana', 4, 'EH-'); q('N2', 'il_panel', 1, 'TIL-N2'); q('N2', 'vrf_evap', 5, 'UE-6…10');
    ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7'].forEach((c) => { q(c, 'grms_n', 1, 'GRMS-' + c); q(c, 'facp_z', 1, 'FACP-Z-' + c); });
    q('AZ', 'doas', 1, 'DOAS-1'); q('AZ', 'afex', 2, 'AFEX-'); q('AZ', 'iny_vfd', 8, 'INY-'); q('AZ', 'iny', 2, 'INY-9/10'); q('AZ', 'ef', 5, 'EF-1…5'); q('AZ', 'pe_esc', 2, 'PE-'); q('AZ', 'sensor_amb', 4, 'TS/HS-'); q('AZ', 'estacion_ext', 1, 'TE/HE-1'); q('AZ', 'vrf_cond', 1, 'UC-1'); q('AZ', 'itouch', 1, 'iTouch'); q('AZ', 'pdt', 1, 'PDT-INY');
    return p;
  };

  /* Catálogos: la copia guardada manda; si no hay, se usa el catálogo base. */
  BMS.cargarTodo = async () => {
    const [p, ce, cc] = await Promise.all([BMS.Repo.cargarProyecto(), BMS.Repo.cargarCatalogoEquipos(), BMS.Repo.cargarCatalogoControladores()]);
    BMS.estado = p && p.niveles ? p : BMS.proyectoNuevo();
    /* un estándar del hotel enorme (cargado de archivos grandes) hace lenta toda la herramienta: se recorta */
    const est = BMS.estado.secuencias && BMS.estado.secuencias.estandar;
    if (est && typeof est.texto === 'string' && est.texto.length > 60000) { est.texto = est.texto.split(/\r?\n/).slice(0, 600).join('\n').slice(0, 60000); BMS.guardar(); }
    BMS.catEq = ce && ce.tipos ? ce : clone(window.BMS_CATALOGO_EQUIPOS);
    /* Migración del catálogo de equipos: agrega categorías y tipos nuevos y reemplaza los corregidos; respeta el resto de lo editado. */
    const base = window.BMS_CATALOGO_EQUIPOS;
    if ((BMS.catEq.version || 1) < base.version) {
      const ids = new Set(BMS.catEq.tipos.map((t) => t.id));
      base.categorias.forEach((c) => { if (!BMS.catEq.categorias.some((x) => x.id === c.id)) BMS.catEq.categorias.push(clone(c)); });
      BMS.catEq.categorias.sort((a, b) => base.categorias.findIndex((x) => x.id === a.id) - base.categorias.findIndex((x) => x.id === b.id));
      base.tipos.forEach((t) => {
        const i = BMS.catEq.tipos.findIndex((x) => x.id === t.id);
        if (i < 0) BMS.catEq.tipos.push(clone(t));
        else if ((base.corregidos || []).includes(t.id)) BMS.catEq.tipos[i] = clone(t);
        else if (t.ip !== undefined && BMS.catEq.tipos[i].ip === undefined) BMS.catEq.tipos[i].ip = t.ip;
      });
      BMS.catEq.version = base.version; BMS.catEq.corregidos = base.corregidos;
      BMS.guardarCatEq();
    }
    BMS.catCt = cc && cc.marcas ? cc : clone(window.BMS_CATALOGO_CONTROLADORES);
    if ((BMS.catCt.version || 1) < window.BMS_CATALOGO_CONTROLADORES.version) {
      BMS.catCt.marcas.Honeywell = clone(window.BMS_CATALOGO_CONTROLADORES.marcas.Honeywell);
      BMS.catCt.version = window.BMS_CATALOGO_CONTROLADORES.version;
      BMS.guardarCatCt();
    }
  };

  let t1, t2, t3;
  const marca = (ok) => { const e = document.getElementById('estadoGuardado'); if (e) e.textContent = ok ? 'Guardado en este navegador ' + new Date().toLocaleTimeString() : 'No se pudo guardar'; };
  BMS.guardar = () => { clearTimeout(t1); t1 = setTimeout(async () => marca(await BMS.Repo.guardarProyecto(BMS.estado)), 300); };
  BMS.guardarCatEq = () => { clearTimeout(t2); t2 = setTimeout(async () => marca(await BMS.Repo.guardarCatalogoEquipos(BMS.catEq)), 300); };
  BMS.guardarCatCt = () => { clearTimeout(t3); t3 = setTimeout(async () => marca(await BMS.Repo.guardarCatalogoControladores(BMS.catCt)), 300); };
})();
