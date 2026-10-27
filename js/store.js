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
    p.niveles.forEach((n) => p.controladores.push({ id: uid(), tipo: 'CS', nivel: n.id, consec: 1, ubicacion: '', obs: '', modo: 'auto' }));
    return p;
  };

  /* Catálogos: la copia guardada manda; si no hay, se usa el catálogo base. */
  BMS.cargarTodo = async () => {
    const [p, ce, cc] = await Promise.all([BMS.Repo.cargarProyecto(), BMS.Repo.cargarCatalogoEquipos(), BMS.Repo.cargarCatalogoControladores()]);
    BMS.estado = p && p.niveles ? p : BMS.proyectoNuevo();
    BMS.catEq = ce && ce.tipos ? ce : clone(window.BMS_CATALOGO_EQUIPOS);
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
