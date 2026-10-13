# Verification: videos grandes y espacio

## Antes de publicar

- Snapshot privado de las filas y el esquema actual, sin credenciales en Git: 209 archivos, 3 escritos y 1 lugar. Comparación posterior a las pruebas reales: todas las filas históricas y columnas intactas.
- Espacio asignado al sitio: 900000000 bytes. Usado incluyendo miniaturas: 245222910 bytes. Disponible: 654777090 bytes (624.4 MiB, presentado como MB igual que el resto del sitio).
- `npm test`: 48 pruebas aprobadas; 5 pruebas de reglas requieren emulador Firebase y permanecen omitidas. El sitio activo usa PostgreSQL/Storage de Supabase.
- `npm run build`: aprobado. Advertencia existente de tamaño de los chunks opcionales de HEIC/Firebase.
- Playwright: 40 pruebas aprobadas en móvil y escritorio, incluyendo espacio, límites por tipo, fotos, videos, música, cartas, álbumes, carrusel, mapas y copia descargable. Contención y controles táctiles de 44 px verificados.
- Supabase privado real: video MP4 sintético válido de 55000001 bytes, 6 partes de hasta 10000000 bytes; SHA-256 de descarga idéntico, rangos cruzando partes y reproducción Chromium aprobados. Se retiraron exclusivamente las partes generadas para esa prueba.
- Backend: reinicio, idempotencia, limpieza parcial, reservas al fallar limpieza, protección de subidas recientes de otra instancia, recuperación de reservas antiguas, rechazo por cuota y rechazo de audio grande disfrazado de video cubiertos. HEAD/416 y rechazo de proveedor que ignora Range o pierde una parte cubiertos.

## Publicación

Primero publicar el lector compatible conservando el límite remoto anterior. Guardar ese commit/tag como mínimo seguro de rollback para archivos nuevos. Luego habilitar 209715200 bytes por video, manteniendo 50000000 bytes para fotos/canciones y sin cambiar infraestructura, permisos o presupuesto.

No volver a una versión anterior al lector de `parts-v1` después de guardar videos grandes: el original sigue intacto, pero esa versión anterior no sabría reproducirlo. No se reescriben ni migran archivos históricos. Una carga interrumpida conserva el borrador e identificador para reintentar; no se promete reanudación del transporte desde el byte exacto.

El indicador contabiliza archivos registrados, miniaturas y reservas conocidas dentro de la asignación del sitio; no es una medición de todos los buckets o proyectos de la cuenta del proveedor.

Lector compatible: commit `b6fc93a`, tag remoto `video-reader-baseline-2026-10-13`. GitHub Actions `38484742666`: success, incluidas pruebas, build, navegador y recreación del contenedor con volumen persistente. Render `dep-db7c0pm7bikc73aacut0`: Live el 2026-10-13 a las 20:36 ART. API pública privada verificada con límites anteriores y nuevo espacio disponible; históricos/schema intactos después de publicar.

Activación: commit `b82c221`. GitHub Actions `38485436601`: success, incluidas pruebas, build, navegador y persistencia del contenedor. Render `dep-db7c42favr4c73fled60`: Live el 2026-10-13 a las 20:43 ART. API pública: `maxVideoFile=209715200`, `maxFile=50000000`, `available=654777090`, `reserved=0`.

Prueba real a través de Render: POST del MP4 sintético de 55000001 bytes aprobado; descarga SHA idéntica, rangos entre partes y reproducción Chromium aprobados; aumento de uso exactamente igual al tamaño original. Se retiró únicamente ese nuevo UUID, verificando título/tipo/tamaño antes de borrarlo. Library volvió a coincidir exactamente con el estado anterior, incluyendo archivos, escritos, álbumes, lugares y ajustes. Ninguna reserva pendiente ni video de prueba quedó registrado.

Comparación SQL final: todas las filas históricas y el esquema siguen intactos (209 archivos, 3 escritos y 1 lugar). Espacio final: 245222910 bytes usados de 900000000; 654777090 disponibles (624.4 MB en la interfaz).

Interfaz pública verificada en 360, 390 y 1440 px, sin desbordes, con límites por tipo y espacio disponible visibles. Para las capturas se mostró una biblioteca vacía sintética, manteniendo las cifras y la interfaz reales del sitio, evitando exponer imágenes/cartas personales. Evidencia local privada: `test-results/render-storage-{360,390,1440}.png`, `test-results/render-video-upload-{360,390,1440}.png`; copia de la captura móvil junto al snapshot privado. Resultados técnicos y snapshots no se subieron al repo.

Protección adicional comprobada: si PostgreSQL confirma el INSERT pero se pierde su respuesta, la limpieza consulta esa confirmación y conserva el original. El reintento con el mismo identificador devuelve el registro ya guardado; el reinicio limpia sólo su reserva. No existe migración ni reescritura de datos anteriores.
