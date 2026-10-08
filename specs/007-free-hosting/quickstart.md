# Validation guide
1. npm ci; npm test; npm run build; npm run test:e2e.
2. Seguir docs/free-hosting.md para Supabase Free y Render Free; configurar secretos sólo en proveedor.
3. Abrir HTTPS, entrar y subir foto/canción/video compatibles y carta sintética.
4. Reiniciar/reemplazar servicio; verificar contenido y sesión, probar reproducción por rangos.
5. Sin sesión verificar 401 en /api/library y /api/files/:id.
6. Confirmar plan Free y ausencia de disco, tarjeta, dominio o recursos pagos. No afirmar publicación hasta verificar URL real.
