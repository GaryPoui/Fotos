# Contracts
Privadas salvo health, session y login. Mutaciones requieren X-Requested-With: NuestroRincon y Origin coincidente si existe.
Errores { error: string }; 400 inválido, 401 sesión, 404 ausente, 413 tamaño, 429 rate.
POST /api/login { password }; POST /api/logout; GET /api/session { authenticated }; GET /api/health { status }.
GET/PATCH /api/settings { names, since, title }.
GET/POST /api/media; PATCH/DELETE /api/media/:id; GET /api/files/:id privado con Range.
GET/POST /api/notes; PATCH/DELETE /api/notes/:id.
Upload multipart file + title/date/album/tags/artist; 1 archivo, máximo configurable 200 MiB.
JPEG/PNG/GIF/WebP/AVIF, MP4/WebM, MP3/WAV/OGG/M4A. Nunca SVG/HTML.
