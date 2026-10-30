/* Catálogo base de controladores por marca.
   Canales: uio = entrada/salida universal (Honeywell), ui = entrada universal, bi = entrada binaria, co = salida configurable, bo = salida binaria, ao = salida analógica.
   JCI: tomado de la hoja JCI_Catalogo del Excel (LIT-1900346 / LIT-1900349 y Guía de configuración Metasys 12.0).
   Honeywell: Optimizer en Español (Honeywell LATAM 2023). Schneider: EcoStruxure Building Operation (SpaceLogic AS-P y módulos de E/S), por confirmar con el proveedor. Se corrigen en la pestaña "Catálogo de controladores". */
window.BMS_CATALOGO_CONTROLADORES = {
  version: 6, // sube al cambiar los datos base: reemplaza la marca Honeywell guardada en el navegador y agrega las marcas nuevas
  marcas: {
    JCI: {
      nombre: 'Johnson Controls (Metasys)',
      maxModulosPorBase: 10,
      bus: 'B', // clave de cableado de la troncal de controladores (BACnet MS/TP)
      confirmar: false,
      bases: [
        { cod: 'FEC1611', desc: 'Controlador de campo de 10 puntos', ui: 2, bi: 1, co: 4, bo: 3, ao: 0, fuente: 'LIT-1900346' },
        { cod: 'FEC2611', desc: 'Controlador de campo de 17 puntos', ui: 6, bi: 2, co: 4, bo: 3, ao: 2, fuente: 'LIT-1900346' }
      ],
      modulos: [
        { cod: 'IOM1711', desc: 'Módulo de 4 puntos (entradas binarias)', ui: 0, bi: 4, co: 0, bo: 0, ao: 0, fuente: 'LIT-1900349' },
        { cod: 'IOM2711', desc: 'Módulo de 6 puntos (2 UI + 2 BO con relé)', ui: 2, bi: 0, co: 0, bo: 2, ao: 0, fuente: 'LIT-1900349' },
        { cod: 'IOM2721', desc: 'Módulo de 10 puntos (8 UI + 2 AO)', ui: 8, bi: 0, co: 0, bo: 0, ao: 2, fuente: 'LIT-1900349' },
        { cod: 'IOM3711', desc: 'Módulo de 12 puntos (4 UI + 4 BO con relé)', ui: 4, bi: 0, co: 0, bo: 4, ao: 0, fuente: 'LIT-1900349' },
        { cod: 'IOM3721', desc: 'Módulo de 16 puntos (16 BI)', ui: 0, bi: 16, co: 0, bo: 0, ao: 0, fuente: 'LIT-1900349' },
        { cod: 'IOM3731', desc: 'Módulo de 16 puntos (8 BI + 8 BO)', ui: 0, bi: 8, co: 0, bo: 8, ao: 0, fuente: 'LIT-1900349' },
        { cod: 'IOM4711', desc: 'Módulo de 17 puntos (6 UI, 2 BI, 4 CO, 3 BO, 2 AO)', ui: 6, bi: 2, co: 4, bo: 3, ao: 2, fuente: 'LIT-1900349' }
      ],
      motores: [
        { cod: 'SNE1050x', maxDisp: 60, desc: 'Motor de red Metasys', fuente: 'Guía de configuración Metasys 12.0' },
        { cod: 'SNE110Lx', maxDisp: 110, desc: 'Motor de red Metasys', fuente: 'Guía de configuración Metasys 12.0' },
        { cod: 'SNE1100x', maxDisp: 150, desc: 'Motor de red Metasys', fuente: 'Guía de configuración Metasys 12.0' },
        { cod: 'SNE2200x', maxDisp: 600, desc: 'Motor de red Metasys', fuente: 'Guía de configuración Metasys 12.0' }
      ]
    },
    Honeywell: {
      nombre: 'Honeywell Optimizer',
      maxModulosPorBase: 3,
      bus: 'B', // troncal BACnet MS/TP entre controladores (Unitary versión MS/TP); la LAN IP llega solo al controlador principal
      confirmar: false,
      nota: 'Fuente: presentación "Optimizer en Español" (Honeywell LATAM, 2023). UIO = entrada/salida universal (sirve como AI, DI, AO o DO). Los módulos IO se conectan al Unitary por Modbus RTU (roadmap, lámina 14); el límite de 3 módulos por Unitary sale de la lámina de integración Modbus RTU (cadena de 3 dispositivos) y es conservador: confirmar con Honeywell. Cuando un panel necesitaría más de 2 Unitary, la selección automática usa un Optimizer Advanced con módulos IO (hasta 64 módulos por canal RS485).',
      bases: [
        { cod: 'UN-RS0844MS24NMC', desc: 'Optimizer Unitary Small, BACnet MS/TP: 16 puntos (8 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: ES24 (IP), TS24 (T1L), WAS24 (WiFi)', uio: 8, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'UN-RL1644MS24NMC', desc: 'Optimizer Unitary Large, BACnet MS/TP: 24 puntos (16 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: ES24 (IP), TS24 (T1L), WAS24 (WiFi)', uio: 16, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'N-ADV-112-H-C', desc: 'Optimizer Advanced con módulos IO (sin entradas/salidas propias): 2 puertos RS485, hasta 64 módulos por canal', maxMod: 128, fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo: 64 × 2 canales)' },
        { cod: 'N-ADV-133-H-C', desc: 'Optimizer Advanced con módulos IO (sin entradas/salidas propias): 3 puertos RS485, hasta 64 módulos por canal', maxMod: 192, fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo: 64 × 3 canales)' }
      ],
      modulos: [
        { cod: 'IO-8UIO-S-P', desc: 'Módulo Optimizer IO de 8 entradas/salidas universales (tornillo: IO-8UIO-S-S; con HOA: IOD-8UIO-S-P)', uio: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4UIO-S-P', desc: 'Módulo Optimizer IO de 4 entradas/salidas universales (tornillo: IO-4UIO-S-S; con HOA: IOD-4UIO-S-P)', uio: 4, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-8AO-S-P', desc: 'Módulo Optimizer IO de 8 salidas analógicas (tornillo: IO-8AO-S-S; con HOA: IOD-8AO-S-P)', ao: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-8DI-S-P', desc: 'Módulo Optimizer IO de 8 entradas digitales (tornillo: IO-8DI-S-S)', bi: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4DOR-S-P', desc: 'Módulo Optimizer IO de 4 salidas digitales de relé (tornillo: IO-4DOR-S-S; con HOA: IOD-4DOR-S-P)', bo: 4, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4DORE-S-P', desc: 'Módulo Optimizer IO de 4 salidas digitales de relé reforzado (tornillo: IO-4DORE-S-S; con HOA: IOD-4DORE-S-P)', bo: 4, fuente: 'Optimizer en Español, SKUs disponibles' }
      ],
      motores: [
        { cod: 'N-ADV-112-H-C', maxDisp: 128, desc: 'Optimizer Advanced (servidor IoT edge): 1 Ethernet, 1 IP conmutado, 2 RS485, HMI y Touch Flake. Máx. = 64 dispositivos × 2 puertos', fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo derivado)' },
        { cod: 'N-ADV-133-H-C', maxDisp: 192, desc: 'Optimizer Advanced: 1 Ethernet, 3 IP conmutados, 3 RS485, HMI y Touch Flake. Máx. = 64 dispositivos × 3 puertos', fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo derivado)' },
        { cod: 'N-ADV-134-H-C', maxDisp: 256, desc: 'Optimizer Advanced: 1 Ethernet, 3 IP conmutados, 4 RS485, HMI y Touch Flake (próximo lanzamiento). Máx. = 64 dispositivos × 4 puertos', fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo derivado)' }
      ]
    },
    Schneider: {
      nombre: 'Schneider Electric (EcoStruxure Building Operation)',
      maxModulosPorBase: 10,
      bus: 'B', // troncal BACnet MS/TP / Modbus entre controladores; la LAN IP llega al servidor de automatización
      confirmar: true,
      nota: 'Datos por confirmar con Schneider Electric: SpaceLogic Automation Server AS-P con módulos de E/S SpaceLogic (UI-16, DI-16, DO-FA-12, AO-8) sobre base de terminales Central I/O (SXWTBIOW110001). La cantidad máxima de módulos por servidor y de dispositivos por servidor es una estimación conservadora: verifique en la hoja de datos de AS-P / AS-B y en la guía de hardware de EcoStruxure Building Operation. Los modelos con ventilador/HOA (sufijo -H) y las referencias exactas (SXW…) se completan en la pestaña "Catálogo de controladores".',
      bases: [
        { cod: 'SXWASPXX10001', desc: 'SpaceLogic Automation Server AS-P (servidor de automatización BACnet/IP, Modbus; sin entradas/salidas propias, se amplía con módulos de E/S)', maxMod: 32, fuente: 'EcoStruxure Building Operation — por confirmar' }
      ],
      modulos: [
        { cod: 'UI-16 (SXWUI16XX10001)', desc: 'Módulo SpaceLogic de 16 entradas universales', ui: 16, fuente: 'Hoja de datos SpaceLogic UI-16' },
        { cod: 'DI-16 (SXWDI16XX10001)', desc: 'Módulo SpaceLogic de 16 entradas digitales', bi: 16, fuente: 'Hoja de datos SpaceLogic DI-16' },
        { cod: 'DO-FA-12 (SXWDOA12X10001)', desc: 'Módulo SpaceLogic de 12 salidas digitales de relé Form A (versión con HOA: DO-FA-12-H)', bo: 12, fuente: 'Hoja de datos SpaceLogic DO-FA-12' },
        { cod: 'AO-8 (SXWAO8XXX10001)', desc: 'Módulo SpaceLogic de 8 salidas analógicas (0-10 V / 0-20 mA)', ao: 8, fuente: 'Hoja de datos SpaceLogic AO-8' }
      ],
      motores: [
        { cod: 'SXWASPXX10001', maxDisp: 100, desc: 'SpaceLogic Automation Server AS-P como servidor de la red (capacidad por confirmar)', fuente: 'EcoStruxure Building Operation — por confirmar' }
      ]
    }
  }
};
