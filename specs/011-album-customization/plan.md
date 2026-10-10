# Implementation Plan: Álbumes personalizables
**Branch**: `main` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary
Persistir title/coverId por clave estable de álbum en meta existente; no reescribir media. Exponer Library.albums opcional y PATCH /api/albums privado. Resolver nombres visibles en todos los controles y convertirlos de vuelta a la clave al subir/editar. Editor con preview y selector de miniaturas existentes.
## Technical Context
TypeScript, React 19, Express 5, Node 24; SQLite local, PostgreSQL privado rincon y Storage privado Supabase existentes. Sin dependencia nueva ni cambios de esquema. Vitest/Supertest/PGlite y Playwright móvil/escritorio. Un álbum por valor Media.album, cientos de archivos; miniaturas lazy; una escritura atómica para título/portada.
## Constitution Check
PASS antes/después: privado con sesión y protección de mutaciones; datos históricos intactos; respaldo privado; spec previa; pruebas proporcionales de API, persistencia y navegador; 360 px, controles44 y paleta existente; hosting Free. Sin permisos nuevos ni migraciones.
## Project Structure
shared/types.ts; shared/albums.ts; server/app.ts; src/App.tsx; src/components/{Revisit,AlbumDialog,Gallery,Viewer,UploadDialog}.tsx; src/{styles,backup}; tests/{albums.test.ts,e2e.spec.ts}; specs/011-album-customization/.
**Structure Decision**: Ampliación pequeña de la web y tabla meta actuales.
## Delivery
Respaldo privado actual y main sincronizado; pruebas de API antes del código; commit/push diseño; implementación; build, integración y recorridos mobile/PC; CI; deploy manual Render; prueba pública sintética sin editar álbumes personales y comparación de datos/originales.
