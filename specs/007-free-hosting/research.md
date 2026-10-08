# Research: publicación gratuita
- Decision: Render Free + Supabase Free. Rationale: sin cargos y compatible con Node. Alternatives: disco Render pago contradice presupuesto; GitHub Pages no ejecuta API; SQLite en Render Free pierde datos.
- Decision: PostgreSQL vía pg y pooler Session IPv4, TLS verificado (CA configurable). Rationale: persistencia de sesiones y metadatos sin snapshots frágiles. https://supabase.com/docs/guides/database/connecting-to-postgres
- Decision: bucket privado, servicio backend con service-role, proxy de archivos autenticado con Range. Rationale: no dejar URLs públicas ni URLs firmadas reutilizables tras logout. https://supabase.com/docs/guides/storage/buckets/fundamentals
- Decision: 50 MB decimales por archivo y 900 MB totales, contando miniaturas; uploads serializados por instancia. Rationale: margen ante cuota gratuita de 1 GB. https://supabase.com/docs/guides/storage/uploads/file-limits
- Limits: Render duerme tras 15 minutos y disco efímero, 750 horas por mes. https://render.com/docs/free
- Limits: Supabase 500 MB de DB, 1 GB Storage, 5 GB egress; pausa tras una semana inactivo; sin backups automáticos. https://supabase.com/pricing
- RENDER_EXTERNAL_URL sirve como origen HTTPS predeterminado. https://render.com/docs/environment-variables
- Investigación independiente de agente completada; sin incertidumbres técnicas pendientes. Credenciales e inicio de sesión son prerrequisitos externos.
