# Feature Specification: Fechas automáticas de las fotos

**Feature Branch**: `main` (publicación autorizada)
**Created**: 2026-10-09
**Status**: Ready
**Input**: Leer metadatos en lugar de seleccionar fecha; filtrar por día, mes, año, hora y minuto; subir antes la versión actual y conservar todo el contenido.

## User Scenarios & Testing
### User Story 1 - Guardar cada foto en su momento (Priority: P1)
Subo una tanda sin elegir una fecha compartida y cada foto conserva la fecha y hora en que fue tomada.
**Why this priority**: Evita asignar a una tanda completa el mismo día.
**Independent Test**: Subir dos fotos con fechas distintas y una sin metadatos, incluyendo pausa y reanudación.
**Acceptance Scenarios**:
1. **Given** una foto con fecha original válida, **When** la subo, **Then** aparece en ese día y minuto sin seleccionar fecha.
2. **Given** una imagen sin fecha original válida, **When** la subo, **Then** usa la fecha de subida y explica su procedencia.
3. **Given** una foto que necesita conversión, **When** la preparo o reanudo, **Then** conserva los metadatos leídos antes de convertir.

### User Story 2 - Encontrar un momento preciso (Priority: P2)
Filtro y ordeno por año, mes, día, hora y minuto, combinando estos filtros con álbum, búsqueda y favoritos.
**Why this priority**: Permite encontrar recuerdos que sucedieron el mismo día.
**Independent Test**: Filtrar recuerdos con minutos diferentes en móvil y escritorio.
**Acceptance Scenarios**:
1. **Given** fotos de diferentes fechas, **When** combino los cinco filtros, **Then** todas las vistas muestran sólo las coincidencias.
2. **Given** filtros activos, **When** los limpio o abro un recuerdo destacado, **Then** éste queda disponible sin filtros ocultos.
3. **Given** un recuerdo antiguo cuya hora se desconoce, **When** consulto su fecha, **Then** conserva el día y no inventa una hora.
4. **Given** fechas de toma y subida distintas, **When** elijo la subida como referencia, **Then** puedo consultar el momento de carga registrado.

### User Story 3 - Conservar nuestro rincón (Priority: P1)
La actualización conserva títulos, fotos, videos, cartas, canciones, álbumes y preferencias.
**Why this priority**: La conservación es un requisito explícito del usuario.
**Independent Test**: Comparar datos y archivos antes y después de publicar, con respaldo privado completo.
**Acceptance Scenarios**:
1. **Given** la versión actual, **When** empieza el cambio, **Then** está subida al repositorio con punto de recuperación.
2. **Given** contenido histórico, **When** se actualiza, **Then** todos sus campos y originales conservan exactamente su valor.
3. **Given** una carta o canción, **When** filtro fotos o edito un título, **Then** su contenido no cambia.

### Edge Cases
- Mensajería, capturas, formatos ilegibles o fechas imposibles: fecha de subida claramente indicada.
- Metadatos sin zona: mantener el reloj de cámara sin desplazar el día ni inventar una zona.
- Fecha de modificación: no es prueba de cuándo se tomó una foto.
- Recuerdos previos: sin reclasificación en masa; hora desconocida si sólo existe fecha manual.
- Reintentos: conservar identificador y metadatos, sin duplicados.

## Requirements
### Functional Requirements
- **FR-001**: Nuevas fotos MUST obtener automáticamente fecha y hora original hasta el minuto, por archivo, sin fecha manual al subir.
- **FR-002**: La lectura MUST preceder a la conversión y sobrevivir a pausa/reanudación.
- **FR-003**: Metadatos ausentes o inválidos MUST usar la fecha real de subida, identificando la alternativa sin bloquear la carga.
- **FR-004**: Filtros MUST combinar año, mes, día, hora y minuto con los existentes y permitir limpieza explícita.
- **FR-005**: Orden MUST contemplar la hora conocida en mosaico, línea de tiempo y carrusel.
- **FR-006**: Toma y subida MUST distinguirse; sin zona se conserva el reloj de cámara.
- **FR-007**: Ningún registro o archivo existente MUST modificarse o borrarse por la actualización; nuevos datos temporales son opcionales.
- **FR-008**: Antes de cambiar almacenamiento MUST existir respaldo privado verificado y versión actual subida a Git.
- **FR-009**: Controles MUST ser accesibles desde 360 px sin desbordar.
- **FR-010**: Verificación MUST cubrir lectura, fechas inválidas, reanudación, filtros, privacidad y conservación histórica.

### Key Entities
- **Recuerdo**: Conserva identidad, título, archivo, álbum, fecha anterior y subida; añade toma opcional y procedencia.
- **Filtro temporal**: Referencia, año, mes, día, hora y minuto independientes.
- **Respaldo privado**: Datos y originales con comprobación de integridad, fuera del repositorio.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Todas las fotos de prueba con metadatos válidos conservan día y minuto sin introducir fechas.
- **SC-002**: Todas las fotos sin metadatos se suben y explican que usan fecha de subida.
- **SC-003**: El 100% de títulos, datos históricos y archivos comparados antes/después permanece idéntico.
- **SC-004**: Los cinco filtros funcionan juntos a 360 px y en escritorio sin ensanchar la página.

## Assumptions
- Usuario confirmó fecha y hora en que se tomó la foto mediante metadatos.
- Automatización aplica a nuevas subidas; no se reclasifican registros históricos en masa.
- Videos sin fecha de toma legible usan subida; cartas y canciones conservan funcionamiento.
- Subida se presenta en horario argentino; cámara conserva su reloj original.
