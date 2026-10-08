# Feature Specification: Publicación gratuita

**Feature Branch**: `main` | **Created**: 2026-10-08 | **Status**: Ready for implementation
**Input**: «hacelo gratis»: publicar el rincón de Ailu y Tomy sin contratar servicios de pago.

## User Scenarios & Testing

### User Story 1 - Conservar nuestros recuerdos online (Priority: P1)
Ailu y Tomy entran desde una dirección HTTPS y guardan recuerdos, canciones y cartas sin pagar.
**Why this priority**: El despliegue sólo sirve si los recuerdos sobreviven a reinicios.
**Independent Test**: Subir una foto y una carta, reemplazar el servidor sin su disco y abrir ambas nuevamente.
**Acceptance Scenarios**:
1. **Given** contenido guardado, **When** el servidor se reinicia o actualiza, **Then** fotos, miniaturas, escritos, ajustes y sesiones siguen disponibles.
2. **Given** una persona sin sesión, **When** intenta abrir archivos o escritos, **Then** no puede leerlos ni modificarlos.
3. **Given** un servicio de almacenamiento caído, **When** se intenta guardar, **Then** se informa el error y no se afirma que se guardó.

### User Story 2 - Respetar el presupuesto cero (Priority: P1)
Tomy publica usando planes gratuitos y conoce sus límites.
**Why this priority**: No está autorizado ningún cargo ni contratación de pago.
**Independent Test**: Revisar configuración sin discos o planes pagos y rechazar archivos que excedan los límites configurados.
**Acceptance Scenarios**:
1. **Given** el límite alcanzado, **When** se sube un archivo, **Then** se rechaza sin contratar ampliaciones.
2. **Given** cuentas aún sin completar, **When** se prepara el despliegue, **Then** se indica qué paso del usuario falta y no se presenta como publicado.

### Edge Cases
- El servidor gratuito duerme y el primer acceso tarda; el proveedor de datos puede pausar tras inactividad.
- Subidas concurrentes no pueden exceder el cupo, incluyendo miniaturas.
- Una configuración remota incompleta debe fallar al iniciar, nunca usar silenciosamente almacenamiento efímero.
- Los recuerdos locales existentes no se publican ni migran automáticamente.

## Requirements
### Functional Requirements
- **FR-001**: Conservar todos los datos y archivos fuera del disco temporal del servidor gratuito.
- **FR-002**: Mantener el acceso por contraseña, privacidad de archivos, reproducción por rangos y experiencia mobile first celeste/rosada.
- **FR-003**: Configurar un máximo de 50.000.000 bytes por archivo y 900.000.000 bytes totales, contando miniaturas, para la modalidad gratuita.
- **FR-004**: Rechazar subidas que excedan el cupo; no activar ampliaciones ni planes pagos.
- **FR-005**: Mantener secretos fuera de Git y del navegador; exigir conexión cifrada al proveedor.
- **FR-006**: Mantener la modalidad local y documentar por separado respaldo local y remoto.
- **FR-007**: Verificar con pruebas de integración privacidad, persistencia remota, errores de subida y concurrencia antes de publicar.

### Key Entities
- Recuerdo y miniatura: metadatos privados, archivo original, tamaño total reservado.
- Sesión: token opaco con expiración y versión de contraseña.
- Configuración del despliegue: dirección HTTPS, secretos, cupos y selección del almacenamiento.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Cero cargos o recursos pagos creados.
- **SC-002**: El 100% de los elementos del recorrido de persistencia sobreviven al reemplazo del servidor.
- **SC-003**: Cero lecturas privadas sin sesión en las pruebas.
- **SC-004**: Ninguna subida aceptada excede los cupos en las pruebas concurrentes.

## Assumptions
- Una pareja y una instancia; las cuotas gratuitas no garantizan disponibilidad continua.
- Tomy completa inicios de sesión y altas de cuentas que acepten términos.
- Subdominio incluido; no comprar dominio ni migrar recuerdos personales sin indicación.
