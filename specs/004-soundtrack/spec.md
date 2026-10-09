# Feature Specification: Nuestra música

**Feature Branch**: main (entrega incremental autorizada)
**Created**: 2026-10-07
**Status**: Implemented and verified
**Input**: Web privada de recuerdos de pareja, desarrollada con Spec Kit; mobile first, celeste y rosado.

## User Scenarios & Testing

### User Story 1 - Escuchar nuestras canciones mientras vemos recuerdos (Priority: P1)
Como integrante de la pareja quiero escuchar nuestras canciones mientras vemos recuerdos.

**Why this priority**: Es el recorrido central de esta entrega.
**Independent Test**: Subir un audio, reproducirlo, navegar a cartas, pausar, cambiar pista y volumen.

**Acceptance Scenarios**:
1. **Given** una sesión autorizada, **When** se completa el recorrido independiente, **Then** la operación funciona y el contenido persiste.
2. **Given** una sesión ausente o expirada, **When** se solicita contenido privado, **Then** se exige ingresar nuevamente.
3. **Given** un error de red o entrada inválida, **When** falla una operación, **Then** se explica el error y se puede reintentar.

### Edge Cases
Biblioteca vacía, contenido eliminado, sesión expirada, archivo inválido, pantalla pequeña y movimiento reducido.

## Requirements

### Functional Requirements
- **FR-001**: Subir audios privados con título y artista, con validación y persistencia.
- **FR-002**: Ofrecer lista de canciones, reproducción/pausa, anterior/siguiente, progreso y volumen.
- **FR-003**: Mantener reproductor al cambiar de sección y intentar comenzar al entrar con una canción aleatoria al 15%, con activación explícita si el navegador lo bloquea.
- **FR-004**: Permitir eliminar canciones con confirmación y mostrar errores de reproducción compatibles.

### Key Entities
Track: media kind audio, título, artista, archivo, fecha de creación.

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

## Música de fondo al entrar (2026-10-08)
- FR-006: Tras autenticar y cargar la biblioteca, elegir uniformemente una canción disponible e intentar reproducirla al 15%. No descargar audio antes de la sesión.
- FR-007: Música permite elegir pista, pausar y ajustar volumen; navegar o actualizar la biblioteca conserva esos cambios sin reiniciar ni reabrir un reproductor cerrado.
- FR-008: Sin canciones no iniciar audio. Si se bloquea autoplay, mostrar un botón claro para activarlo. Atenuar también en móviles sin volumen nativo programable.
