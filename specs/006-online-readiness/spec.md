# Feature Specification: Hosting, respaldo y verificación

**Feature Branch**: main (entrega incremental autorizada)
**Created**: 2026-10-07
**Status**: Implemented and verified
**Input**: Web privada de recuerdos de pareja, desarrollada con Spec Kit; mobile first, celeste y rosado.

## User Scenarios & Testing

### User Story 1 - Poder abrir nuestro rincón online sin perder recuerdos (Priority: P1)
Como integrante de la pareja quiero poder abrir nuestro rincón online sin perder recuerdos.

**Why this priority**: Es el recorrido central de esta entrega.
**Independent Test**: Compilar, arrancar producción, comprobar health, reiniciar preservando datos y restaurar respaldo.

**Acceptance Scenarios**:
1. **Given** una sesión autorizada, **When** se completa el recorrido independiente, **Then** la operación funciona y el contenido persiste.
2. **Given** una sesión ausente o expirada, **When** se solicita contenido privado, **Then** se exige ingresar nuevamente.
3. **Given** un error de red o entrada inválida, **When** falla una operación, **Then** se explica el error y se puede reintentar.

### Edge Cases
Biblioteca vacía, contenido eliminado, sesión expirada, archivo inválido, pantalla pequeña y movimiento reducido.

## Requirements

### Functional Requirements
- **FR-001**: Incluir Docker y guía para hosting Node con HTTPS y volumen persistente.
- **FR-002**: Rechazar inicio sin contraseña segura en producción; no versionar secretos ni archivos personales.
- **FR-003**: Ofrecer respaldo consistente de metadatos y archivos e instrucciones para restaurar.
- **FR-004**: Ejecutar pruebas de integración, recorridos de navegador, typecheck y build; documentar límites y requisitos externos.

### Key Entities
Backup: SQLite consistente y carpeta media; RuntimeConfig: puerto, volumen, contraseña, origen.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Completar el recorrido independiente sin perder contenido al recargar.
- **SC-002**: Cero lecturas de contenido privado sin autenticación en las pruebas de integración.
- **SC-003**: Sin desbordamiento horizontal a 390 px; controles táctiles de al menos 44 px.
- **SC-004**: Verificación automatizada de los contratos sensibles y registro de validación manual.

## Assumptions
- Una pareja, un servidor y contraseña compartida; no registro público.
- Se usa disco persistente; no hay transcodificación ni sincronización offline.
- La publicación online necesita un proveedor y contraseña definidos fuera de Git.
- Los datos de ejemplo no se presentarán como recuerdos reales.


