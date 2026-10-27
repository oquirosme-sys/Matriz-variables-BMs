/* Catálogo base de controladores por marca.
   Canales: uio = entrada/salida universal (Honeywell), ui = entrada universal, bi = entrada binaria, co = salida configurable, bo = salida binaria, ao = salida analógica.
   JCI: tomado de la hoja JCI_Catalogo del Excel (LIT-1900346 / LIT-1900349 y Guía de configuración Metasys 12.0).
   Honeywell: Optimizer en Español (Honeywell LATAM 2023). Se corrigen en la pestaña "Catálogo de controladores". */
window.BMS_CATALOGO_CONTROLADORES = {
  version: 2, // sube al cambiar los datos base: reemplaza la marca Honeywell guardada en el navegador
  marcas: {
    JCI: {
      nombre: 'Johnson Controls (Metasys)',
      maxModulosPorBase: 10,
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
      maxModulosPorBase: 32,
      confirmar: false,
      nota: 'Fuente: presentación "Optimizer en Español" (Honeywell LATAM, 2023). UIO = entrada/salida universal (sirve como AI, DI, AO o DO). Falta confirmar con Honeywell: expansión de los Unitary con módulos IO por Modbus RTU (máx. 32 dispositivos por canal) y los códigos de versión de comunicación (MS/TP, T1L, WiFi).',
      bases: [
        { cod: 'UN-RS0844ES24NMC', desc: 'Optimizer Unitary Small, BACnet IP: 16 puntos (8 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485', uio: 8, bo: 8, maxMod: 32, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'UN-RL1644ES24NMC', desc: 'Optimizer Unitary Large, BACnet IP: 24 puntos (16 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485', uio: 16, bo: 8, maxMod: 32, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' }
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
    }
  }
};
