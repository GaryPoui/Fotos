# Opciones de espacio — 2026-10-13

Análisis de sólo lectura, sin modificar archivos o cuentas. Uso agregado del snapshot: 204 fotos, 208008982 bytes (198.4 MiB redondeados); 5 canciones, 23443574 bytes (22.4 MiB); ningún video personal registrado. El indicador incluye miniaturas: 245222910 bytes usados de los 900000000 asignados al sitio, 654777090 disponibles (624.4 MB en la UI). Los snapshots privados se conservan fuera de Git.

## Optimización
Las cartas y los títulos ocupan poco comparados con los archivos. JPEG/WebP, MP4/WebM y MP3/AAC ya usan compresión; ZIP no suele resolver el crecimiento de una biblioteca multimedia. Se puede ofrecer un modo opcional para fotos nuevas: dimensiones adecuadas a la web y JPEG/WebP con calidad elegida. El ahorro varía y debe medirse con ejemplos antes de reemplazar originales. La compresión con pérdida o reducir dimensiones descarta información; la compresión sin pérdida evita eso pero no promete un ahorro grande.

Conservar original y copia comprimida en el mismo bucket aumenta el uso, aunque la navegación pueda ser más rápida. Para ahorrar cuota se necesita guardar allí sólo la versión optimizada y conservar el original en un respaldo externo fiable, o ampliar el almacenamiento. Videos grandes suelen beneficiarse de una exportación de menor resolución/bitrate antes de subir; no se ha añadido transcodificación ni cambiado la conservación sin pérdida de videos actual. Música ya comprimida ofrece menos margen. Nada existente se ha recodificado o sustituido.

## Almacenamiento alternativo
Supabase Free incluye 1GB de Storage; el sitio asigna 900MB decimales como margen. Las transformaciones integradas de imágenes no están incluidas en Free. Fuentes primarias: https://supabase.com/docs/guides/storage/pricing y https://supabase.com/docs/guides/platform/billing-on-supabase .

Cloudflare R2 Standard incluye 10GB-month de almacenamiento gratis al mes, 1M operaciones clase A y 10M clase B; salida sin cargo. Requiere una cuenta con suscripción R2 y checkout; el excedente de almacenamiento/operaciones es facturable. No es almacenamiento ilimitado ni garantía de costo cero. Fuentes: https://developers.cloudflare.com/r2/pricing/ y https://developers.cloudflare.com/r2/get-started/ .

Recomendación si se prioriza calidad y margen de crecimiento: conservar PostgreSQL/Supabase para cartas, títulos y registros; evaluar R2 privado para archivos con límite de uso y avisos. Una migración futura debe copiar y verificar tamaños/SHA antes de cambiar rutas, permitir retorno y retirar fuentes sólo mediante autorización concreta. Esta consulta no activa suscripciones, credenciales, migración ni borrados. Si la prioridad es evitar toda facturación, primero ofrecer optimización opcional de nuevas fotos y mantener copias externas de originales, sin prometer que esa cuota alcanzará indefinidamente.
