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
