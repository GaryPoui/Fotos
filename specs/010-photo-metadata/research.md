# Research
- Decision: exifr 7.1.3 full, parse selectivo con reviveValues:false, DateTimeOriginal y CreateDate; no ModifyDate ni File.lastModified.
  Rationale: File/JPEG/PNG/HEIC soportados; strings conservan reloj de cámara sin conversión UTC. Modificación no prueba toma.
  Alternatives: Date revivido puede desplazar días; WebP no soportado por exifr y usa fallback explícito.
  Sources: https://github.com/MikeKovarik/exifr y https://registry.npmjs.org/exifr/latest (verificados por agente de investigación solicitado por skill plan).
- Decision: capturedAt sin zona más captureOffset opcional; dateSource metadata/upload/manual; createdAt sigue representando subida.
  Rationale: evita inferir zonas y mantiene compatible el día date anterior.
- Decision: ALTER ADD columnas nullable y sin UPDATE histórico; SQLite PRAGMA y SQL explícito PostgreSQL.
  Rationale: schema remoto se instala con credencial de administración separada, no al arrancar Render. Rollback de código compatible.
  Sources: https://supabase.com/docs/guides/database/tables.md; changelog.md revisado sin breaking changes relevantes al ALTER.
- Decision: respaldo privado completo vía API con SHA-256 antes de almacenamiento; comparación posterior de campos históricos y originales.
  Rationale: no depender del disco efímero ni del tag para respaldar el contenido personal.
