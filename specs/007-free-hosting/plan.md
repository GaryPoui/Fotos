# Implementation Plan: Publicación gratuita
**Branch**: main | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary
Render Free ejecuta Express y React. Supabase Free conserva PostgreSQL y archivos en bucket privado. La API mantiene contratos existentes y autenticación compartida. SQLite/disco siguen disponibles en local.
## Technical Context
- Language/Version: TypeScript, Node 22.
- Dependencies: Express, pg, Storage REST; PGlite para integración PostgreSQL local.
- Storage: SQLite local o PostgreSQL remoto, Supabase Storage privado.
- Testing: Vitest (SQLite, PostgreSQL real embebido y Storage HTTP), Playwright, build.
- Target: Linux Docker en Render Free, una instancia.
- Performance: navegación móvil; permitir despertar lento del plan gratuito.
- Constraints: 50.000.000 bytes por archivo, 900.000.000 totales incluyendo miniaturas; sin cargos.
- Scale: una pareja; pool PostgreSQL máximo 3 conexiones.
## Constitution Check
Privacidad: pasa, ningún secreto al cliente, RLS en tablas y bucket privado. Persistencia: la exigencia literal de volumen se amplía por solicitud del usuario a almacenamiento remoto persistente; queda documentada en constitución. Especificaciones: pasa. Verificación: integración remota y regresión local. Accesibilidad: UI existente. Costo: sólo Free.
## Project Structure
- server/database.ts: adaptador SQL asíncrono SQLite/PostgreSQL.
- server/cloud-storage.ts: archivos privados, proxy Range, validación de bucket.
- server/app.ts, server/index.ts: modalidad remota y cupos serializados.
- supabase/schema.sql: tablas privadas compatibles.
- render.yaml: plan free sin disco.
- tests/cloud.test.ts: persistencia tras recrear staging, privacidad, fallos y rangos.
- docs/free-hosting.md: configuración, límites, respaldo y publicación real.
## Complexity Tracking
Dos proveedores son necesarios: Render Free no conserva disco; Supabase Free provee datos y objetos persistentes. No se reemplaza la implementación local.

## Alternativa vigente
El 2026-10-08 el usuario eligió Firebase parcial + proveedor gratuito. Ver spec 008; las tareas Render/PostgreSQL de esta alternativa no se ejecutan ni se marcan completas.

## Selección actual
El usuario volvió a elegir explícitamente Render Free + Supabase Free y contraseña propia el 2026-10-08. Se ejecutan las tareas de spec 007 y se conservan las mejoras de 008/009. Bucket rincon-render separado para preservar archivos y políticas de la publicación anterior.

## Acceso al almacenamiento sin exportar credenciales administrativas
Supabase Edge Function rincon-storage conserva el service-role gestionado por Supabase y acepta un token aleatorio de 256 bits conocido sólo por Render. El código desplegado contiene únicamente su hash SHA-256. Se restringen rutas y métodos al bucket rincon-render; no es un proxy general y nunca devuelve credenciales. Las llamadas usan el plan Free de Edge Functions. El adaptador también admite service-role directo si el usuario lo configura en otro despliegue.
