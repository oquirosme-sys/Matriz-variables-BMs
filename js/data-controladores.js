/* Catálogo base de controladores por marca.
   Canales: uio = entrada/salida universal (Honeywell), ui = entrada universal, bi = entrada binaria, co = salida configurable, bo = salida binaria, ao = salida analógica.
   JCI: tomado de la hoja JCI_Catalogo del Excel (LIT-1900346 / LIT-1900349 y Guía de configuración Metasys 12.0).
   Honeywell: Optimizer en Español (Honeywell LATAM 2023). Schneider: EcoStruxure Building Operation (SpaceLogic AS-P y módulos de E/S), por confirmar con el proveedor. Se corrigen en la pestaña "Catálogo de controladores".
   Schneider (v7): gateways y módulos de comunicación de distribución eléctrica de la presentación Smart Systems y la hoja de datos del Panel Server PAS600 (ver nota de la marca). */
window.BMS_CATALOGO_CONTROLADORES = {
  version: 9, // sube al cambiar los datos base: reemplaza la marca Honeywell guardada en el navegador y agrega las marcas nuevas
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
      nota: 'Fuente: presentación "Optimizer en Español" (Honeywell LATAM, 2023). UIO = entrada/salida universal (sirve como AI, DI, AO o DO). Por defecto se seleccionan controladores BACnet/IP (Unitary ES24) y módulos IO con terminales de tornillo (-S-S, los disponibles en Centroamérica); el selector de protocolo permite cambiar a BACnet MS/TP. Los módulos IO se conectan al Unitary por Modbus RTU (roadmap, lámina 14); el límite de 3 módulos por Unitary sale de la lámina de integración Modbus RTU (cadena de 3 dispositivos) y es conservador: confirmar con Honeywell. Cuando un panel necesitaría más de 2 Unitary, la selección automática usa un Optimizer Advanced con módulos IO (hasta 64 módulos por canal RS485).',
      /* Licenciamiento Niagara (Optimizer en Español, láminas 36-38 y 77-80). El hardware que coincide con "aplica" lleva una licencia núcleo según dispositivos, puntos globales y puntos del bus de paneles; se mejora con las licencias de ampliación. */
      licencias: {
        aplica: '^N-ADV',
        nucleo: [
          { cod: 'N-ADV-00050-100PC', desc: 'Licencia núcleo Advanced: 3 dispositivos, 50 puntos globales, 100 puntos del bus de paneles y 18 meses de SMA inicial, + E/S', disp: 3, ptsGlobal: 50, ptsBus: 100 },
          { cod: 'N-ADV-00500-100PC', desc: 'Licencia núcleo Advanced: 10 dispositivos, 500 puntos globales, 100 puntos del bus de paneles y 18 meses de SMA inicial, + E/S', disp: 10, ptsGlobal: 500, ptsBus: 100 },
          { cod: 'N-ADV-01250-255PC', desc: 'Licencia núcleo Advanced: 25 dispositivos, 1250 puntos globales, 255 puntos del bus de paneles y 18 meses de SMA inicial, + E/S', disp: 25, ptsGlobal: 1250, ptsBus: 255 },
          { cod: 'N-ADV-05000-255PC', desc: 'Licencia núcleo Advanced: 100 dispositivos, 5000 puntos globales, 255 puntos del bus de paneles y 18 meses de SMA inicial, + E/S', disp: 100, ptsGlobal: 5000, ptsBus: 255 },
          { cod: 'N-ADV-10000-255PC', desc: 'Licencia núcleo Advanced: 200 dispositivos, 10000 puntos globales, 255 puntos del bus de paneles y 18 meses de SMA inicial, + E/S', disp: 200, ptsGlobal: 10000, ptsBus: 255 }
        ],
        mejorasBus: [
          { cod: 'N-ADV-0100P-UP', desc: 'Licencia de ampliación a 100 puntos del bus de paneles', ptsBus: 100 },
          { cod: 'N-ADV-0255P-UP', desc: 'Licencia de ampliación a 255 puntos del bus de paneles', ptsBus: 255 }
        ],
        mejorasGlobal: [
          { cod: 'PIN-DEV-50', desc: '50 dispositivos adicionales, 2500 puntos globales de capacidad', disp: 50, ptsGlobal: 2500 },
          { cod: 'PIN-DEV-25', desc: '25 dispositivos adicionales, 1250 puntos globales de capacidad', disp: 25, ptsGlobal: 1250 },
          { cod: 'PIN-DEV-10', desc: '10 dispositivos adicionales, 500 puntos globales de capacidad', disp: 10, ptsGlobal: 500 },
          { cod: 'PIN-DEV-2', desc: '2 dispositivos adicionales, 100 puntos globales de capacidad', disp: 2, ptsGlobal: 100 },
          { cod: 'PIN-DEV-1', desc: '1 dispositivo adicional, 50 puntos globales de capacidad', disp: 1, ptsGlobal: 50 }
        ],
        supervisor: [
          { cod: 'WEB-S-0-N4', sma: 'SUP-0-SMA-INIT', conex: 0, desc: 'Supervisor Niagara N4 con 0 conexiones de red Niagara (solo dispositivos IP de campo)' },
          { cod: 'WEB-S-1-N4', sma: 'SUP-1-SMA-INIT', conex: 1, desc: 'Supervisor Niagara N4 con 1 conexión de red Niagara' },
          { cod: 'WEB-S-2-N4', sma: 'SUP-2-SMA-INIT', conex: 2, desc: 'Supervisor Niagara N4 con 2 conexiones de red Niagara' },
          { cod: 'WEB-S-3-N4', sma: 'SUP-3-SMA-INIT', conex: 3, desc: 'Supervisor Niagara N4 con 3 conexiones de red Niagara' },
          { cod: 'WEB-S-10-N4', sma: 'SUP-10-SMA-INIT', conex: 10, desc: 'Supervisor Niagara N4 con 10 conexiones de red Niagara' },
          { cod: 'WEB-S-100-N4', sma: 'SUP-100-SMA-INIT', conex: 100, desc: 'Supervisor Niagara N4 con 100 conexiones de red Niagara' },
          { cod: 'WEB-S-UNL-N4', sma: 'SUP-UNL-SMA-INIT', conex: 1e9, desc: 'Supervisor Niagara N4 con conexiones de red Niagara ilimitadas' }
        ],
        supervisorDisp: [
          { cod: 'SUP-DEVICE-10', desc: 'Núcleo de supervisor de 10 dispositivos (500 puntos; incluye drivers estándar)', disp: 10, pts: 500 },
          { cod: 'SUP-DEVICE-25', desc: 'Núcleo de supervisor de 25 dispositivos (1250 puntos; incluye drivers estándar)', disp: 25, pts: 1250 },
          { cod: 'SUP-DEVICE-50', desc: 'Núcleo de supervisor de 50 dispositivos (2500 puntos; incluye drivers estándar)', disp: 50, pts: 2500 },
          { cod: 'SUP-DEVICE-100', desc: 'Núcleo de supervisor de 100 dispositivos (5000 puntos; incluye drivers estándar)', disp: 100, pts: 5000 },
          { cod: 'SUP-DEVICE-200', desc: 'Núcleo de supervisor de 200 dispositivos (10000 puntos; incluye drivers estándar)', disp: 200, pts: 10000 }
        ],
        nota: 'Las licencias núcleo incluyen 18 meses de mantenimiento inicial (SMA); el mantenimiento de 3 o 5 años (SMA-xxxx-3YR / 5YR) es opcional. Los controladores Optimizer Unitary no llevan licencia Niagara propia en la documentación disponible: confirmar con Honeywell.'
      },
      bases: [
        { cod: 'UN-RS0844ES24NMC', com: 'ip', desc: 'Optimizer Unitary Small, BACnet/IP: 16 puntos (8 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: MS24 (BACnet MS/TP), TS24 (T1L), WAS24 (WiFi)', uio: 8, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'UN-RS0844MS24NMC', com: 'mstp', desc: 'Optimizer Unitary Small, BACnet MS/TP: 16 puntos (8 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: ES24 (IP), TS24 (T1L), WAS24 (WiFi)', uio: 8, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'UN-RL1644ES24NMC', com: 'ip', desc: 'Optimizer Unitary Large, BACnet/IP: 24 puntos (16 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: MS24 (BACnet MS/TP), TS24 (T1L), WAS24 (WiFi)', uio: 16, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'UN-RL1644MS24NMC', com: 'mstp', desc: 'Optimizer Unitary Large, BACnet MS/TP: 24 puntos (16 UIO, 4 SSR, 4 relés); 1 puerto Modbus RS485. Otras versiones de comunicación: ES24 (IP), TS24 (T1L), WAS24 (WiFi)', uio: 16, bo: 8, maxMod: 3, maxBases: 2, fuente: 'Optimizer Unitary, rev. 1.05 (jul-2023)' },
        { cod: 'N-ADV-112-H-C', desc: 'Optimizer Advanced con módulos IO (sin entradas/salidas propias): 2 puertos RS485, hasta 64 módulos por canal', maxMod: 128, fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo: 64 × 2 canales)' },
        { cod: 'N-ADV-133-H-C', desc: 'Optimizer Advanced con módulos IO (sin entradas/salidas propias): 3 puertos RS485, hasta 64 módulos por canal', maxMod: 192, fuente: 'Optimizer en Español, SKUs y capacidad de buses (cálculo: 64 × 3 canales)' }
      ],
      modulos: [
        { cod: 'IO-8UIO-S-S', desc: 'Módulo Optimizer IO de 8 entradas/salidas universales (terminales de tornillo, disponibles en Centroamérica; con HOA: IOD-8UIO-S-S; terminales push: IO-8UIO-S-P)', uio: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4UIO-S-S', desc: 'Módulo Optimizer IO de 4 entradas/salidas universales (terminales de tornillo, disponibles en Centroamérica; con HOA: IOD-4UIO-S-S; terminales push: IO-4UIO-S-P)', uio: 4, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-8AO-S-S', desc: 'Módulo Optimizer IO de 8 salidas analógicas (terminales de tornillo, disponibles en Centroamérica; con HOA: IOD-8AO-S-S; terminales push: IO-8AO-S-P)', ao: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-8DI-S-S', desc: 'Módulo Optimizer IO de 8 entradas digitales (terminales de tornillo, disponibles en Centroamérica; terminales push: IO-8DI-S-P)', bi: 8, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4DOR-S-S', desc: 'Módulo Optimizer IO de 4 salidas digitales de relé (terminales de tornillo, disponibles en Centroamérica; con HOA: IOD-4DOR-S-S; terminales push: IO-4DOR-S-P)', bo: 4, fuente: 'Optimizer en Español, SKUs disponibles' },
        { cod: 'IO-4DORE-S-S', desc: 'Módulo Optimizer IO de 4 salidas digitales de relé reforzado (terminales de tornillo, disponibles en Centroamérica; con HOA: IOD-4DORE-S-S; terminales push: IO-4DORE-S-P)', bo: 4, fuente: 'Optimizer en Español, SKUs disponibles' }
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
      nota: 'Datos por confirmar con Schneider Electric: SpaceLogic Automation Server AS-P con módulos de E/S SpaceLogic (UI-16, DI-16, DO-FA-12, AO-8) sobre base de terminales Central I/O (SXWTBIOW110001). La cantidad máxima de módulos por servidor y de dispositivos por servidor es una estimación conservadora: verifique en la hoja de datos de AS-P / AS-B y en la guía de hardware de EcoStruxure Building Operation. Integración de distribución eléctrica (no ocupa canales del servidor; entra por gateway): EcoStruxure Panel Server PAS600 (gateway universal Ethernet / Modbus RTU / inalámbrico IEEE 802.15.4, 110-277 V CA/CC, 128 esclavos Modbus RTU y 100 inalámbricos, 2 RJ45 + 1 RS485, 512 MB, riel DIN); módulo IFE LV434001 (1 interruptor a Ethernet) y LV434002 (1 interruptor + gateway Modbus para hasta 12 módulos IFM y 20 dispositivos, 128 MB de registro); IFM LV434000 (interfaz Modbus RTU, direcciones 01-99); módulo de E/S LV434063 (6 DI, 3 DO, 1 AI PT100; cuna y ERMS); Com\'X 200/210/510 (servidor de energía con gateway Ethernet). Los modelos con ventilador/HOA (sufijo -H) y las referencias exactas (SXW…) se completan en la pestaña "Catálogo de controladores".',
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
