# Feature Specification: Videos grandes y espacio disponible
**Feature Branch**: main | **Created**: 2026-10-13 | **Status**: Ready for planning
**Input**: Aumentar el tamaño de carga de videos e indicar cuánto espacio queda; hosting gratuito y preservación de contenido vigentes.
## User Scenarios & Testing
### User Story 1 — Guardar videos más grandes (Priority: P1)
Elijo un video de más de50MB y hasta200MB, reviso sus datos y lo guardo. Puedo reproducirlo, adelantarlo, recargar y descargar el original.
**Why**: Los recuerdos en video exceden el límite anterior.
**Independent Test**: Video sintético >50MB guardado, recuperado completo y parcialmente; descarga idéntica tras reiniciar.
**Acceptance**: Dentro de tamaño/cuota se guarda una vez, conserva bytes y reproduce; fuera de tamaño/cuota o formato permitido explica error y conserva formulario. Fallo/interrupción nunca confirma video incompleto; reintento no duplica lo confirmado. Todos los archivos anteriores permanecen compatibles.
### User Story 2 — Saber cuánto queda (Priority: P1)
Veo disponible, utilizado y límite en la página y al elegir archivos; se actualiza después de operaciones.
**Why**: Elegir qué recuerdos puedo guardar antes de intentar una subida.
**Independent Test**: Indicador coincide con límite menos archivos, miniaturas y reservas conocidas; subir/quitar archivo sintético lo actualiza.
**Acceptance**: Disponible no negativo, legible a360px/PC. Poco espacio informa claramente; jamás se borra contenido automáticamente para hacer lugar.
### Edge Cases
Conexión lenta, respuesta perdida, parte ausente, cancelación, reinicio durante guardado, reintento simultáneo, reserva fallida, rango de reproducción fuera del archivo, foto/audio con extensión de video falsa y cliente antiguo.
## Requirements
- **FR-001**: Videos MP4/WebM MUST admitir hasta200MB sin compresión/transcodificación, con sesión privada y espacio suficiente.
- **FR-002**: Fotos/audio MUST mantener límite actual y validación real de formato; extensión/MIME declarada no puede evadirlo.
- **FR-003**: Video MUST verse/descargarse como un único archivo, conservando exactamente los bytes y permitiendo adelantar/reproducir.
- **FR-004**: Guardado MUST confirmarse sólo al persistir todo; fallos limpian lo nuevo o conservan reserva recuperable, sin tocar originales previos.
- **FR-005**: Reintentos MUST preservar identidad y evitar sobrescribir/duplicar contenido confirmado.
- **FR-006**: Sitio/formulario MUST mostrar disponible, usado, total y máximo por tipo; contar miniaturas y reservas conocidas; actualizar después de subir/quitar.
- **FR-007**: Sin espacio MUST explicar problema y conservar borrador; jamás borrar/comprimir recuerdos automáticamente.
- **FR-008**: MUST conservar100% de títulos, archivos, cartas, canciones, fechas, álbumes, portadas, lugares y ajustes anteriores, sin migración de contenido.
- **FR-009**: MUST mantener privacidad y hosting gratuito, sin claves públicas, cuentas nuevas ni cambios de permisos.
- **FR-010**: UI MUST ser mobile first360px, celeste/rosado, teclado/controles44px; cargas largas admiten tiempo razonable y cancelación.
### Key Entities
Video privado; archivo original; espacio asignado al sitio; reserva temporal recuperable de subida; borrador local.
## Success Criteria
- **SC-001**: Video >50MB guardado/reiniciado/descargado conserva SHA-256; reproducción y solicitudes parciales funcionan.
- **SC-002**: Tamaño/cuota y fallos no crean un recuerdo confirmado ni alteran históricos.
- **SC-003**: Espacio coincide con uso confirmado y reservas conocidas; sin desbordamiento a360/390/1440px.
- **SC-004**: Comparación anterior/posterior conserva campos/rutas y código no reescribe objetos anteriores.
## Assumptions
Máximo por defecto200×1024² bytes, coherente con formato actual del sitio. Se conserva espacio asignado900.000.000 bytes y margen del plan gratuito. Indicador corresponde al sitio, no al agregado de toda la cuenta del proveedor. No se añaden formatos ni reanudación de red; se mantienen borrador y reintento existentes.
