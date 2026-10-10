# Research
- Decision: exifr 7.1.3 full, parse selectivo con reviveValues:false, DateTimeOriginal y CreateDate; no ModifyDate ni File.lastModified.
  Rationale: File/JPEG/PNG/HEIC soportados; strings conservan reloj de cámara sin conversión UTC. Modificación no prueba toma.
  Alternatives: Date revivido puede desplazar días; WebP no soportado por exifr y usa fallback explícito.
  Sources: https://github.com/MikeKovarik/exifr y https://registry.npmjs.org/exifr/latest (verificados por agente de investigación solicitado por skill plan).
- Decision: capturedAt sin zona más captureOffset opcional; dateSource metadata/upload/manual; createdAt sigue representando subida.
  Rationale: evita inferir zonas y mantiene compatible el día date anterior.
- Decision: registros JSON opcionales capture:<id> en meta existente, sin cambios de schema ni UPDATE histórico.
  Rationale: conserva las tablas y registros actuales y funciona con los permisos DML existentes, sin depender de credencial de administración. La fila media es el punto de commit: metadatos de subidas fallidas se limpian; reintentos conservan id. Rollback de código compatible.
  Alternatives: columnas nuevas necesitan privilegios DDL innecesarios para esta ampliación; usar tags mezclaría datos internos con etiquetas personales.
  Sources: https://supabase.com/docs/guides/database/tables.md; changelog.md revisado, sin cambios relevantes al almacenamiento privado existente.
- Decision: respaldo privado completo vía API con SHA-256 antes de almacenamiento; comparación posterior de campos históricos y originales.
  Rationale: no depender del disco efímero ni del tag para respaldar el contenido personal.
