# Verificación

Fecha: 2026-10-08 (America/Buenos_Aires).

## Revalidación local antes del hosting (2026-10-08)

- `npm ci`: dependencias instaladas; auditoría sin vulnerabilidades.
- `npm run build`: TypeScript, Vite y servidor compilados correctamente.
- `npm test`: 12/12 pruebas PASS.
- `npm run test:e2e`: 8/8 recorridos PASS en Chromium móvil/escritorio.
- `npm run dev`: cliente en http://127.0.0.1:5173/ y API en puerto 3001;
  `/api/health` responde correctamente. Contraseña generada sólo en `.env`, ignorado por Git.
- Se comprobó adicionalmente el login real contra Vite y la biblioteca autenticada;
  captura local en `test-results/local-running.png`. Captura móvil de galería revisada.
- Firebase MCP autenticado; proyecto `fotosconailu` confirmado. La configuración inicial
  fue reemplazada por la alternativa Firebase parcial autorizada; ver evidencia cloud abajo.
- El chat compartido no pudo leerse: el acceso directo respondió HTTP 403.
  El contexto de continuación procede del árbol actual, historial Git y spec 007.
- PowerShell no está instalado en este entorno: no se ejecutó el resolver `.ps1` de
  Spec Kit. Se revisaron directamente spec, plan, tasks, investigación, modelo,
  contratos, quickstart y checklist de 16/16 elementos completos. Sin hooks configurados.

Estos resultados corresponden a la modalidad local. No demuestran persistencia remota
ni publicación HTTPS; las tareas pendientes de spec 007 siguen pendientes.

## Publicación Firebase parcial verificada (2026-10-08)

- URL pública HTTPS: **https://fotosconailu.web.app**, HTTP 200; cabeceras CSP,
  noindex, DENY y no-store en archivos privados comprobadas.
- Firebase `fotosconailu`: Spark, facturación deshabilitada; Auth email/password,
  cuenta compartida con claims administrativos, Firestore Standard y Hosting desplegados.
- Supabase `mzujwjvsallqhxndodjf`: región São Paulo, organización **Free**, integración
  Firebase real, bucket privado `rincon`, SQL/RLS/trigger y RPC aplicados.
- `npm run build`, `npm run build:cloud`: PASS. `npm test`: 19 PASS y 5 de emulador
  omitidas en esa ejecución; `npm run test:rules`: las 5 de Firestore PASS.
- `npm run test:e2e`: 8/8 PASS en móvil/escritorio con modalidad local conservada.
- Cuota real concurrente: con 850 MB reservados, dos reservas simultáneas de 40 MB
  admitieron sólo una (890 MB total); reservas sintéticas eliminadas al terminar.
- `node scripts/smoke-cloud.mjs https://fotosconailu.web.app`: PASS real en Chromium
  móvil. Login, carta y sesión persistentes tras recarga; original/miniatura y recarga;
  Range HTTP 206; cierre de sesión bloquea nuevas lecturas con 401; audio WAV y video
  WebM se suben, reproducen y eliminan. El video abre pausado. Sin errores JS.
- La prueba de reproducción detectó que CORS oculta Content-Range de Storage. El proxy
  ahora reconstruye ese header usando tamaño inmutable y comprueba la longitud.
  La corrección fue publicada y verificada reproduciendo audio/video en HTTPS.
- Todo el contenido de pruebas real fue eliminado; bucket y reservas quedaron vacíos.
  No se migraron ni modificaron recuerdos personales locales.
- Auditoría npm sin vulnerabilidades. Captura móvil en `test-results/cloud-real-mobile.png`.
- Código/documentación de esta alternativa: spec 008. Respaldo cloud y límites de
  cuotas/disponibilidad/sesión documentados en [free-hosting.md](free-hosting.md).

## Mejoras 1–5 / spec 009 (2026-10-08)

- Publicadas por bloques: respaldo ZIP, reanudación/cola, HEIC y portada/fechas/álbumes.
  Se conservaron contraseña, acertijos y mecanismo de acceso.
- `npm test`: **24 PASS**, 5 de emulador omitidas en esa ejecución.
  `npm run test:rules`: **5 PASS**, incluyendo ajustes de portada, campos inválidos y permisos.
- `npm run build` y `npm run build:cloud`: PASS; `npx playwright test`: **18/18 PASS**
  móvil/escritorio. Tras el aviso de tandas pendientes y el ajuste de portada liviana,
  una pasada enfocada adicional dio **6/6 PASS**, incluyendo limpieza de archivos temporales
  y referencias TUS al cerrar sesión (20 recorridos distintos comprobados en total).
  Incluye ZIP extraído, originales/miniaturas/metadatos, respuesta de subida
  perdida con archivo ya guardado, cola recuperada tras reload sin duplicados, HEIC real,
  selección persistente de portada/destacado, contador, fecha histórica y álbumes.
- `node scripts/smoke-resume.mjs https://fotosconailu.web.app`: PASS. WAV sintético 7 MiB,
  interrupción tras primer fragmento 6 MiB, recarga, HEAD con Upload-Offset **6291456**,
  reanudación, confirmación y eliminación. Reserva/ID estable, sin volver al byte cero.
- `node scripts/smoke-heic.mjs https://fotosconailu.web.app`: PASS bajo CSP pública. Fixture
  técnico HEIC de libheif convertido en dispositivo, JPEG privado y recarga; eliminado.
- `node scripts/smoke-home.mjs https://fotosconailu.web.app`: PASS. Ajustes de portada/destacado
  realmente persistidos en Firestore, recuerdo de hace cuatro años y navegación por álbum.
  ZIP cloud descargado y abierto con original, miniatura y metadatos. Se restauraron las
  selecciones previas de portada; nombres y fecha de la pareja no se modificaron. Sólo se
  eliminaron la foto/álbum sintéticos propios.
- Captura móvil de portada revisada: `test-results/personal-cover-mobile.png`.
  Sin desbordamiento y controles táctiles >=44 px, teclado y vistas anteriores conservados.
- Reglas Firestore y Hosting publicados juntos. Sin cambios SQL, bucket público, proveedores
  adicionales, planes o facturación. Limitaciones y uso en [free-hosting.md](free-hosting.md).

## Verificación histórica de la modalidad Node/SQLite

- TypeScript cliente/servidor: PASS.
- Compilación Vite y servidor: PASS.
- Vitest: 12 pruebas PASS. Privacidad, acceso, origen, rate limit, firmas, límites, limpieza,
  CRUD, fechas, sesión/persistencia tras reinicio y revocación por cambio de contraseña.
- Backup: snapshot íntegro restaurable con medios/escritos, sin sesiones; bloqueo de servidor activo.
- Producción: rechazo de contraseña/origen inseguro, cookies Secure/HttpOnly/SameSite y origen fijo: PASS.
- Browser QA: 8 recorridos PASS en Chromium, móvil de 390 × 844 y escritorio de 1440 × 1000.
  Galería: subir/editar/favorito/filtro/línea de tiempo/carrusel/reduced-motion/eliminar/logout.
  Cartas: crear, leer texto seguro, personalizar y recargar. Audio: reproducción por acción explícita,
  continuidad entre secciones y pausa. Video WebM: subida, apertura pausada y reproducción.
- Layout: sin desbordamiento a 360/390 px; botones visibles >=44 × 44 px: PASS.
- Revisión visual de capturas mobile de galería, escritos y reproductor: PASS.
- Inicio local con npm run dev y autenticación real a través del proxy Vite: PASS.
  Proxy configurado con changeOrigin=false para conservar la verificación de origen.
- GitHub Actions Linux: [ejecución completa exitosa](https://github.com/GaryPoui/Fotos/actions/runs/37721915026).
  Compilación Docker y smoke de producción: escribir una carta, eliminar forzadamente el contenedor,
  crear otro con el mismo volumen, recuperar el bloqueo y leer la carta: PASS.
- Dependencias: npm audit sin vulnerabilidades al cerrar la entrega.

## Convergencia Spec Kit

Revisión de los seis spec.md, plan.md y tasks.md: 24 requisitos funcionales, 24 criterios de éxito,
18 escenarios de aceptación y cinco principios de constitución. Sin brechas de implementación pendientes.
La primera revisión detectó el bloqueo con PID reutilizado en Docker; se agregó T007 al spec 006,
se implementó el bloqueo compartido con heartbeat y se verificó el reemplazo real del contenedor.
Todas las tareas de specs 001–006 quedan completas. La alternativa vigente de publicación es spec 007 (Render + Supabase); spec 008 conserva la alternativa Firebase.

## Pendiente externo

- Docker CLI local sin daemon; imagen construida correctamente en GitHub Actions sobre Linux.
- Sin Safari/iOS real. Chromium emula viewport/touch, no el motor Safari.

Tests con contenido sintético y directorios temporales, sin tocar recuerdos personales.
Evidencia local en test-results/ (ignorada por Git).

## Render + Supabase (2026-10-08)
- Arquitectura activa: spec 007, Express en Render y esquema privado rincon + bucket rincon-render en Supabase Free. Firebase se conserva como alternativa.
- Build y tipos: PASS. Integración: 32 PASS, 5 reglas Firebase omitidas sin emulador. Navegador móvil/escritorio: 20 PASS tras integrar mejoras de recuerdos.
- Supabase real: conexión PostgreSQL cifrada con CA verificada y rol dedicado, puente de Storage con token limitado, subida/miniatura/Range, carta y sesión conservadas al recrear servidor: PASS. Datos sintéticos eliminados al terminar.
- GitHub Actions de integración previa: ejecución 37869802452 completada correctamente.
- Publicación y prueba pública completadas; detalle a continuación.

- Publicación verificada: https://ailu-y-tomy.onrender.com (Render Docker Free, servicio srv-db449pflk1mc73epajrg; Supabase Nuestro rincon, plan Free).
- HTTPS público: salud, ingreso con contraseña configurada, cookie Secure/HttpOnly, API anónima 401, subida de foto, miniatura y Range 206: PASS.
- Reinicio real de Render registrado en Events el 2026-10-08 22:37 ART: misma sesión, foto y carta recuperadas: PASS. Contenido sintético eliminado al terminar.
- Chromium móvil 390×844 sobre producción: ingreso, carga de biblioteca y sin desbordamiento horizontal: PASS. Capturas en test-results/render-mobile-login.png y render-mobile-live.png (ignoradas por Git).
- No se agregó tarjeta, disco ni plan de pago. Publicación del código 625defe; cambios posteriores de documentación no requieren recompilación.

## Carrusel con profundidad (2026-10-08)
- Spec 003 FR-005/006: tarjetas inclinadas con perspectiva, centro destacado y transición circular de 550 ms; miniaturas privadas, sin nuevas dependencias.
- Build y tipos PASS. Galería existente móvil/escritorio: 2 PASS. Recorridos nuevos de carrusel y video móvil/escritorio: 4 PASS.
- Verificados selección lateral, teclado, gesto horizontal/scroll vertical, vuelta circular, bibliotecas de uno/dos/cinco elementos, ampliación, pausa del video saliente y movimiento reducido. Sin desbordamiento a 360 px y controles >=44 px.
- Capturas sintéticas revisadas en test-results/mobile-coverflow.png y desktop-coverflow.png. Publicación pendiente.
- Publicado en https://ailu-y-tomy.onrender.com con commit 982214a, despliegue dep-db44u07lk1mc73erftf0 Live (2026-10-08 23:19 ART).
- Navegador sobre bundle público: ingreso real, animación 550 ms, navegación y layout móvil/escritorio PASS. Biblioteca y archivos demo interceptados sólo dentro del navegador de prueba; sin cambiar datos personales. Capturas render-mobile-coverflow.png y render-desktop-coverflow.png.
