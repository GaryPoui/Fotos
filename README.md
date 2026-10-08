# Nuestro rincón ☁️♡

Espacio privado para una pareja: fotos, videos, música, frases y cartas.
Diseño **mobile first**, celeste y rosado, navegación inferior y controles táctiles.

## Funciones

- Fotos/videos con miniaturas, progreso por archivo y reintento sin duplicar los exitosos.
- Fechas, álbumes, etiquetas, búsqueda, favoritos y orden cronológico.
- Mosaico, línea de tiempo, carrusel y presentación con pausa; visor con teclado y gestos.
- Canciones con reproductor persistente entre secciones, volumen y posición.
- Frases/cartas con edición, búsqueda, favoritos y lectura con saltos de línea.
- Nombres, título y fecha de la relación personalizables.
- Contraseña compartida y archivos privados; sesión local de siete días y sesión cloud mediante Firebase Auth.
- SQLite y archivos en disco, Docker, respaldo/restauración y CI.

## Inicio local

Node.js >=22.13 y npm; se recomienda el último parche de Node 22.

```powershell
npm ci
Copy-Item .env.example .env
```

Editar `.env`: definir `APP_PASSWORD` propia con al menos 12 caracteres. No subir este archivo.

```powershell
npm run dev
```

Abrir la URL de Vite (normalmente http://127.0.0.1:5173). API en puerto 3001.
Los recuerdos se guardan en `data/`, fuera de Git. No hay recuerdos ni contraseña de ejemplo en producción.

## Verificar

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

API con archivos temporales y Chromium móvil/escritorio; nunca se usa `data/` personal.
Ver [evidencia y límites](docs/verification.md).

## Publicar online

La opción cloud gratuita usa **Firebase Hosting/Auth/Firestore + Supabase Free** para
archivos privados: ver [configuración gratuita](docs/free-hosting.md) y [spec 008](specs/008-firebase-hybrid/spec.md).
La modalidad local/Node sigue disponible en [hosting y respaldos](docs/hosting.md), con HTTPS y disco
persistente. No se publican automáticamente recuerdos locales ni se habilita facturación.
Web publicada: **https://fotosconailu.web.app**.
El estado verificado de publicación está en [docs/verification.md](docs/verification.md).

```powershell
npm run build
npm start
```

En producción: `NODE_ENV=production`, `APP_ORIGIN=https://tu-dominio`, `APP_PASSWORD`, `DATA_DIR`.
Render requiere disco persistente de pago; también funciona en VPS con Docker.

## Spec Kit

Inicializado con **Spec Kit 1.1.2 oficial**, integración Codex y scripts PowerShell.
Skills en `.agents/skills/`; constitución en `.specify/memory/constitution.md`.
Se ejecutaron resolvers y scripts de planificación, tareas y prerrequisitos. Las skills son instrucciones
del agente, no comandos ficticios de terminal.

| Spec | Alcance |
| --- | --- |
| [001](specs/001-private-foundation/spec.md) | Privacidad y base mobile first |
| [002](specs/002-media-library/spec.md) | Fotos, videos y organización |
| [003](specs/003-memory-views/spec.md) | Galerías, carrusel y visor |
| [004](specs/004-soundtrack/spec.md) | Música y reproductor |
| [005](specs/005-love-notes/spec.md) | Frases y cartas |
| [006](specs/006-online-readiness/spec.md) | Hosting, respaldo y verificación |
| [008](specs/008-firebase-hybrid/spec.md) | Firebase Spark y archivos privados en Supabase Free |

Los specs 001–006 incluyen plan, investigación, modelo, contratos, guía y tareas.
Spec 008 documenta la alternativa cloud implementada con spec, plan y tareas.
Flujo: `$speckit-specify` → `$speckit-plan` → `$speckit-tasks` → `$speckit-implement` → `$speckit-converge`.

Los seis specs están implementados y verificados: 12 pruebas de servidor/respaldo/producción,
8 recorridos de navegador y prueba de Docker conservando datos al reemplazar el contenedor.
Para retomar un spec existente desde PowerShell, definir su carpeta antes de los scripts de Spec Kit:
`$env:SPECIFY_FEATURE_DIRECTORY = 'specs/002-media-library'`.

## Límites conocidos

Una pareja/instancia; contraseña compartida sin recuperación por email. Sin transcodificación:
HEIC/HEVC deben exportarse como JPEG o MP4 compatible. Audio/video depende del navegador.
En local: 200 MiB por archivo y 1 GiB de originales por defecto, configurables; reservar
espacio extra para miniaturas/temporales. En cloud: 50 MB por archivo y 900 MB reservados
entre originales y miniaturas, dentro del plan Free. Música sólo por acción explícita. node:sqlite es experimental en Node 22.
Chromium emulando celular no equivale a verificar Safari/iOS real.
