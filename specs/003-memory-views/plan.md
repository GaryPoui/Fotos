# Implementation Plan: Galerías, línea de tiempo y carrusel
**Branch**: main | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)
## Summary
Volver a vivir nuestros momentos. Interfaz mobile first celeste/rosado.
## Technical Context
**Language/Version**: TypeScript, Node >=22.13
**Primary Dependencies**: React, Vite, Express, Multer, file-type, Zod, Lucide
**Storage**: SQLite node:sqlite + DATA_DIR; una instancia
**Testing**: Vitest/Supertest, Playwright, tsc, vite build
**Target Platform**: Navegador móvil/escritorio; servidor Linux/Windows
**Project Type**: Web full stack
**Performance Goals**: Imágenes lazy; consultas indexadas; subidas a disco
**Constraints**: 2 usuarios, HTTPS, 200 MiB/archivo, 1 GiB total configurable
**Scale/Scope**: Una pareja, sin transcodificación
## Constitution Check
PASS antes/después de diseño. Sesión en API/medios; SQLite/disco; specs previos; integración/navegador.
360 px+, controles 44 px y reduced-motion. Sin excepciones.
## Project Structure
Docs: spec, plan, research, data-model, contracts, quickstart, tasks.
Código: src/components/Gallery.tsx, src/components/Viewer.tsx, src/styles.css.
Compartido: server/, src/components/, tests/, scripts/, docs/.
## Complexity Tracking
Sin violaciones. Se evita backend externo y autenticación de terceros.

## Ajuste visual 2026-10-08
Implementar Coverflow.tsx como escenario del Viewer inline: tarjetas con claves estables por UUID,
distancia circular al centro, transformaciones CSS perspective/rotateY/translateZ/scale y transición de 550 ms.
Renderizar sólo vecinos próximos; usar miniaturas privadas y videos con metadata sin autoplay.
Pausar el video saliente. Mantener visor modal completo y acciones existentes. Sin nueva dependencia.
Gestos distinguen horizontal/vertical; flechas de teclado limitadas al escenario enfocado.
Verificar con Playwright y capturas sintéticas, compilar, commit/push y desplegar Render Free.
La presentación inline comienza activa (excepto movimiento reducido o un solo recuerdo), con intervalo
de 7000 ms; se conserva la pausa existente por interacción, reproducción de video y pestaña oculta.
El escenario recorta con overflow:clip para evitar desplazamientos internos hacia tarjetas 3D fuera del borde.
La prueba de selección lateral toca una superficie expuesta real, respetando la superposición por perspectiva.
