# Plan 009

1. Respaldo: módulo exportador fflate con partes <=100 MB, archivos privados secuenciales y SHA-256, JSON completo en cada parte; descarga por acción explícita para no perder partes por bloqueo del navegador. UI de ajustes.
2. Cola: IndexedDB temporal (File + formulario + id estable), pausa AbortController, progreso y eventos de conexión. TUS cloud con JWT renovado, chunks 6 MiB, fingerprint por id/ruta, reserva idempotente, objetos completados reconocidos. Descarte remoto protegido por lectura de metadatos. Local idempotente por id estable, limpieza de temporales. Un bloqueo del navegador evita ejecución concurrente de la misma cola.
3. HEIC: decodificador heic-to/csp lazy, límite de tamaño y JPEG calidad .9. Guardar el JPEG preparado en cola antes de transmitir. Probar con fixture público técnico de upstream, sin fotos personales.
4. Portada: Settings opcionales coverId/featuredId, validación local/Firestore; selectors de fotos y recuerdos; calendario puro para días juntos.
5. Revivir: sección por fecha, tarjetas de álbumes y atajos de categoría sobre campo album existente; visor compartido sin duplicar acciones destructivas.

Verificar cada bloque con build, integración relevante y navegador. Commit/push/deploy por bloque. No migrar contenido personal ni facturación. PowerShell no disponible: revisar prerequisitos y artefactos directamente; sin hooks registrados.
