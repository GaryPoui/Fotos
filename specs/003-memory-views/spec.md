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
- **FR-005**: En la vista carrusel, mostrar la foto central grande y hasta dos recuerdos inclinados a cada lado, con profundidad y transición suave circular inspirada en la referencia del usuario del 2026-10-08. Mantener celeste/rosado, acceso al original completo y videos pausados al cambiar de recuerdo.
- **FR-006**: Permitir seleccionar recuerdos laterales, navegar con flechas o gesto horizontal sin interceptar el scroll vertical; desactivar transiciones y presentación bajo movimiento reducido. Resolver sin duplicados bibliotecas de uno o dos recuerdos.
- **FR-007**: Iniciar automáticamente la presentación al abrir el carrusel con dos o más recuerdos y avanzar cada 7 segundos. Mantener pausa manual y por interacción, video o pestaña oculta; no iniciar automáticamente el visor ampliado ni bajo movimiento reducido.

### Key Entities
ViewPreference: vista elegida local; SlideshowState: índice y pausa, efímero.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Completar el recorrido independiente sin perder contenido al recargar.
- **SC-002**: Cero lecturas de contenido privado sin autenticación en las pruebas de integración.
- **SC-003**: Sin desbordamiento horizontal a 390 px; controles táctiles de al menos 44 px.
- **SC-004**: Verificación automatizada de los contratos sensibles y registro de validación manual.
- **SC-005**: Verificar transición, vuelta del último al primero, selección lateral, videos y movimiento reducido en móvil y escritorio; sin desbordamiento a 360 px.

## Assumptions
- Una pareja, un servidor y contraseña compartida; no registro público.
- Se usa disco persistente; no hay transcodificación ni sincronización offline.
- La publicación online necesita un proveedor y contraseña definidos fuera de Git.
- Los datos de ejemplo no se presentarán como recuerdos reales.

## Responsive y álbumes (2026-10-09)
- FR-008: Álbumes en fila acotada al ancho disponible, en móvil y escritorio, con flechas anterior/siguiente y deslizamiento táctil. Deshabilitar flechas en extremos y conservar selección/filtro.
- FR-009: Muchos álbumes y títulos largos no amplían el documento. Portada, calendario y visor modal se ajustan desde 360 px; cerrar, navegar y acciones permanecen accesibles.
- SC-006: Verificar 16 álbumes en 360/390/740/1440 px, sin desbordamiento, avance y regreso, selección, visor y movimiento reducido. No modificar datos privados ni almacenamiento.
