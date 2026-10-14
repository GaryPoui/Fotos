# Feature Specification: Horas de fotos anteriores
**Branch**: main | **Created**: 2026-10-14 | **Status**: Applied and verified
**Input**: Organizar también fotos viejas por hora, minuto y segundo además de la fecha.
## User Scenarios & Testing
### US1 - Ordenar fotos anteriores (Priority: P1)
Como pareja quiero que las fotos guardadas antes de014 usen su hora original sin volver a subirlas o introducir horas.
**Independent Test**: Originales con EXIF completo reciben hora y se ordenan en las vistas existentes, manteniendo día manual.
**Acceptance**: Leer sólo originales; recuperar HH:mm:ss completo; las horas ausentes/dañadas permanecen desconocidas y usan orden de subida.
### US2 - Preservar contenido (Priority: P1)
**Independent Test**: Comparar filas y datos existentes antes/después, comprobar repetición idempotente y rollback.
**Acceptance**: No cambiar títulos, fechas, fotos, miniaturas, cartas, canciones, álbumes, preferencias ni horas existentes; filas modificadas durante revisión se omiten.
### Edge Cases
EXIF retirado por mensajería/conversión, formatos sin hora; registros eliminados o editados durante revisión; relojes existentes incluso inválidos; descarga incompleta, tipo incorrecto, fallo de transacción.
## Requirements
- FR-001 MUST revisar originales de fotos anteriores sin hora registrada; no miniaturas ni fecha de modificación.
- FR-002 MUST guardar sólo horas originales completas válidas y conservar día manual, sin desplazar zona.
- FR-003 MUST omitir metadatos ausentes o inválidos sin inventar hora ni bloquear recuerdos.
- FR-004 MUST conservar originales y todas las filas/campos previos; sólo añadir datos de hora faltantes.
- FR-005 MUST separar revisión y aplicación con respaldo privado; ante fallos revertir únicamente datos nuevos de la operación.
- FR-006 MUST omitir fotos cambiadas/eliminadas entre revisión y aplicación y respetar horas añadidas concurrentemente.
- FR-007 MUST ser repetible sin sobreescritura; registrar resultados agregados sin publicar información personal.
### Key Entities
Foto anterior, original privado verificado por tamaño/tipo/digest, propuesta de hora, resultado de aplicación y snapshot privado.
## Success Criteria
- SC-001 Todas las fotos con EXIF original recuperable usan HH:mm:ss sin volver a cargar el archivo.
- SC-002 Todos los campos/filas previos y archivos permanecen intactos; cero horas existentes sobrescritas.
- SC-003 Repetición agrega cero registros duplicados; fallos no dejan inserciones parciales.
- SC-004 Se informa número recuperado/desconocido y se verifica orden en la página.
## Assumptions
Ampliación explícita del alcance014. Revisión sólo de la biblioteca existente al comenzar. No se recupera EXIF que ya fue eliminado ni se reactivan registros capture: de010. No se cambia infraestructura, presupuesto o credenciales.
