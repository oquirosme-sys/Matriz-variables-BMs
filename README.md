# Matriz de puntos BMS

Herramienta HTML (sin compilación) para llenar la matriz de variables de un BMS, basada en `Fairfield_Guayabos_BMS_Matriz_de_Puntos_2.xlsx`.
Abrir `index.html` (o publicar la carpeta en GitHub Pages). Los datos se guardan por ahora en el navegador (localStorage).

## Pestañas
1. **Proyecto**: datos del proyecto, niveles y controladores (CP/CS, nombre `TIPO-NIVEL-NN`).
2. **Diagrama**: red de controladores por nivel (SVG). Exporta DXF para AutoCAD, PDF para anexos en hoja carta con membrete y DXF/PDF en láminas de 1100 × 750 mm con el cajetín Sinergia.
3. **Equipos por nivel**: se escoge el equipo del catálogo y la cantidad; se cargan sus variables. Controlador automático o manual.
4. **Resumen**: AI/AO/DI/DO/INT por nivel, controlador, sistema y matriz nivel × controlador; exporta a Excel.
5. **Controladores**: selección automática (con ajuste manual) para JCI, Honeywell o Schneider, protocolo BACnet/IP (por defecto) o MS/TP, lista de materiales, motor de red y licencias de software por hardware (Honeywell). Exporta a Word, PDF y Excel.
6. **Secuencias**: secuencias de operación ligadas en vivo al proyecto, con exportación e importación en Word (formato Sinergia), anexos generados (diagrama, resúmenes y totales por nivel, controladores y dispositivos, variables por controlador) y validación contra el estándar del hotel.
- **Catálogo de variables**: variables por tipo de equipo (sin equipos repetidos), editable.
- **Catálogo de controladores**: modelos, canales y motores de red por marca, editable. Los datos de Honeywell son de referencia, por confirmar.

## Paso 2 (pendiente): Supabase
Toda la persistencia está en `js/store.js` (`BMS.Repo`, métodos asíncronos). Se reemplaza esa capa por Supabase sin tocar las pestañas.
Tablas previstas: proyectos, niveles, controladores, equipos_proyecto, catalogo_tipos, catalogo_puntos, catalogo_controladores.
