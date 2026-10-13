# Implementation Plan: Orden por hora de toma
**Branch**: main | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

## Summary
Extraer DateTimeOriginal completo con exifr, conservar reloj local y usar HH:mm:ss como segunda clave después del día manual. Guardar datos nuevos en meta opcional, nunca actualizar fechas anteriores. Preservar información antes de HEIC y en borradores. Una función de orden compartida sirve a API, Gallery y recuerdos del día. Visor muestra hora conocida. Asesoría de espacio sólo lectura.

## Technical Context
TypeScript/Node22.13+ (Render24), React19/Express5, Sharp0.35.5; añadir exifr7.1.3 fijado con lockfile. PostgreSQL rincon privado + Storage privado vía bridge existente, SQLite local. Meta namespace nuevo `photo-clock:<UUID>` contiene capturedAt local validado. Sin DDL/migración ni cambios en Storage/credenciales/RLS. Vitest, PGlite y Playwright Chromium móvil360/390 y desktop1440.
Escala: 204 fotos, 5 canciones y 3 escritos actuales; sólo parsear originales nuevos, sin descargar biblioteca anterior. Parser selectivo, GPS desactivado, carga diferida en navegador; Sharp extrae EXIF de formatos soportados también en servidor. No compresión ni migración de archivos en esta función.

## Constitution Check
PASS antes/después del diseño: sesión privada existente; persistencia real y datos originales intactos; docs antes del código; integración para archivos/borradores/DB; controles móviles, celeste/rosado, sin pagos ni cuentas nuevas. La lectura opcional no bloquea una foto compatible si no hay EXIF válido.

## Project Structure
`shared/photo-clock.ts` validación/comparador; `shared/photo-metadata.ts` parser selectivo compartido; `server/photo-clock.ts` lectura Sharp + meta; `server/app.ts` integración atómica con compensación; `src/upload-queue.ts` y `src/components/UploadDialog.tsx` capturar antes de convertir/persistir; `src/components/Gallery.tsx`, `src/moments.ts`, `src/components/Viewer.tsx` orden/etiqueta. `tests/photo-clock.test.ts`, integración local/PGlite y `tests/e2e.spec.ts`.

## Complexity Tracking
Sin violaciones. Namespace separado evita reactivar datos de la función010 retirada. Si el INSERT de media devuelve error ambiguo, se verifica confirmación antes de limpiar, conservando original y reloj de una foto guardada. Dos consultas de lista (media + relojes), sin consulta por foto.
