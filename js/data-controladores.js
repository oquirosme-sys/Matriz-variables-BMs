/* Catálogo base de controladores por marca.
   Canales: ui = entrada universal, bi = entrada binaria, co = salida configurable, bo = salida binaria, ao = salida analógica.
   JCI: tomado de la hoja JCI_Catalogo del Excel (LIT-1900346 / LIT-1900349 y Guía de configuración Metasys 12.0).
   Honeywell: VALORES DE REFERENCIA POR CONFIRMAR (confirmar: true). Se corrigen en la pestaña "Catálogo de controladores". */
window.BMS_CATALOGO_CONTROLADORES = {
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
      nombre: 'Honeywell (Spyder / WEBs-N4)',
      maxModulosPorBase: 10,
      confirmar: true,
      bases: [
        { cod: 'PUB4024S', desc: 'Spyder BACnet programable, 10 puntos [por confirmar]', ui: 4, bi: 0, co: 0, bo: 4, ao: 2, fuente: 'Por confirmar con Honeywell' },
        { cod: 'PUB6438S', desc: 'Spyder BACnet programable, 14 puntos [por confirmar]', ui: 6, bi: 2, co: 0, bo: 4, ao: 2, fuente: 'Por confirmar con Honeywell' }
      ],
      modulos: [
        { cod: 'EXP-8UI', desc: 'Módulo de expansión 8 entradas universales [genérico, por confirmar]', ui: 8, bi: 0, co: 0, bo: 0, ao: 0, fuente: 'Por confirmar con Honeywell' },
        { cod: 'EXP-8BI', desc: 'Módulo de expansión 8 entradas binarias [genérico, por confirmar]', ui: 0, bi: 8, co: 0, bo: 0, ao: 0, fuente: 'Por confirmar con Honeywell' },
        { cod: 'EXP-8BO', desc: 'Módulo de expansión 8 salidas binarias (relé) [genérico, por confirmar]', ui: 0, bi: 0, co: 0, bo: 8, ao: 0, fuente: 'Por confirmar con Honeywell' },
        { cod: 'EXP-4AO', desc: 'Módulo de expansión 4 salidas analógicas [genérico, por confirmar]', ui: 0, bi: 0, co: 0, bo: 0, ao: 4, fuente: 'Por confirmar con Honeywell' },
        { cod: 'EXP-MIX', desc: 'Módulo de expansión mixto 4 UI + 4 BO + 2 AO [genérico, por confirmar]', ui: 4, bi: 0, co: 0, bo: 4, ao: 2, fuente: 'Por confirmar con Honeywell' }
      ],
      motores: [
        { cod: 'WEBs-N4 (100)', maxDisp: 100, desc: 'Supervisor WEBs-N4, licencia de 100 dispositivos [por confirmar]', fuente: 'Por confirmar con Honeywell' },
        { cod: 'WEBs-N4 (250)', maxDisp: 250, desc: 'Supervisor WEBs-N4, licencia de 250 dispositivos [por confirmar]', fuente: 'Por confirmar con Honeywell' },
        { cod: 'WEBs-N4 (500)', maxDisp: 500, desc: 'Supervisor WEBs-N4, licencia de 500 dispositivos [por confirmar]', fuente: 'Por confirmar con Honeywell' }
      ]
    }
  }
};
