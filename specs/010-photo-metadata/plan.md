# Implementation Plan: Fechas automáticas
**Branch**: `main` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary
Leer EXIF del original antes de prepareImage, conservar por ítem en IndexedDB, persistir campos opcionales sin tocar registros históricos y filtrar en Gallery con reloj de cámara o subida argentina.

## Technical Context
- TypeScript, React 19, Express 5, Node 24, exifr 7.1.3 (versión exacta).
- SQLite local; PostgreSQL privado rincon y Storage privado existentes en Supabase.
- Vitest, Supertest, PGlite y Playwright móvil/escritorio; CI Linux y build Docker.
- Tamaños y concurrencia existentes; lectura selectiva de fechas, sin GPS ni extracción de datos adicionales.
- Metadatos soportados JPEG/PNG/HEIC; otros formatos sin lectura usan subida. Sin transcodificación nueva.

## Constitution Check
PASS antes/después del diseño: sesión y originales privados; respaldo fuera de Git; columnas opcionales aditivas; spec antes del código; integración y navegador; 360 px y controles 44 px; servicios gratuitos. Sin infracciones.

## Project Structure
```text
shared/media-time.ts
shared/types.ts
src/photo-metadata.ts
src/upload-queue.ts
src/components/{UploadDialog,Gallery,Viewer}.tsx
server/{app,db,database}.ts
supabase/{schema,photo-metadata}.sql
tests/{metadata,api,e2e}.test / .spec.ts
specs/010-photo-metadata/{spec,plan,research,data-model,quickstart,tasks}.md
```
**Structure Decision**: Ampliación de la aplicación existente; ningún servicio o almacenamiento nuevo.

## Delivery
Versión actual y tag primero; respaldo íntegro; pruebas de preservación; lectura/carga; filtros; checks locales y CI; ALTER seguro con verificación antes/después; deploy manual Render; comparación final de datos y hashes existentes.
