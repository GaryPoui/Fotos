# Render Free + Supabase Free

La web/API corre en Render Free. PostgreSQL y originales/miniaturas viven en Supabase Free.
El disco de Render sólo recibe archivos temporales: reinicios y despliegues no borran recuerdos.
No se compra dominio, disco ni plan de pago. El subdominio onrender.com incluye HTTPS.

## Configuración
1. Crear o reutilizar un proyecto Supabase Free. Ejecutar supabase/schema.sql mediante conexión administrativa.
2. Usar un bucket **privado** llamado rincon, máximo por archivo 50.000.000 bytes. No agregar políticas anónimas a Storage.
3. Configurar DATABASE_URL con Session pooler (IPv4, 5432). Recomendado: rol servidor dedicado con permisos CRUD
   sólo sobre rincon y políticas RLS exclusivas para ese rol; no otorgar permisos a anon/authenticated.
   Alternativamente se admite conexión administrativa, que debe mantenerse sólo en backend.
4. Usar TLS con verificación. DATABASE_CA acepta el certificado PEM de Supabase o una ruta al archivo.
   Descargar CA desde Connect/Database settings; no configurar rejectUnauthorized=false.
5. Configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (service_role o secret server key), sólo backend.
   Nunca prefijo VITE_, repositorio, mensajes públicos ni frontend. SUPABASE_BUCKET=rincon.
6. Crear Web Service Docker en Render desde este repo, rama main, **Free**, una instancia, sin disco.
   render.yaml declara esta configuración; las variables sync:false se completan como secretos.
7. Configurar APP_PASSWORD y TRUST_PROXY=1. APP_ORIGIN se obtiene de RENDER_EXTERNAL_URL automáticamente;
   para dominio propio establecer APP_ORIGIN a su URL HTTPS exacta. No inicializar la DB desde un predeploy efímero.
8. Health check /api/health. Tras publicar: entrar, guardar un recuerdo y carta sintéticos, reiniciar servicio y
   confirmar contenido/sesión; sin sesión /api/library y /api/files/:id deben responder 401.

## Límites y disponibilidad
- Supabase Free: 1 GB archivos, 500 MB DB, 5 GB egress y 5 GB cached egress. Pausa tras una semana de inactividad.
  La aplicación limita originales + miniaturas a 900.000.000 bytes y cada archivo a 50.000.000 bytes.
- Render Free: duerme tras 15 minutos sin tráfico; despertar puede tardar aproximadamente un minuto.
  750 horas/mes compartidas por workspace, con cuotas de ancho de banda y compilación.
- No se agrega tarjeta ni se activa ampliación automática. Al agotar cuotas se debe esperar, borrar contenido
  propio o decidir conscientemente otro plan; esta aplicación no contrata ampliaciones.
- Una instancia. Las subidas se serializan para respetar cuota; no activar escalado o múltiples servidores.
- Una interrupción exactamente al confirmar una subida puede dejar objetos huérfanos. Revisar Storage ante
  errores de limpieza; los cupos de proveedor siguen siendo el límite real. La cuota de app no cuenta objetos
  externos que se agreguen manualmente al bucket.

## Respaldo remoto
`npm run backup` protege sólo SQLite local y no es un respaldo de Supabase.
Para remoto, detener escrituras, exportar el esquema rincon con pg_dump por conexión TLS y descargar
el bucket privado completo con una herramienta autenticada compatible con Storage. Guardar ambos juntos
en ubicación privada fuera del hosting; no copiar sesiones al restaurar. Supabase Free no incluye backups
automáticos. Validar restauración en un proyecto separado antes de reemplazar contenido.
Nunca guardar secretos o respaldos en Git. Los datos locales no se migran automáticamente a la nube.

Fuentes verificadas el 2026-10-08: [Render Free](https://render.com/docs/free),
[Supabase Free](https://supabase.com/pricing), [límites de archivos](https://supabase.com/docs/guides/storage/uploads/file-limits),
[conexión PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres).
