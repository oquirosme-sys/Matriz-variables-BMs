/* Traducción español → inglés del documento de secuencias, con glosario técnico integrado (sin internet).
   Traduce frases fijas del documento y de los anexos, y los nombres de equipos y variables del catálogo palabra por palabra
   (con reordenamiento «A de B» → «B A»). Lo que no se pueda traducir queda en rojo para revisión. */
(function () {
  const FRASES = [
    /* portada, alcance y arquitectura */
    [/^Secuencias de operación del sistema de alarma contra incendio$/i, 'Sequences of Operation – Fire Alarm System'],
    [/^Secuencias de operación del BMS\/BAS$/i, 'BMS/BAS Sequences of Operation'],
    [/^Documento complementario a la Matriz de Puntos$/i, 'Companion document to the Points Schedule'],
    [/^Los valores entre corchetes \[ \] son propuestas iniciales que debe validar el diseñador mecánico o eléctrico antes de emitir\.?$/i, 'Values in square brackets [ ] are initial proposals that the mechanical or electrical designer must validate before issue.'],
    [/^Este documento ofrece la descripción de las secuencias de operación de los sistemas monitoreados o controlados por el BMS para el Proyecto (.+?), ubicado en (.*?): (.+?) equipos con (.+?)\. Los números de punto corresponden a la Matriz de Puntos y cada sección lleva su referencia SOO-n\. Además, proporciona la base para la continuación del proceso de diseño\. La documentación de diseño será elaborada por el especialista de cada sistema que constituye el proyecto ejecutivo\.$/i, (m, a, u, b, c) => 'This document provides the description of the sequences of operation of the systems monitored or controlled by the BMS for the ' + a + ' Project, located in ' + u + ': ' + b + ' pieces of equipment with ' + c + '. Point numbers correspond to the Points Schedule and each section carries its SOO-n reference. It also provides the basis for continuing the design process. The design documentation will be prepared by the specialist of each system that makes up the executive project.'],
    [/^Alcance, referencias y arquitectura$/i, 'Scope, references and architecture'],
    [/^(\d+)\. Alcance, referencias y arquitectura$/i, (m, n) => n + '. Scope, references and architecture'],
    [/^(\d+(?:\.\d+)?) Alcance$/i, (m, n) => n + ' Scope'],
    [/^(\d+(?:\.\d+)?) Referencias$/i, (m, n) => n + ' References'],
    [/^(\d+(?:\.\d+)?) Arquitectura general$/i, (m, n) => n + ' General architecture'],
    [/^(\d+(?:\.\d+)?) Prioridad de comandos$/i, (m, n) => n + ' Command priority'],
    [/^(\d+(?:\.\d+)?) Criterios generales de alarma y tendencia$/i, (m, n) => n + ' General alarm and trend criteria'],
    [/^\[Estándar del propietario, edición\]$/i, '[Owner standard, edition]'],
    [/^ASHRAE 135 \(BACnet\) y ASHRAE Guideline 36\.?$/i, 'ASHRAE 135 (BACnet) and ASHRAE Guideline 36.'],
    [/^Red BACnet\/IP sobre Ethernet entre servidor, controlador principal y gateways; troncal BACnet MS\/TP entre controladores\. (.+?) controladores en (.+?) niveles; marca (.+?)\.$/i, (m, a, b, c) => 'BACnet/IP network over Ethernet between the server, main controller and gateways; BACnet MS/TP trunk between controllers. ' + a + ' controllers on ' + b + ' levels; brand ' + c + '.'],
    [/^UPS con 4 horas de respaldo para el servidor y los controladores, y (.+?) % de capacidad de reserva en puntos\.$/i, (m, a) => 'UPS with 4 hours of backup for the server and controllers, and ' + a + ' % spare point capacity.'],
    [/^De mayor a menor: \(1\) seguridad de vida desde el FACP, \(2\) selector HOA local en el equipo, \(3\) protecciones del equipo, \(4\) modo emergencia del BMS, \(5\) comandos manuales del operador, \(6\) horarios y lazos automáticos\. Un nivel superior siempre anula al inferior\.$/i, 'From highest to lowest: (1) life safety from the FACP, (2) local HOA selector at the equipment, (3) equipment protections, (4) BMS emergency mode, (5) manual operator commands, (6) schedules and automatic loops. A higher level always overrides the lower one.'],
    [/^Cada entrada analógica tiene al menos una alarma alta y una baja; cada comando tiene al menos un estado de retroalimentación\.$/i, 'Every analog input has at least one high and one low alarm; every command has at least one feedback status.'],
    [/^Alarmas en tres niveles: crítica, mayor y aviso\.$/i, 'Alarms at three levels: critical, major and notice.'],
    [/^Tendencias: 15 min para temperaturas y humedades, 1 h para medición y filtros, y por cambio de valor para estados; retención de un año\.$/i, 'Trends: 15 min for temperatures and humidities, 1 h for metering and filters, and change-of-value for statuses; one-year retention.'],
    [/^Anexo A\. Parámetros por confirmar$/i, 'Annex A. Parameters to confirm'],
    [/^Parámetros por confirmar antes de emitir$/i, 'Parameters to confirm before issue'],
    [/^Anexo ([A-Z])\. (.+)$/i, (m, l, r) => 'Annex ' + l + '. ' + R(r)],
    [/^SOO-(\d+)\. (.+)$/i, (m, n, r) => 'SOO-' + n + '. ' + R(r)],
    /* bloques vivos */
    [/^\*?\*?Equipos:\*?\*? (.+)$/i, (m, r) => '**Equipment:** ' + R(r)],
    [/^\*?\*?Equipos:\*?\*? ningún equipo cargado todavía en «(.+)»\.$/i, (m, r) => '**Equipment:** no equipment loaded yet in “' + R(r) + '”.'],
    [/^Sin equipos cargados en «(.+)»\.$/i, (m, r) => 'No equipment loaded in “' + R(r) + '”.'],
    [/^\*\*Puntos del sistema:\*\* AI (\d+), AO (\d+), DI (\d+), DO (\d+) e INT (\d+) \((\d+) en total\)\.$/i, (m, a, b, c, d, e, f) => '**System points:** AI ' + a + ', AO ' + b + ', DI ' + c + ', DO ' + d + ' and INT ' + e + ' (' + f + ' in total).'],
    [/^AI (\d+), AO (\d+), DI (\d+), DO (\d+) e INT (\d+)$/i, (m, a, b, c, d, e) => 'AI ' + a + ', AO ' + b + ', DI ' + c + ', DO ' + d + ' and INT ' + e],
    [/^Equipos y variables — (.+)$/i, (m, r) => 'Equipment and variables — ' + R(r)],
    /* secciones redactadas con «Completar la secuencia» */
    [/^\*\*Habilitación y horario:\*\* \[por definir\]\.?$/i, '**Enabling and schedule:** [to be defined].'],
    [/^\*\*Control:\*\* \[por definir\]\.?$/i, '**Control:** [to be defined].'],
    [/^\*\*Alarmas:\*\* \[por definir\]\.?$/i, '**Alarms:** [to be defined].'],
    [/^\*\*Habilitación y horario:\*\* el BMS habilitará y deshabilitará (.+?) según el horario semanal y el calendario de excepciones, que serán editables desde la interfaz web; el selector local en el equipo tendrá prioridad sobre el comando del BMS\. (.*)$/i, (m, a, r) => '**Enabling and schedule:** the BMS will enable and disable ' + L(a) + ' according to the weekly schedule and the exceptions calendar, which will be editable from the web interface; the local selector at the equipment will have priority over the BMS command. ' + R(r)],
    [/^\*\*Habilitación y horario:\*\* el BMS supervisará el sistema sin comandar equipos y registrará los estados con su hora\. (.*)$/i, (m, r) => '**Enabling and schedule:** the BMS will supervise the system without commanding equipment and will log statuses with their time stamp. ' + R(r)],
    [/^\*\*Control:\*\* el BMS ajustará (.+?) dentro de los límites definidos por el diseño y vigilará la respuesta del equipo; ante pérdida de comunicación el equipo continuará en su último modo seguro\. (.*)$/i, (m, a, r) => '**Control:** the BMS will adjust ' + L(a) + ' within the limits defined by the design and will monitor the equipment response; upon loss of communication the equipment will continue in its last safe mode. ' + R(r)],
    [/^\*\*Control:\*\* el equipo mantendrá su control propio y el BMS leerá sus variables principales; ante pérdida de comunicación el equipo continuará en su último modo seguro\. (.*)$/i, (m, r) => '**Control:** the equipment will keep its own control and the BMS will read its main variables; upon loss of communication the equipment will continue in its last safe mode. ' + R(r)],
    [/^\*\*Alarmas:\*\* se generarán alarmas para (.+?), con prioridad, reconocimiento por el operador y tendencia con retención de un año\. (.*)$/i, (m, a, r) => '**Alarms:** alarms will be generated for ' + L(a) + ', with priority, operator acknowledgement and trending with one-year retention. ' + R(r)],
    [/^\*\*Alarmas:\*\* toda entrada analógica tendrá alarma alta y baja, y todo comando tendrá su estado de retroalimentación; las tendencias se retendrán un año\. (.*)$/i, (m, r) => '**Alarms:** every analog input will have high and low alarms, and every command will have its feedback status; trends will be retained for one year. ' + R(r)],
    [/^El diseñador deberá confirmar los horarios, las condiciones de arranque y los retardos\.$/i, 'The designer shall confirm the schedules, start conditions and delays.'],
    [/^El diseñador deberá confirmar los setpoints, los límites y los modos de operación\.$/i, 'The designer shall confirm the setpoints, limits and operating modes.'],
    [/^El diseñador deberá confirmar los umbrales, los retardos y la prioridad de cada alarma\.$/i, 'The designer shall confirm the thresholds, delays and priority of each alarm.'],
    [/^Requisitos del estándar por incorporar$/i, 'Standard requirements to be incorporated'],
    [/^Requisitos del estándar del hotel sobre operación y control que las secuencias deben tratar\. Lo marcado en rojo se debe redactar o confirmar antes de emitir\.$/i, 'Hotel standard requirements on operation and control that the sequences must address. Items in red must be written or confirmed before issue.'],
    [/^Cubierto en parte: .*$/i, 'Partially covered. Write how the sequence meets it and confirm the values.'],
    [/^No cubierto todavía\. Redactar cómo la secuencia lo cumple y confirmar los valores\.$/i, 'Not covered yet. Write how the sequence meets it and confirm the values.'],
    [/^Redactar cómo la secuencia lo cumple y confirmar los valores\.$/i, 'Write how the sequence meets it and confirm the values.'],
    /* anexos */
    [/^Lámina generada con los niveles, controladores, equipos y comunicaciones del proyecto\. Se presenta en partes a ancho de hoja para su lectura; el archivo editable \(SVG y DXF\) se obtiene en la herramienta de la matriz de puntos\.$/i, 'Drawing generated from the levels, controllers, equipment and communications of the project. It is shown in parts at full page width for readability; the editable file (SVG and DXF) is obtained from the points schedule tool.'],
    [/^Figura No\. (\d+) — Diagrama unifilar del BMS, parte (\d+) de (\d+)$/i, (m, a, b, c) => 'Figure No. ' + a + ' — BMS single-line diagram, part ' + b + ' of ' + c],
    [/^Diagrama unifilar del sistema de monitoreo y control$/i, 'Single-line diagram of the monitoring and control system'],
    [/^Resumen de variables y totales por nivel$/i, 'Summary of variables and totals per level'],
    [/^Las cantidades corresponden a la Matriz de Puntos del proyecto\. AI y AO son entradas y salidas analógicas, DI y DO son digitales; INT son puntos que llegan por integración de red o gateway y no ocupan canales del controlador\. La reserva aplicada a los puntos cableados es del (.+?) %\.$/i, (m, a) => 'Quantities correspond to the project Points Schedule. AI and AO are analog inputs and outputs, DI and DO are digital; INT are points that arrive through network or gateway integration and do not use controller channels. The spare capacity applied to hardwired points is ' + a + ' %.'],
    [/^Resumen de variables por sistema$/i, 'Summary of variables per system'],
    [/^Totales de variables por nivel$/i, 'Variable totals per level'],
    [/^Nota: "Cableados" suma AI, AO, DI y DO; "Con reserva" aplica el (.+?) % de reserva a cada tipo de canal\.$/i, (m, a) => 'Note: “Hardwired” adds AI, AO, DI and DO; “With spare” applies the ' + a + ' % spare to each channel type.'],
    [/^Lista de variables resumida por tipo de equipo$/i, 'Summary variable list by equipment type'],
    [/^Lista de controladores y dispositivos$/i, 'List of controllers and devices'],
    [/^Controladores con el modelo seleccionado para la marca (.+?), dispositivos de red e integraciones, y lista de materiales de controladores y módulos\. Los modelos se validan con el integrador antes de emitir\.$/i, (m, a) => 'Controllers with the model selected for the ' + a + ' brand, network devices and integrations, and bill of materials for controllers and modules. Models are validated with the integrator before issue.'],
    [/^Controladores del sistema$/i, 'System controllers'],
    [/^Dispositivos de red e integraciones$/i, 'Network devices and integrations'],
    [/^Lista de controladores y módulos$/i, 'List of controllers and modules'],
    [/^Sin hardware \(solo integración\)$/i, 'No hardware (integration only)'],
    [/^Motor de red \/ supervisor$/i, 'Network engine / supervisor'],
    [/^Gateway (.+)$/i, (m, r) => 'Gateway ' + r],
    [/^Equipo de red (.+)$/i, (m, r) => 'Network equipment ' + r],
    [/^Variables por controlador$/i, 'Variables per controller'],
    [/^Equipos y variables asignados a cada controlador\. Los equipos marcados como "\(red\)" se conectan por BACnet, Modbus o gateway: sus variables son internas del equipo y se cuentan como INT\.$/i, 'Equipment and variables assigned to each controller. Equipment marked “(network)” connects through BACnet, Modbus or gateway: its variables are internal to the equipment and are counted as INT.'],
    [/^Equipos y puntos de (.+)$/i, (m, r) => 'Equipment and points of ' + r],
    [/^Variables de (.+)$/i, (m, r) => 'Variables of ' + r],
    [/^Validación contra el estándar del hotel$/i, 'Validation against the hotel standard'],
    [/^Revisión de las secuencias y del proyecto contra «(.+?)»\. La revisión de requisitos compara términos y valores del estándar con el texto de las secuencias; no reemplaza la validación del diseñador\. Cumple: (\d+) · Parcial: (\d+) · No cumple o falta: (\d+)\.$/i, (m, a, b, c, d) => 'Review of the sequences and the project against “' + a + '”. The requirement review compares terms and values of the standard with the text of the sequences; it does not replace the designer’s validation. Meets: ' + b + ' · Partial: ' + c + ' · Does not meet or missing: ' + d + '.'],
    [/^Requisitos del estándar frente a las secuencias$/i, 'Standard requirements versus the sequences'],
    [/^Comprobaciones del proyecto$/i, 'Project checks'],
    [/^Sin observaciones$/i, 'No observations'],
    [/^No se encontraron diferencias\.$/i, 'No differences were found.'],
    [/^Cumple$/i, 'Meets'], [/^Parcial$/i, 'Partial'], [/^No cumple \/ falta$/i, 'Does not meet / missing'],
    [/^Sin tratar en las secuencias: (.+)\.$/i, (m, r) => 'Not addressed in the sequences: ' + r + '.'],
    [/^No aparece el valor del estándar: (.+)\.$/i, (m, r) => 'Standard value not found: ' + r + '.'],
    [/^Cubierto en las secuencias\.$/i, 'Covered in the sequences.'],
    [/^Sistema sin secuencia$/i, 'System without sequence'],
    [/^El proyecto tiene equipos en «(.+?)» pero no hay una sección de secuencia con ese tema\.$/i, (m, a) => 'The project has equipment in “' + R(a) + '” but there is no sequence section on that topic.'],
    [/^Equipos sin secuencia descrita$/i, 'Equipment without a described sequence'],
    [/^Entradas analógicas sin alarma$/i, 'Analog inputs without alarm'],
    [/^Comandos sin retroalimentación$/i, 'Commands without feedback'],
    [/^Valores propuestos por validar$/i, 'Proposed values to validate'],
    [/^Secuencias vacías$/i, 'Empty sequences'],
    [/^Todavía no hay secuencias redactadas\.$/i, 'No sequences have been written yet.'],
    [/^La reserva configurada es (.+?) % y el estándar pide 10 % \(15A\.15\.B\.3\.a\)\.$/i, (m, a) => 'The configured spare is ' + a + ' % and the standard requires 10 % (15A.15.B.3.a).'],
    [/^Reserva de puntos$/i, 'Point spare capacity'],
    [/^No se menciona en el texto de las secuencias: (.+)\.$/i, (m, r) => 'Not mentioned in the text of the sequences: ' + L(r) + '.'],
    [/^Cada entrada analógica debe tener alarma alta y baja \((.+?)\)\. Tipos con variables analógicas sin alarma definida: (.+)\.$/i, (m, a, r) => 'Every analog input must have a high and a low alarm (' + a + '). Types with analog variables without a defined alarm: ' + L(r) + '.'],
    [/^Cada comando debe tener un estado \((.+?)\)\. Equipos con comando y sin estado: (.+)\.$/i, (m, a, r) => 'Every command must have a status (' + a + '). Equipment with a command and no status: ' + L(r) + '.'],
    [/^(\d+) valores entre corchetes \[ \] pendientes de validar por el diseñador \(por ejemplo (.+)\)\.$/i, (m, n, r) => n + ' values in square brackets [ ] pending validation by the designer (for example ' + r + ').'],
    [/^Tabla No\. (\d+)$/i, (m, n) => 'Table No. ' + n],
    [/^Tabla No\.$/i, 'Table No.'],
    [/^Quien valida$/i, 'Validated by'], [/^Valor propuesto$/i, 'Proposed value'], [/^Parámetro$/i, 'Parameter']
  ];

  const D = {
    /* artículos, preposiciones y conectores */
    el: 'the', la: 'the', los: 'the', las: 'the', un: 'a', una: 'a', de: 'of', del: 'of the', al: 'to the', y: 'and', e: 'and', o: 'or', u: 'or', con: 'with', sin: 'without', para: 'for', por: 'per', en: 'in', 'según': 'per', sobre: 'on', desde: 'from', hasta: 'up to', entre: 'between', ante: 'upon', 'más': 'more', menos: 'less', cada: 'each', todo: 'all', toda: 'every', todos: 'all', todas: 'all', solo: 'only', su: 'its', sus: 'their', que: 'that', se: '', es: 'is', son: 'are', tiene: 'has', tienen: 'have', debe: 'must', 'cómo': 'how', como: 'as', este: 'this', esta: 'this', ese: 'that', pero: 'but', hay: 'there is', no: 'no', 'sí': 'yes', ni: 'nor', nada: 'none', otro: 'other', otros: 'other', otra: 'other', propio: 'own', propia: 'own', mismo: 'same', dentro: 'within', 'después': 'after', antes: 'before', durante: 'during', mientras: 'while', cuando: 'when', donde: 'where', 'sólo': 'only', 'también': 'also', 'contra': 'against', 'vía': 'via', 'tipo': 'type', 'tipos': 'types',
    /* sistemas y equipos */
    aire: 'air', agua: 'water', aguas: 'waters', gas: 'gas', vapor: 'steam', refrigerante: 'refrigerant', 'frío': 'cold', 'fría': 'cold', frio: 'cold', caliente: 'hot', helada: 'chilled', 'condensación': 'condensing', condensados: 'condensate', condensado: 'condensate', 'ventilación': 'ventilation', 'extracción': 'exhaust', 'impulsión': 'supply', 'inyección': 'injection', inyector: 'injector', extractor: 'exhaust fan', ventilador: 'fan', ventiladores: 'fans', manejadora: 'air handling unit', manejadoras: 'air handling units', evaporador: 'evaporator', evaporadora: 'evaporator unit', condensador: 'condenser', condensadora: 'condensing unit', compresor: 'compressor', chiller: 'chiller', enfriador: 'chiller', torre: 'tower', torres: 'towers', caldera: 'boiler', calderas: 'boilers', calentador: 'heater', calentadores: 'heaters', 'serpentín': 'coil', bomba: 'pump', bombas: 'pumps', bombeo: 'pumping', 'válvula': 'valve', 'válvulas': 'valves', compuerta: 'damper', compuertas: 'dampers', ducto: 'duct', tubería: 'piping', 'tubería': 'piping', filtro: 'filter', filtros: 'filters', prefiltros: 'pre-filters', tanque: 'tank', cisterna: 'cistern', 'cárcamo': 'sump', sumidero: 'sump', foso: 'pit', 'depósito': 'tank', medidor: 'meter', contador: 'meter', transductor: 'transducer', presostato: 'pressure switch', termostato: 'thermostat', interruptor: 'switch', contactor: 'contactor', 'relé': 'relay', variador: 'drive', motor: 'motor', cabezal: 'header', 'recuperador': 'recovery unit', elevador: 'elevator', elevadores: 'elevators', ascensor: 'elevator', 'campana': 'hood', cocina: 'kitchen', 'lavandería': 'laundry', generador: 'generator', transformador: 'transformer', 'subestación': 'substation', tablero: 'panel', tableros: 'panels', panel: 'panel', 'cargador': 'charger', 'baterías': 'batteries', 'batería': 'battery', 'alimentador': 'feeder', transferencia: 'transfer', 'acometida': 'service entrance', 'planta': 'plant', 'plantas': 'plants', 'luces': 'lights', 'lámpara': 'lamp', 'iluminación': 'lighting', 'luz': 'light', fotocelda: 'photocell', 'habitación': 'guestroom', habitaciones: 'guestrooms', 'corredor': 'corridor', 'corredores': 'corridors', 'escalera': 'stair', 'escaleras': 'stairs', 'cuarto': 'room', 'cuartos': 'rooms', 'sótano': 'basement', 'azotea': 'roof', 'piso': 'floor', 'pisos': 'floors', 'zona': 'zone', 'zonas': 'zones', 'edificio': 'building', 'puerta': 'door', 'puertas': 'doors', 'ventana': 'window', 'balcones': 'balconies', 'persiana': 'blind', 'estacionamientos': 'parking areas', 'cámara': 'chamber', 'combustible': 'fuel', 'diésel': 'diesel', 'aceite': 'oil', 'detector': 'detector', 'detectores': 'detectors', 'humo': 'smoke', 'incendio': 'fire', 'incendios': 'fires', 'fuego': 'fire', 'rociadores': 'sprinklers', 'sensor': 'sensor', 'sensores': 'sensors', 'estación': 'station', 'estaciones': 'stations', 'servidor': 'server', 'interfaz': 'interface', 'módulo': 'module', 'módulos': 'modules', controlador: 'controller', controladores: 'controllers', dispositivo: 'device', dispositivos: 'devices', equipo: 'equipment', equipos: 'equipment', unidad: 'unit', unidades: 'units', sistema: 'system', sistemas: 'systems', red: 'network', redes: 'networks', 'comunicación': 'communication', 'integración': 'integration', 'integraciones': 'integrations', 'principal': 'main', principales: 'main', secundario: 'secondary', secundaria: 'secondary', 'central': 'central', 'local': 'local', 'remoto': 'remote', 'remota': 'remote', 'general': 'general', 'generales': 'general', 'dedicado': 'dedicated', 'independiente': 'independent', 'adicional': 'additional', 'opcional': 'optional', 'opcionales': 'optional', 'automático': 'automatic', 'automática': 'automatic', 'automáticos': 'automatic', 'manual': 'manual', 'manuales': 'manual', 'eléctrico': 'electric', 'eléctrica': 'electric', 'electrónica': 'electronic', 'ultrasónico': 'ultrasonic', 'multifunción': 'multifunction', 'trifásica': 'three-phase', 'activo': 'active', 'activa': 'active', 'activas': 'active', 'activada': 'activated', 'abierta': 'open', 'abierto': 'open', 'cerrado': 'closed', 'cerrada': 'closed', 'directa': 'direct', 'modulante': 'modulating', 'térmica': 'thermal', 'potable': 'potable', 'cruda': 'raw', 'tratada': 'treated', 'negras': 'sewage', 'pluviales': 'storm', 'pluvial': 'storm', 'residuales': 'waste', 'comprimido': 'compressed', 'fresco': 'fresh', 'exterior': 'outdoor', 'exteriores': 'outdoor', 'interior': 'indoor', 'interna': 'internal', 'internas': 'internal', 'ambiente': 'ambient', 'retorno': 'return', 'suministro': 'supply', 'descarga': 'discharge', 'succión': 'suction', 'reposición': 'make-up', 'recirculación': 'recirculation', 'relativa': 'relative', 'diferencial': 'differential', 'estática': 'static', 'máxima': 'maximum', 'mínima': 'minimum', 'alta': 'high', 'alto': 'high', 'baja': 'low', 'bajo': 'low', 'mayor': 'major', 'menor': 'minor', 'crítica': 'critical', 'constante': 'constant', 'variable': 'variable', 'variables': 'variables', 'reactiva': 'reactive', 'aparente': 'apparent', 'reservada': 'reserved', 'sucio': 'dirty', 'seco': 'dry', 'doble': 'double', 'sencilla': 'single', 'trabajo': 'duty', 'respaldo': 'backup', 'seguro': 'safe', 'último': 'last',
    /* magnitudes y estados */
    temperatura: 'temperature', temperaturas: 'temperatures', humedad: 'humidity', humedades: 'humidities', 'presión': 'pressure', nivel: 'level', niveles: 'levels', caudal: 'flow', flujo: 'flow', velocidad: 'speed', velocidades: 'speeds', frecuencia: 'frequency', corriente: 'current', corrientes: 'currents', voltaje: 'voltage', voltajes: 'voltages', 'tensión': 'voltage', potencia: 'power', potencias: 'power', energía: 'energy', 'energía': 'energy', consumo: 'consumption', demanda: 'demand', carga: 'load', capacidad: 'capacity', 'posición': 'position', apertura: 'opening', cierre: 'closing', 'ruido': 'noise', 'luminosidad': 'luminosity', 'concentración': 'concentration', 'factor': 'factor', 'fase': 'phase', 'fases': 'phases', 'neutro': 'neutral', 'desbalance': 'imbalance', 'tiempo': 'time', 'hora': 'time', 'horas': 'hours', 'seg': 'sec', 'día': 'day', 'año': 'year', 'semanal': 'weekly', 'estado': 'status', 'estados': 'statuses', 'estatus': 'status', comando: 'command', comandos: 'commands', 'comandar': 'command', 'señal': 'signal', 'señales': 'signals', 'lectura': 'reading', 'escritura': 'write', 'medición': 'metering', 'submedición': 'submetering', 'conteo': 'count', 'totalizador': 'totalizer', 'alarma': 'alarm', 'alarmas': 'alarms', 'falla': 'fault', 'fallas': 'faults', 'disparo': 'trip', 'paro': 'stop', 'arranque': 'start', 'arranques': 'starts', 'encendido': 'on', 'apagado': 'off', 'habilitación': 'enable', 'habilita': 'enables', 'deshabilita': 'disables', 'retroalimentación': 'feedback', 'modo': 'mode', 'modos': 'modes', 'selector': 'selector', 'ajuste': 'adjustment', 'ajusta': 'adjusts', 'referencia': 'reference', 'setpoint': 'setpoint', 'setpoints': 'setpoints', 'límite': 'limit', 'límites': 'limits', 'umbrales': 'thresholds', 'retardos': 'delays', 'prioridad': 'priority', 'reconocimiento': 'acknowledgement', 'tendencia': 'trend', 'tendencias': 'trends', 'retención': 'retention', 'horario': 'schedule', 'horarios': 'schedules', 'calendario': 'calendar', 'excepciones': 'exceptions', 'editables': 'editable', 'operación': 'operation', 'operador': 'operator', 'monitoreo': 'monitoring', 'supervisa': 'supervises', 'vigila': 'monitors', 'lee': 'reads', 'mantiene': 'maintains', 'continúa': 'continues', 'registran': 'are logged', 'generan': 'are generated', 'definidos': 'defined', 'diseño': 'design', 'respuesta': 'response', 'pérdida': 'loss', 'protección': 'protection', 'protecciones': 'protections', 'seguridad': 'safety', 'emergencia': 'emergency', 'transferencia': 'transfer', 'ocupado': 'occupied', 'ocupadas': 'occupied', 'rentadas': 'rented', 'vendida': 'sold', 'vacía': 'vacant', 'desocupada': 'unoccupied', 'recalentamiento': 'reheat', 'deshielo': 'defrost', 'enfriamiento': 'cooling', 'calor': 'heat', 'cableado': 'hardwired', 'cableados': 'hardwired', 'puntos': 'points', 'punto': 'point', 'valor': 'value', 'valores': 'values', 'entrada': 'input', 'entradas': 'inputs', 'salida': 'output', 'salidas': 'outputs', 'analógica': 'analog', 'analógicas': 'analog', 'digitales': 'digital', 'binarias': 'binary', 'cant': 'Qty', 'total': 'total', 'totales': 'totals', 'cantidad': 'quantity', 'cantidades': 'quantities', 'resumen': 'summary', 'lista': 'list', 'nota': 'note', 'tabla': 'table', 'anexo': 'annex', 'figura': 'figure', 'proyecto': 'project', 'ubicación': 'location', 'marca': 'brand', 'modelo': 'model', 'modelos': 'models', 'código': 'code', 'descripción': 'description', 'protocolo': 'protocol', 'niveles': 'levels', 'tag': 'tag', 'tags': 'tags', 'reserva': 'spare', 'con reserva': 'with spare', 'documento': 'document', 'sección': 'section', 'secuencia': 'sequence', 'secuencias': 'sequences', 'requisito': 'requirement', 'requisitos': 'requirements', 'estándar': 'standard', 'observación': 'observation', 'referencias': 'references', 'condiciones': 'conditions', 'hotel': 'hotel', 'ejemplo': 'example', 'diseñador': 'designer', 'apertura/cierre': 'open/close', 'bypass': 'bypass', 'dispositivos': 'devices',
    'abrir': 'open', 'cerrar': 'close', 'aplica': 'applies', 'confirmar': 'confirm', 'cumple': 'meets', 'falta': 'missing', 'parcial': 'partial', 'pendientes': 'pending', 'propuestos': 'proposed', 'validar': 'validate', 'trabajo': 'duty', 'automática': 'automatic', 'cálculo': 'calculation', 'demasías': 'overflow', 'si': 'if', 'texto': 'text', 'tener': 'have', 'corchetes': 'brackets', 'menciona': 'mentions', 'definir': 'define', 'definida': 'defined', 'diseñador': 'designer', 'ejemplo': 'example', 'sencilla': 'single', 'rango': 'range', 'ambos': 'both', 'ya': 'already', 'sistema': 'system', 'fan coil': 'fan coil', 'planta baja': 'ground floor', 'vehículo': 'vehicle', 'vehiculo': 'vehicle', 'técnico': 'technical', 'técnica': 'technical', 'presurización': 'pressurization', 'detección': 'detection', 'misceláneos': 'miscellaneous', 'misceláneo': 'miscellaneous', 'expansión': 'expansion', 'impulsor': 'supply', 'hidrosanitario': 'plumbing', 'instrumentos': 'instruments', 'válvulas': 'valves', 'fabricante': 'manufacturer', 'fuera': 'out of', 'servicio': 'service', 'atrapada': 'trapped', 'persona': 'person', 'mantenimiento': 'maintenance', 'completas': 'complete', 'ducha': 'shower', 'trasiego': 'transfer', 'fría': 'cold', 'vendida': 'sold', 'tratamiento': 'treatment', 'suavizador': 'softener', 'cloración': 'chlorination', 'desinfección': 'disinfection', 'boya': 'float', 'acometida': 'service entrance', 'importada': 'imported', 'exportada': 'exported', 'porcentaje': 'percentage', 'autonomía': 'autonomy', 'básicas': 'basic', 'grupos': 'groups', 'circuitos': 'circuits', 'circuito': 'circuit', 'conectada': 'connected', 'disponible': 'available', 'monóxido': 'monoxide', 'carbono': 'carbon', 'purga': 'purge', 'activación': 'activation', 'supervisiones': 'supervisions', 'asociados': 'associated', 'forzadas': 'forced', 'abiertas': 'open', 'global': 'global', 'cámara': 'chamber', 'tubería': 'piping', 'drenaje': 'drain', 'fugas': 'leaks', 'intersticial': 'interstitial', 'pared': 'wall', 'sobrellenado': 'overfill', 'operando': 'operating', 'distribución': 'distribution', 'llenado': 'filling', 'almacenada': 'stored', 'alivio': 'relief', 'caja': 'box', 'volumen': 'volume', 'fin': 'end', 'carrera': 'travel', 'aislamiento': 'isolation', 'ciclo': 'cycle', 'contacto': 'contact', 'líquido': 'liquid', 'anticongelamiento': 'freeze protection', 'congelamiento': 'freezing', 'configuración': 'configuration', 'vías': 'way', 'resistencia': 'resistance', 'purificación': 'purification', 'rocío': 'dew', 'inverter': 'inverter', 'consumida': 'consumed', 'sencilla': 'single', 'grandes': 'large', 'cerrado': 'closed', 'recalentamiento': 'reheat', 'etapa': 'stage', 'protección': 'protection', 'fotocelda': 'photocell', 'ocupadas': 'occupied', 'recuperador': 'recovery unit', 'edificio': 'building', 'ascensor': 'elevator', 'residuales': 'waste', 'proof': 'proof', 'número': 'number', 'cuenta': 'counts', 'cuentan': 'are counted', 'apagado': 'off', 'consumida': 'consumed', 'mínimo': 'minimum', 'máximo': 'maximum', 'siempre': 'always', 'superior': 'higher', 'inferior': 'lower', 'anula': 'overrides', 'nivel superior': 'higher level'
  };
  const ADJ = new Set(['sencilla', 'variable', 'independiente', 'dedicado', 'técnico', 'técnica', 'sucio', 'cerrado', 'cerrada', 'vendida', 'importada', 'exportada', 'semanal', 'diferencial', 'estática', 'relativa', 'exterior', 'exteriores', 'interior', 'principal', 'secundario', 'secundaria', 'remoto', 'remota', 'local', 'general', 'generales', 'eléctrico', 'eléctrica', 'automático', 'automática', 'manual', 'activa', 'activo', 'activada', 'abierta', 'helada', 'caliente', 'fría', 'fresco', 'ultrasónico', 'potable', 'cruda', 'tratada', 'negras', 'pluviales', 'comprimido', 'reactiva', 'aparente', 'máxima', 'mínima', 'dedicado', 'adicional', 'opcional', 'constante', 'directa', 'térmica', 'electrónica', 'analógica', 'analógicas', 'digitales', 'residuales', 'ambiente', 'trifásica', 'crítica', 'mayor', 'menor']);
  const NOMBRES = new Set(['manejadora', 'inyector', 'extractor', 'campana', 'cargador', 'calentador', 'calentadores', 'bombeo', 'presurización', 'detección', 'estación', 'caldera', 'chiller', 'torre', 'ducto', 'cabezal', 'serpentín', 'compresor', 'condensador', 'evaporador', 'transformador', 'generador', 'subestación', 'alimentador', 'contactor', 'relé', 'variador', 'termostato', 'presostato', 'transductor', 'recuperador', 'elevador', 'planta', 'cisterna', 'sumidero', 'foso', 'cárcamo', 'medidor', 'contador', 'luz', 'luces', 'puerta', 'ventana', 'sensor', 'estado', 'alarma', 'comando', 'falla', 'lectura', 'nivel', 'velocidad', 'presión', 'temperatura', 'humedad', 'caudal', 'señal', 'posición', 'referencia', 'consumo', 'medición', 'tablero', 'panel', 'válvula', 'bomba', 'ventilador', 'compuerta', 'motor', 'filtro', 'tanque', 'cuarto', 'estación', 'control', 'modo', 'selector', 'disparo', 'paro', 'arranque', 'apertura', 'cierre', 'energía', 'potencia', 'corriente', 'voltaje', 'frecuencia', 'factor', 'detector', 'unidad', 'sistema', 'módulo', 'equipo', 'interruptor', 'ajuste', 'lista', 'resumen', 'totalizador', 'contador', 'medidor', 'retroalimentación', 'demanda', 'carga', 'capacidad', 'protección', 'salida', 'entrada', 'cantidad', 'pérdida', 'ventiladores', 'bombas', 'cantidades']);

  const cap = (o, t) => (o && o[0] !== o[0].toLowerCase() && t ? t[0].toUpperCase() + t.slice(1) : t);
  const norm = (w) => w.toLowerCase();
  const palabra = (w) => { const k = norm(w); if (k in D) return cap(w, D[k]); return w; };
  const RE_W = /[\p{L}][\p{L}\p{N}]*/gu;
  const RE_DE = /(?<![\p{L}])([\p{L}]+)\s+(?:de|del)\s+(?:la\s+|el\s+|los\s+|las\s+)?([\p{L}][\p{L}\p{N}]*)(\s+[\p{L}][\p{L}\p{N}]*)?(?![\p{L}\p{N}])/giu;

  /* traduce una frase corta (nombre de equipo o variable) con reordenamiento de «sustantivo + adjetivo» y «A de B» */
  function nombre(s) {
    let t = s;
    t = t.replace(RE_DE, (m, a, b, c) => {
      if (!NOMBRES.has(norm(a))) return m;
      let b2 = b, resto = '';
      if (c && ADJ.has(norm(c.trim()))) b2 = b + c; else if (c) resto = c;
      return nombre(b2) + ' ' + palabra(a) + resto;
    });
    t = t.replace(/(?<![\p{L}])([\p{L}]+)\s+([\p{L}]+)(?![\p{L}])/gu, (m, a, b) => (ADJ.has(norm(b)) && norm(a) in D && !['de', 'del', 'y', 'o', 'con', 'sin', 'para', 'por', 'en'].includes(norm(a)) ? palabra(b) + ' ' + palabra(a) : m));
    t = t.replace(RE_W, (w) => palabra(w));
    /* minúscula inicial salvo siglas y códigos; la primera palabra conserva la mayúscula de la frase original */
    t = t.replace(RE_W, (w, i) => (/[A-Z]/.test(w.slice(1)) || /\d/.test(w) ? w : w[0].toLowerCase() + w.slice(1)));
    return /^[A-ZÁÉÍÓÚÑ]/.test(s) ? t.replace(/^[\p{L}]/u, (c) => c.toUpperCase()) : t;
  }

  function R(s) { return porSegmentos(String(s)); }
  function L(s) { return String(s).split(/,\s+|\s+y\s+/).map((x) => nombre(x.trim())).join(', ').replace(/, ([^,]+)$/, ' and $1'); }

  function frase(s) {
    for (const [re, rep] of FRASES) {
      const m = re.exec(s);
      if (m) return typeof rep === 'function' ? rep(...m) : rep;
    }
    return null;
  }

  /* traduce un texto respetando las marcas **negrita**, ==amarillo== y !!rojo!! */
  function porSegmentos(texto) {
    const entero = frase(String(texto).trim());
    if (entero != null) return entero;
    return String(texto).split(/(\*\*|==|!!)/).map((s) => {
      if (s === '**' || s === '==' || s === '!!' || !s.trim()) return s;
      return una(s);
    }).join('');
  }

  function una(s) {
    const ini = /^\s*/.exec(s)[0], fin = /\s*$/.exec(s)[0], c = s.trim();
    const f = frase(c); if (f != null) return ini + f + fin;
    /* código o puro número: se deja igual */
    if (!/[\p{L}]{3,}/u.test(c.replace(/\{\{.*?\}\}/g, ''))) return s;
    /* ref. al principio («15A.15: …», «0.1 …») */
    const m = /^((?:§?\d[\w.\-]*[:.]?\s+)|(?:\d[\w.\-]*:\s+))(.*)$/s.exec(c);
    if (m) return ini + m[1] + una(m[2]) + fin;
    /* oraciones: se parten en puntos y punto y coma para traducir cada parte */
    const partes = c.split(/(?<=[.;:])\s+/);
    if (partes.length > 1) return ini + partes.map((p) => una(p)).join(' ') + fin;
    return ini + nombre(c).replace(/\s{2,}/g, ' ') + fin;
  }

  /* texto español que sigue sin traducir: palabras que el glosario no conoce y que no parecen códigos o nombres propios */
  const CONOCIDAS = new Set(['bms', 'bas', 'bacnet', 'modbus', 'ip', 'tcp', 'rtu', 'ms', 'tp', 'vfd', 'hvac', 'vrf', 'doas', 'ahu', 'fcu', 'grms', 'pms', 'facp', 'ups', 'ats', 'hoa', 'ai', 'ao', 'di', 'do', 'int', 'iom', 'cp', 'cs', 'soo', 'asc', 'ashrae', 'jci', 'metasys', 'honeywell', 'optimizer', 'sne', 'fec', 'iny', 'afex', 'bcu', 'mau', 'vav', 'thd', 'gateway', 'gateways', 'web', 'hardware', 'software', 'switch', 'off', 'on', 'auto', 'start', 'stop', 'fan', 'coil', 'trip', 'reset', 'setback', 'recall', 'tamper', 'chiller', 'damper', 'breaker', 'switchgear', 'inverter', 'dimmers', 'itouch', 'reheat', 'airflow', 'proof', 'make', 'air', 'manager', 'cala', 'fairfield', 'guayabos', 'marriott', 'cis', 'sub', 'gen', 'ion', 'itp', 'tci', 'pdt', 'bci', 'bce', 'bpl', 'ach', 'seg', 'min', 'kwh', 'btu', 'lpg', 'kw', 'sinergia', 'jockey', 'ethernet', 'guideline', 'svg', 'dxf']);
  const ESP = /(?<![\p{L}])(del|los|las|una|que|para|con|sin|según|desde|cada|sobre|entre|más|pero|tiene|debe|ante|sus|este|esta|todo|toda|hay|por)(?![\p{L}])|[áéíóúñ]/iu;
  function sinTraducir(orig, trad) {
    const resto = trad.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w && !CONOCIDAS.has(w.toLowerCase()));
    return resto.some((w) => /[áéíóúñü]/i.test(w)) || resto.some((w) => ESP_PAL.has(w.toLowerCase()));
  }
  const ESP_PAL = new Set(['del', 'los', 'las', 'una', 'que', 'para', 'con', 'sin', 'según', 'desde', 'cada', 'sobre', 'entre', 'pero', 'tiene', 'debe', 'ante', 'sus', 'este', 'esta', 'todo', 'toda', 'hay', 'por', 'cuando', 'donde', 'equipo', 'sistema', 'sección']);

  const aEn = (t) => (t == null || t === '' ? t : porSegmentos(t));
  /* aplica la traducción a los bloques del documento; lo que quede en español se marca en rojo */
  function bloques(bl) {
    let pend = 0;
    const tx = (t, marcar) => {
      if (!t) return t;
      const o = String(t), r = porSegmentos(o);
      if (marcar && !/!!/.test(r) && sinTraducir(o, r)) { pend++; return '!!' + r.replace(/\*\*/g, '') + '!!'; }
      return r;
    };
    const out = bl.map((b) => {
      if (b.t === 'tabla') return { ...b, titulo: tx(b.titulo, true), nota: tx(b.nota, true), filas: b.filas.map((f) => f.map((c) => tx(c, true))) };
      if (b.t === 'imagen') return { ...b, pie: tx(b.pie, false) };
      if (b.texto != null) return { ...b, texto: tx(b.texto, b.t !== 'h1' && b.t !== 'h2') };
      return b;
    });
    out.pendientes = pend;
    return out;
  }


  /* ---------- inglés → español (para el estándar del hotel, que suele venir en inglés) ---------- */
  const FR_ES = [
    ['property management system', 'sistema de gestión de la propiedad'], ['building automation system', 'sistema de automatización del edificio'], ['building management system', 'sistema de gestión del edificio'],
    ['outside air', 'aire exterior'], ['outdoor air', 'aire exterior'], ['exhaust air', 'aire de extracción'], ['make-up air', 'aire de reposición'], ['supply air', 'aire de suministro'], ['return air', 'aire de retorno'], ['fresh air', 'aire fresco'],
    ['airflow dampers', 'compuertas de aire'], ['airflow damper', 'compuerta de aire'], ['dampers', 'compuertas'], ['damper', 'compuerta'],
    ['room controller', 'controlador de habitación'], ['room controllers', 'controladores de habitación'], ['temperature setpoint', 'setpoint de temperatura'], ['temperature sensor', 'sensor de temperatura'], ['humidity control', 'control de humedad'], ['humidity sensor', 'sensor de humedad'],
    ['purge cycle', 'ciclo de purga'], ['occupancy based', 'según la ocupación'], ['occupancy-based', 'según la ocupación'], ['key card slots', 'ranuras de tarjeta de acceso'], ['key card', 'tarjeta de acceso'], ['entry door lock', 'cerradura de la puerta de entrada'], ['door lock', 'cerradura de puerta'],
    ['master lighting relay', 'relé maestro de iluminación'], ['lighting control', 'control de iluminación'], ['fully networked', 'completamente en red'], ['hotel operators console', 'consola del operador del hotel'],
    ['fire alarm control panel', 'panel de control de alarma de incendio'], ['fire alarm', 'alarma de incendio'], ['smoke control', 'control de humo'], ['stair pressurization', 'presurización de escaleras'], ['life safety', 'seguridad de vida'],
    ['energy recovery', 'recuperación de energía'], ['variable speed', 'velocidad variable'], ['variable frequency drives', 'variadores de frecuencia'], ['variable frequency drive', 'variador de frecuencia'], ['chilled water', 'agua helada'], ['hot water', 'agua caliente'], ['domestic water', 'agua potable'], ['fuel tank', 'tanque de combustible'], ['leak detection', 'detección de fugas'], ['overfill protection', 'protección contra sobrellenado'], ['remote level', 'nivel remoto'],
    ['trend logs', 'tendencias'], ['trend log', 'tendencia'], ['time schedule', 'horario'], ['alarm priority', 'prioridad de alarma'], ['loss of communication', 'pérdida de comunicación'], ['loss of power', 'pérdida de energía'], ['power failure', 'falla de energía'],
    ['web based', 'basado en web'], ['graphical interface', 'interfaz gráfica'], ['user interface', 'interfaz de usuario'], ['central server', 'servidor central'],
    ['at least', 'al menos'], ['as well as', 'así como'], ['in order to', 'para'], ['in the event of', 'en caso de'], ['if required by code', 'si lo exige el código'], ['required by code', 'exigido por el código'], ['in accordance with', 'de acuerdo con'], ['according to', 'según'], ['based on', 'según'], ['shall not', 'no debe'], ['shall be', 'debe ser'], ['shall also', 'también debe'], ['shall automatically', 'debe automáticamente'], ['must be', 'debe ser'], ['is prohibited', 'está prohibido'], ['are prohibited', 'están prohibidas'], ['is required', 'es obligatorio'], ['are required', 'son obligatorios'], ['minutes', 'minutos'], ['minute', 'minuto'], ['hours', 'horas'], ['seconds', 'segundos'], ['years', 'años']
  ].sort((a, b) => b[0].length - a[0].length);
  const EN = {
    the: '', a: '', an: '', of: 'de', and: 'y', or: 'o', to: 'para', in: 'en', on: 'en', for: 'para', with: 'con', without: 'sin', by: 'por', from: 'desde', at: 'en', is: 'es', are: 'son', be: 'ser', will: '', can: 'puede', may: 'puede', not: 'no', all: 'todos', each: 'cada', every: 'cada', any: 'cualquier', if: 'si', when: 'cuando', where: 'donde', that: 'que', this: 'este', these: 'estos', also: 'también', other: 'otras', both: 'ambos', through: 'mediante', between: 'entre', per: 'por', than: 'que', as: 'como', after: 'después de', before: 'antes de', during: 'durante', while: 'mientras', only: 'solo', more: 'más', less: 'menos', one: 'uno', two: 'dos', three: 'tres', four: 'cuatro', has: 'tiene', have: 'tiene', include: 'incluyen', includes: 'incluyen', including: 'incluyendo', allows: 'permite', allow: 'permite', provide: 'proveer', provides: 'provee', used: 'usado', use: 'usar', required: 'obligatorio', prohibited: 'prohibido',
    system: 'sistema', systems: 'sistemas', control: 'control', controls: 'controles', controller: 'controlador', controllers: 'controladores', server: 'servidor', network: 'red', networked: 'en red', integration: 'integración', integrations: 'integraciones', integrates: 'se integra', interface: 'interfaz', operator: 'operador', operators: 'operadores', user: 'usuario', password: 'contraseña', access: 'acceso', alarm: 'alarma', alarms: 'alarmas', trend: 'tendencia', trends: 'tendencias', setpoint: 'setpoint', setpoints: 'setpoints', sensor: 'sensor', sensors: 'sensores', temperature: 'temperatura', humidity: 'humedad', pressure: 'presión', flow: 'caudal', level: 'nivel', speed: 'velocidad', status: 'estado', command: 'comando', feedback: 'retroalimentación', point: 'punto', points: 'puntos', monitor: 'monitorear', monitors: 'monitorea', monitoring: 'monitoreo', report: 'reporte', history: 'historial', backup: 'respaldo', battery: 'batería', power: 'energía', energy: 'energía', demand: 'demanda', load: 'carga', fan: 'ventilador', fans: 'ventiladores', pump: 'bomba', pumps: 'bombas', valve: 'válvula', valves: 'válvulas', coil: 'serpentín', filter: 'filtro', filters: 'filtros', tank: 'tanque', meter: 'medidor', generator: 'generador', boiler: 'caldera', heater: 'calentador', unit: 'unidad', units: 'unidades', equipment: 'equipo', zone: 'zona', zones: 'zonas', room: 'habitación', rooms: 'habitaciones', guestroom: 'habitación', guestrooms: 'habitaciones', floor: 'piso', floors: 'pisos', building: 'edificio', door: 'puerta', doors: 'puertas', window: 'ventana', lighting: 'iluminación', light: 'luz', lights: 'luces', occupied: 'ocupada', unoccupied: 'desocupada', occupancy: 'ocupación', cycle: 'ciclo', mode: 'modo', modes: 'modos', schedule: 'horario', schedules: 'horarios', calendar: 'calendario', time: 'tiempo', hour: 'hora', hours: 'horas', minute: 'minuto', year: 'año', years: 'años', day: 'día', days: 'días', week: 'semana', weekly: 'semanal', hourly: 'cada hora', daily: 'diario', automatically: 'automáticamente', automatic: 'automático', manual: 'manual', manually: 'manualmente', local: 'local', remote: 'remoto', remotely: 'remotamente', central: 'central', main: 'principal', primary: 'principal', secondary: 'secundario', high: 'alta', low: 'baja', maximum: 'máximo', minimum: 'mínimo', open: 'abrir', close: 'cerrar', closed: 'cerrado', start: 'arrancar', stop: 'detener', enable: 'habilitar', disable: 'deshabilitar', reset: 'reset', adjust: 'ajustar', display: 'mostrar', graphics: 'gráficos', graphic: 'gráfico', color: 'color', summary: 'resumen', priority: 'prioridad', acknowledge: 'reconocer', acknowledged: 'reconocida', comment: 'comentario', retain: 'retener', retention: 'retención', failure: 'falla', fault: 'falla', faults: 'fallas', loss: 'pérdida', communication: 'comunicación', protocol: 'protocolo', hardware: 'hardware', software: 'software', web: 'web', based: 'basado', fire: 'incendio', smoke: 'humo', life: 'vida', safety: 'seguridad', emergency: 'emergencia', water: 'agua', gas: 'gas', air: 'aire', exhaust: 'extracción', supply: 'suministro', return: 'retorno', outside: 'exterior', outdoor: 'exterior', indoor: 'interior', airflow: 'flujo de aire', recovery: 'recuperación', ventilation: 'ventilación', cooling: 'enfriamiento', heating: 'calefacción', fuel: 'combustible', leak: 'fuga', leaks: 'fugas', detection: 'detección', test: 'prueba', testing: 'pruebas', third: 'tercero', party: 'parte', code: 'código', standard: 'estándar', requirement: 'requisito', requirements: 'requisitos', card: 'tarjeta', key: 'llave', slot: 'ranura', slots: 'ranuras', lock: 'cerradura', console: 'consola', hotel: 'hotel', property: 'propiedad', management: 'gestión', master: 'maestro', relay: 'relé', purge: 'purga', logic: 'lógica', algorithm: 'algoritmo', reserve: 'reserva', spare: 'reserva', capacity: 'capacidad', total: 'total', same: 'mismo', own: 'propio', full: 'completo', fully: 'completamente', shall: 'debe', must: 'debe', should: 'debería'
  };
  const NUM_UN = /(\d+(?:[.,]\d+)?)\s?(%|°[CF]|Pa|N|ppm|psi|gpm|kW|BTU\/h|Btu\/h|hp|GB|TB|V|A|Hz|min|h|hours?|horas?|minutes?|minutos?|seconds?|segundos?|years?|años?|days?|días?|lb|kg)(?![\p{L}])/gu;
  const esIngles = (t) => {
    const w = String(t).toLowerCase().match(/[a-z]+/g) || [];
    if (w.length < 4) return false;
    const en = w.filter((x) => ['the', 'and', 'shall', 'of', 'to', 'in', 'for', 'with', 'be', 'is', 'are', 'must', 'will', 'all', 'each', 'when'].includes(x)).length;
    const es = w.filter((x) => ['de', 'la', 'el', 'los', 'las', 'que', 'para', 'con', 'por', 'una', 'del', 'debe', 'cada'].includes(x)).length;
    return en > es && en >= 1;
  };
  function aEs(texto, conservar = true) {
    const pr = conservar ? proteger(texto) : { x: String(texto), mapa: [] }; let t = pr.x;
    FR_ES.forEach(([e, es]) => { t = t.replace(new RegExp('(?<![A-Za-z])' + e.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![A-Za-z])', 'gi'), (m) => (/[A-Z]/.test(m[0]) ? es[0].toUpperCase() + es.slice(1) : es)); });
    t = t.replace(/(?<![\p{L}\p{N}])[A-Za-z][A-Za-z\-']*/gu, (w) => {
      const k = w.toLowerCase(); if (!(k in EN)) return w;
      const r = EN[k]; return r && /^[A-Z][a-z]/.test(w) ? r[0].toUpperCase() + r.slice(1) : r;
    });
    return restaurar(t, pr.mapa).replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
  }
  /* palabras en inglés que quedan sin traducir (para marcar la redacción como pendiente de revisión) */
  const inglesResidual = (t) => (String(t).match(/(?<![\p{L}])[a-z]{3,}(?![\p{L}])/gu) || []).filter((w) => /^(the|and|shall|that|with|from|this|when|which|their|also|have|into|only|than|such|each|for|are|will)$/.test(w)).length;



  /* términos de oficio que se dejan en inglés al traducir al español (además de toda sigla en mayúsculas: BMS, HVAC, FACP, DDC, CPU…) */
  const TERMINOS = ['dampers?', 'setpoints?', 'set points?', 'strobes?', 'sounders?', 'sounder bases?', 'annunciators?', 'supervisory', 'trouble', 'gateways?', 'firmware', 'software', 'hardware', 'thin[- ]clients?', 'workstations?', 'dimmers?', 'fan coils?', 'VAV boxes?', 'make-up air', 'key cards?', 'BACnet(?:/IP)?', 'MS/TP', 'Modbus(?: RTU| TCP)?', 'LonWorks', 'BTL', 'trends?', 'reset', 'hoistway', 'firefighters?', 'chillers?', 'reheat', 'economizers?', 'outstations?', 'DDC', 'PMS', 'GRMS', 'HOA'];
  const RE_TERM = new RegExp('(?<![A-Za-z])(' + TERMINOS.join('|') + '|[A-Z]{2,}[A-Z0-9]*(?:/[A-Z0-9]+)*)(?![A-Za-z])', 'g');
  const proteger = (t) => { const mapa = []; const x = String(t).replace(RE_TERM, (m) => { mapa.push(m); return 'QTERM' + (mapa.length - 1) + 'Q'; }); return { x, mapa }; };
  const restaurar = (t, mapa) => String(t).replace(/QTERM\s?(\d+)\s?Q/gi, (m, i) => (mapa[i] != null ? mapa[i] : m));
  const completo = (t, mapa) => mapa.every((_, i) => new RegExp('QTERM\s?' + i + '\s?Q', 'i').test(t));

  /* ---------- traductor integrado del navegador (Chrome 138 o superior): traduce en el equipo, sin enviar el texto a terceros ---------- */
  async function crearTraductor(prog) {
    try {
      if (!('Translator' in self)) return null;
      const av = await self.Translator.availability({ sourceLanguage: 'en', targetLanguage: 'es' });
      if (av === 'unavailable') return null;
      /* la primera vez el navegador descarga el modelo de idioma (se hace una sola vez); si tarda demasiado se sigue con el glosario */
      const crear = self.Translator.create({ sourceLanguage: 'en', targetLanguage: 'es', monitor: (m) => { if (prog) m.addEventListener('downloadprogress', (e) => prog(e.loaded)); } });
      return await Promise.race([crear, new Promise((ok) => setTimeout(() => ok(null), 240000))]);
    } catch (e) { return null; }
  }
  async function traducirLineas(tr, lineas, prog) {
    const out = [];
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (!esIngles(l)) out.push(l);
      else {
        try {
          const pr = proteger(l); let r = String(await tr.translate(pr.x));
          if (!completo(r, pr.mapa)) r = String(await tr.translate(l));   /* si el traductor alteró una marca, se traduce sin proteger */
          else r = restaurar(r, pr.mapa);
          out.push(r.replace(/\s+/g, ' ').trim());
        } catch (e) { out.push(l); }
      }
      if (prog) prog(i + 1, lineas.length);
    }
    return out;
  }

  BMS.trad = { crearTraductor, traducirLineas, aEn, aEs, esIngles, inglesResidual, NUM_UN, bloques, nombre };
})();
