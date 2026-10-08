# Firebase parcial + Supabase Free

La alternativa vigente es [spec 008](../specs/008-firebase-hybrid/spec.md).
El proyecto Firebase autorizado es `fotosconailu`, plan Spark, Firestore Standard `(default)`
en `southamerica-west1`. Firebase Hosting sirve React; Firebase Auth permite entrar con una
cuenta compartida privada; Firestore guarda cartas, ajustes y metadatos. Supabase Free guarda
originales y miniaturas en el bucket privado `rincon`. No usa Firebase Storage, Functions,
App Hosting, Render, disco efímero ni tarjeta/facturación.

## Configuración de Supabase

1. Crear cuenta y organización **Free** en https://supabase.com/dashboard. Crear un proyecto
   dedicado a Nuestro rincón; elegir una región cercana (por ejemplo São Paulo).
2. En Authentication → Third-party Auth, agregar Firebase con Project ID `fotosconailu`.
   La cuenta compartida ya tiene claims administrativos `rincon: true` y `role: authenticated`.
   No se necesitan Cloud Functions para asignarlos.
   En esta publicación la integración Firebase se aprovisionó mediante Management API con
   el JWKS oficial `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`.
   Las políticas comprueban explícitamente emisor y audiencia de fotosconailu, además de membresía;
   las claves de firma de Firebase se comparten entre proyectos. `config push` de CLI no creó
   esta integración por sí solo; verificar siempre la lista de integraciones y una RPC con JWT real.
3. Ejecutar [supabase/storage.sql](../supabase/storage.sql) en SQL Editor de ese proyecto.
   Crea bucket privado, cuotas, reservas y políticas. No ejecutarlo contra un proyecto ajeno
   o con políticas públicas existentes.
4. Obtener Project URL y **publishable key** (o anon legacy). Son configuración pública.
   Nunca usar `service_role`/`sb_secret_*` en Vite, Git ni navegador.
5. Crear `.env.cloud`, ignorado por Git:

```dotenv
VITE_CLOUD=firebase
VITE_SUPABASE_URL=https://REFERENCIA.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICA
```

Si se autoriza la CLI, `npx --yes supabase login --name fotos-codex` permite completar los
pasos con la cuenta del usuario. No compartir tokens de administración por chat.

## Construcción y publicación

```bash
npm run build:cloud
npx -y firebase-tools@latest deploy --only hosting --project fotosconailu
```

Hosting publica `dist-cloud`, separado de `dist` usado por Node/SQLite y pruebas locales.
El build rechaza claves privadas y configuración incompleta. Sólo para publicar cartas/ajustes
mientras se termina Storage: `npm run build:cloud -- --allow-pending-storage` muestra un aviso
visible de álbum pendiente. Esa publicación parcial no demuestra subidas funcionando.
La publicación activa es https://fotosconailu.web.app (verificada el 2026-10-08).
Supabase: proyecto `mzujwjvsallqhxndodjf`, región `sa-east-1`, organización Free.

## Cuenta compartida

`node scripts/provision-cloud-user.mjs` crea **sólo si no existe** la cuenta de acceso en
Firebase Auth, usando APP_PASSWORD de `.env`; importa un hash PBKDF2 y claims administrativos.
No imprime ni guarda la contraseña en Git. El correo técnico de acceso es un identificador
compartido, no un correo de recuperación. No existe registro público en la interfaz.

Para cambiar contraseña o revocar acceso, usar Firebase Console → Authentication.
En cloud se usan tokens de Firebase y persistencia del SDK, no cookies del servidor local.
Un token ya emitido puede seguir siendo válido hasta expirar (aproximadamente una hora),
incluso tras revocación administrativa. Cerrar sesión deja de entregar tokens a nuevas lecturas
locales; no puede retirar bytes ya descargados ni invalidar tokens copiados por otra persona.

## Privacidad, cuotas y fallos

- El bucket es privado; JWT debe pertenecer a fotosconailu y tener los dos claims.
- Un service worker solicita un token vigente a la página para cada archivo y transmite Range
  a Supabase. Reconstruye Content-Range desde tamaño inmutable si CORS oculta ese header,
  verificando la longitud recibida para que audio/video puedan reproducirse. No usa URLs firmadas reutilizables ni caché de fotos, música o videos.
- Máximo 50.000.000 bytes por original; reserva total 900.000.000 incluyendo miniaturas.
  Las RPC serializan las reservas con bloqueo PostgreSQL. Storage verifica tamaño real <= reserva
  y MIME declarado mediante un trigger, incluso en la inserción interna de Storage.
  La comprobación preliminar de Storage no contiene tamaño; la inserción final sí se valida.
  No permite sobrescribir un objeto.
- Las firmas se comprueban en el navegador y las imágenes se decodifican allí. Esto no es
  validación de firma del lado del servidor ni antivirus; la carga se limita a la pareja autorizada.
- Primero reserva/sube, luego escribe metadatos. Si falla la subida se intenta compensar;
  si falla la limpieza se conserva el cupo para evitar excederlo.
- Si falla la respuesta al guardar metadatos, se conserva archivo/reserva: podría haberse guardado.
  El reintento dentro del mismo formulario usa el mismo ID y consulta Firestore antes de limpiar.
- No hay transacción atómica entre proveedores. Si se cierra el navegador a mitad de subida,
  revisar reservas huérfanas antes de liberar espacio. Nunca borrar una reserva con objetos existentes.
- Sin migración automática de SQLite ni recuerdos locales.

## Límites y respaldo

Consultar [Firebase pricing](https://firebase.google.com/pricing) y
[Supabase pricing](https://supabase.com/pricing) antes de cambiar planes. Free puede pausar el
proyecto por inactividad y tiene cuotas de tráfico/almacenamiento. No habilitar upgrades ni billing.
Una tarjeta o facturación habilitada cambia el alcance del presupuesto cero.

El comando `npm run backup` sigue siendo exclusivamente para SQLite local.
Para cloud, antes de operar con recuerdos reales, conservar copias propias de los originales.
Para un respaldo completo: detener temporalmente el uso de la pareja, exportar las tres colecciones
Firestore mediante cliente autorizado y descargar los objetos privados y reservas de Supabase con
herramientas administrativas del usuario. Guardar todo cifrado o en disco privado; comprobar conteo,
tamaños y hashes antes de considerarlo completo. No se implementó restauración cloud automática.
Los planes gratuitos no sustituyen un respaldo propio ni garantizan disponibilidad continua.
