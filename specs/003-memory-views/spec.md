# Feature Specification: Galerías, línea de tiempo y carrusel

**Feature Branch**: main (entrega incremental autorizada)
**Created**: 2026-10-07
**Status**: Implemented and verified
**Input**: Web privada de recuerdos de pareja, desarrollada con Spec Kit; mobile first, celeste y rosado.

## User Scenarios & Testing

### User Story 1 - Volver a vivir nuestros momentos (Priority: P1)
Como integrante de la pareja quiero volver a vivir nuestros momentos.

**Why this priority**: Es el recorrido central de esta entrega.
**Independent Test**: Alternar mosaico, línea de tiempo y carrusel; avanzar con toque/teclado y pausar.

**Acceptance Scenarios**:
1. **Given** una sesión autorizada, **When** se completa el recorrido independiente, **Then** la operación funciona y el contenido persiste.
2. **Given** una sesión ausente o expirada, **When** se solicita contenido privado, **Then** se exige ingresar nuevamente.
3. **Given** un error de red o entrada inválida, **When** falla una operación, **Then** se explica el error y se puede reintentar.

### Edge Cases
Biblioteca vacía, contenido eliminado, sesión expirada, archivo inválido, pantalla pequeña y movimiento reducido.

## Requirements

### Functional Requirements
- **FR-001**: Ofrecer mosaico, línea de tiempo por mes y carrusel sobre los recuerdos filtrados.
- **FR-002**: Permitir siguiente/anterior, gesto horizontal y presentación automática con pausa.
- **FR-003**: Abrir foto/video en visor accesible con Escape, controles y navegación por teclado.
- **FR-004**: Respetar movimiento reducido, pausar al ocultar la pestaña y evitar reproducir videos automáticamente.

### Key Entities
ViewPreference: vista elegida local; SlideshowState: índice y pausa, efímero.

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


