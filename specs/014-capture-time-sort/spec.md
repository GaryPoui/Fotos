# Feature Specification: Orden por hora de toma

**Feature Branch**: `main` (publicación autorizada)
**Created**: 2026-10-13
**Status**: Implemented and published 2026-10-14
**Input**: Ordenar fotos por fecha, hora, minuto y segundo leyendo metadatos al subir, sin escribir la hora; asesorar sobre ahorro de espacio.

## Clarifications
- 2026-10-13: El usuario eligió «Mantener día elegido y agregar hora automática». La fecha manual sigue siendo la referencia principal; sólo la hora se obtiene automáticamente.

## User Scenarios & Testing
### User Story 1 - Ver fotos en su orden real (Priority: P1)
Subo fotos de un mismo día en cualquier orden y la página las ordena por la hora de toma, hasta el segundo, sin pedirme que la complete.
**Why this priority**: El orden de subida no representa el orden de los momentos.
**Independent Test**: Subir fotos con horas/segundos distintos y el mismo día manual en orden invertido; comprobar mosaico, línea de tiempo y carrusel, de nuevas a antiguas y viceversa.
**Acceptance Scenarios**:
1. **Given** dos fotos con la misma fecha manual y horas de toma diferentes, **When** las subo invertidas, **Then** se ordenan por la hora de toma incluyendo segundos.
2. **Given** fechas de cámara y manual distintas, **When** subo la foto, **Then** mantiene el día elegido y usa sólo la hora de cámara para el orden dentro de ese día.
3. **Given** fotos de iPhone que requieren conversión o reintento, **When** las preparo y retomo, **Then** conservan la hora original leída antes de convertir.
4. **Given** una foto con hora conocida, **When** la abro, **Then** puedo ver HH:mm:ss, sin un campo para editarla.

### User Story 2 - Conservar recuerdos y tratar horas desconocidas (Priority: P1)
El cambio conserva todo lo guardado y admite fotos sin hora de toma.
**Independent Test**: Comparar filas y esquema históricos; subir fotos sin EXIF/dañado, reintentar y reiniciar.
**Acceptance Scenarios**:
1. **Given** una foto sin metadatos válidos, **When** la subo, **Then** se guarda sin inventar una hora y conserva el orden de subida dentro del grupo sin hora.
2. **Given** contenido previo, **When** se publica, **Then** no se reescriben fechas, títulos, archivos, álbumes, cartas, canciones o metadatos anteriores.
3. **Given** un error de guardado, **When** reintento, **Then** no duplica recuerdos ni deja una foto confirmada sin su original.

### User Story 3 - Elegir cómo ampliar el espacio (Priority: P2)
Entiendo las opciones para ahorrar espacio o usar otro almacenamiento, con sus efectos sobre calidad y costo.
**Independent Test**: Recomendación con documentación vigente, uso actual agregado y límites claros.
**Acceptance Scenarios**:
1. **Given** originales guardados, **When** se analiza la optimización, **Then** no se comprimen, reemplazan o migran por una consulta de recomendaciones.
2. **Given** una alternativa con cuota gratuita, **When** se recomienda, **Then** se explican el límite y la posibilidad de cargos fuera de esa cuota.

### Edge Cases
EXIF ausente, fecha imposible, hora parcial, offset de cámara, formatos sin soporte, captura de pantalla/mensajería sin EXIF; no sustituyen la hora de toma por modificación del archivo. Horas iguales y desconocidas tienen desempate estable. Los recuerdos anteriores no se reclasifican. No se leen ubicaciones GPS.

## Requirements
### Functional Requirements
- **FR-001**: Nuevas fotos MUST leer automáticamente hora/minuto/segundo de toma cuando existan metadatos válidos.
- **FR-002**: El día manual MUST conservarse al subir y al editar. No se pide hora manual.
- **FR-003**: Todas las vistas MUST compartir orden total estable por día, hora conocida y desempate, con orden inverso seleccionable; las horas desconocidas se agrupan después de las conocidas dentro del día y se ordenan por subida descendente.
- **FR-004**: La hora local de cámara MUST conservarse sin aplicar desplazamientos de zona ni inferir precisión faltante.
- **FR-005**: La lectura MUST preceder a conversiones y sobrevivir en el borrador a interrupción/reintento.
- **FR-006**: Datos nuevos MUST ser opcionales y no requerir cambios en filas, archivos ni permisos anteriores.
- **FR-007**: El visor MUST mostrar HH:mm:ss sólo cuando sea conocido, y distinguir ausencia de hora.
- **FR-008**: Música, videos, fechas manuales, privacidad, límites de carga y espacio MUST conservar su comportamiento.
- **FR-009**: El análisis de espacio MUST usar fuentes primarias actuales y no modificar originales o activar facturación.

### Key Entities
Foto: fecha manual y hora opcional de toma. Borrador: archivo original/preparado, lectura completada y hora extraída. Orden de recuerdos: fecha manual y hora opcional. Recomendación de espacio: ventajas, límites y compromisos de calidad/presupuesto.

## Success Criteria
### Measurable Outcomes
- **SC-001**: El 100% de fotos de prueba con horas completas se ordena correctamente hasta el segundo, aunque se suba en orden opuesto.
- **SC-002**: Todas las fotos sin hora válida se guardan y no presentan una hora inventada.
- **SC-003**: La fecha manual elegida se conserva en todos los casos de prueba y el 100% de filas históricas comparadas permanece intacto.
- **SC-004**: Conversión, recuperación, vistas y controles funcionan desde 360 px sin desbordes.
- **SC-005**: Se entrega recomendación de espacio con límites y fuentes, sin cambios de calidad/costo no solicitados.

## Assumptions
Se aplica a nuevas subidas; no se vuelve a leer ni descargar la biblioteca anterior para modificarla. La ausencia de EXIF en fotos compartidas por mensajería no puede reconstruirse. Se usa fecha original de cámara completa para validar la hora; no se toma la fecha de modificación como evidencia. El contenido se mantiene privado.
