# Feature Specification: Frases y cartas

**Feature Branch**: main (entrega incremental autorizada)
**Created**: 2026-10-07
**Status**: Implemented and verified
**Input**: Web privada de recuerdos de pareja, desarrollada con Spec Kit; mobile first, celeste y rosado.

## User Scenarios & Testing

### User Story 1 - Dejarnos palabras para volver a leer (Priority: P1)
Como integrante de la pareja quiero dejarnos palabras para volver a leer.

**Why this priority**: Es el recorrido central de esta entrega.
**Independent Test**: Crear una frase y una carta, leerlas completas, editar, marcar favorita y recargar.

**Acceptance Scenarios**:
1. **Given** una sesión autorizada, **When** se completa el recorrido independiente, **Then** la operación funciona y el contenido persiste.
2. **Given** una sesión ausente o expirada, **When** se solicita contenido privado, **Then** se exige ingresar nuevamente.
3. **Given** un error de red o entrada inválida, **When** falla una operación, **Then** se explica el error y se puede reintentar.

### Edge Cases
Biblioteca vacía, contenido eliminado, sesión expirada, archivo inválido, pantalla pequeña y movimiento reducido.

## Requirements

### Functional Requirements
- **FR-001**: Crear, leer, editar y eliminar frases y cartas con título, texto, autor y fecha.
- **FR-002**: Guardar escritos de forma privada y persistente, manteniendo saltos de línea.
- **FR-003**: Permitir favoritos y buscar por título/contenido/autor.
- **FR-004**: Validar textos vacíos y límites de longitud; mostrar texto sin ejecutar HTML.

### Key Entities
Note: id, type quote/letter, title, body, author, date, favorite, createdAt.

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


