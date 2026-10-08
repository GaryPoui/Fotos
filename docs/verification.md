# Verificación

Fecha: 2026-10-08 (America/Buenos_Aires).

## Comprobado

- TypeScript cliente/servidor: PASS.
- Compilación Vite y servidor: PASS.
- Vitest: 11 pruebas PASS. Privacidad, acceso, origen, rate limit, firmas, límites, limpieza,
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

## Pendiente externo

- Docker CLI local sin daemon; imagen construida correctamente en GitHub Actions sobre Linux.
- Sin proveedor/credenciales de hosting: no hay despliegue online verificado.
- Sin Safari/iOS real. Chromium emula viewport/touch, no el motor Safari.

Tests con contenido sintético y directorios temporales, sin tocar recuerdos personales.
Evidencia local en test-results/ (ignorada por Git).
