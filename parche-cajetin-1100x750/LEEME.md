# Parche: láminas 1100 × 750 mm con cajetín Sinergia (DXF y PDF)

Agrega a una herramienta que dibuja un diagrama en SVG la salida en láminas de 1100 × 750 mm
(plantilla `D-01-2 SINERGIA CAJETÍN 1100X750`): el diagrama se reparte en las láminas necesarias,
cortando en los límites que la herramienta indique, y cada lámina lleva marco, cajetín y su parte del dibujo.

## Contenido
- `js/cajetin.js`  módulo nuevo (cajetín, reparto en láminas, DXF y PDF). Se copia tal cual.
- `js/dxf.js`      escritor DXF completo (mm, Century Gothic, línea DEMOLISHED, cortes en círculos de clave, modo por franja). Reemplaza al `dxf.js` anterior.
- `parche-cajetin.patch`  mismos cambios como diff de git (`git apply`), por si la herramienta ya tiene la misma base.

## Requisitos de la herramienta destino
1. Objeto global `BMS` (o cambiar el nombre en los dos archivos).
2. Un `<svg>` del diagrama con `viewBox` en px a 72 dpi y estos atributos:
   - `data-cortes`: posiciones Y (separadas por coma) donde se puede cortar entre láminas (límites entre lazos/secciones).
   - `data-fin`: Y donde termina el dibujo (si el SVG trae su propio cajetín al pie, aquí empieza).
3. `BMS.estado.proyecto` con `fecha` y `propietario`, y `BMS.estado.diagrama.lamina` (código tipo `BMS-01`). Se ajusta en `datosLamina()` de `cajetin.js`.
4. Para el PDF: `JSZip` y `window.BMS_DOCX_BASE` (de ahí se toma el logo), y en el CSS las reglas de `#pdf-doc` / `body.pdf-imprime` (ver el diff de `css/bms.css` en el .patch).
5. `BMS.descargar(nombre, texto, tipo)` para bajar el archivo.

## Pasos
1. Copiar `js/cajetin.js` y `js/dxf.js` a la carpeta `js/` de la herramienta.
2. En `index.html`: `<script src="js/dxf.js"></script>` y después `<script src="js/cajetin.js"></script>`.
3. En el SVG, poner `data-cortes` y `data-fin` (ver `p-diagrama.js` en el .patch).
4. Agregar los botones (ver el .patch):
   - DXF: `BMS.descargar('diagrama-laminas-1100x750.dxf', BMS.dxfLaminas(svg.cloneNode(true)), 'application/dxf')`
   - PDF: `BMS.pdfLaminas(svg, 'Título del documento')`
5. Agregar al CSS las dos reglas de `.pdf-lamina` y las de `#pdf-doc` impresión.

## Misma escala en todas las láminas
`repartir()` elige una sola escala para todo el diagrama (la más grande, entre 100 % y 88 %, que da el menor número de láminas)
y la aplica igual a todas; en el ejemplo: 2 láminas a 0.977. Para forzar 1:1 exacto, dejar `[1]` en la lista de factores de `repartir()`.

## Personalizar el cajetín
Sin tocar `cajetin.js`: `BMS.cajetinDatos = (i, n, d) => ({ lamina: 'EL-0' + (i + 1), titulo: '...', rev: 'B', desc: '...', dibujo: 'XX', propietario: '...' });`
Si el SVG no trae `data-fin`, se toma todo el alto del dibujo.

## Para el PDF
En el cuadro de impresión: «Guardar como PDF», papel A0 horizontal (o Arch E 36×48 in; 1100×750 no está en la lista y un papel menor recorta),
escala 100 % (no «Personalizada»), márgenes «Ninguno» y «Gráficos de fondo» activado.
«Guardar como PDF», tamaño de papel el del documento (1100 × 750 mm), márgenes «Ninguno», sin encabezados y pies.

## Limitaciones conocidas
- En el DXF el logo va como texto «SINERGIA / INGENIERÍA» (el PDF lleva el logo real).
- Las láminas quedan en espacio modelo, una al lado de otra a 1200 mm.
- Rev. «A», «Emisión para revisión» y Dibujo «SI» están fijos en `datosLamina()`.
