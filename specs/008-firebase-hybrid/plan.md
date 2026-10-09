# Plan 008
Firebase web SDK modular y Supabase JS con third-party Firebase Auth. Cliente cloud opcional mediante configuración pública separada, sin secretos de administración. La fachada src/lib.ts conserva contratos de UI y carga dinámicamente el adaptador cloud. Un service worker transmite archivos privados con tokens vigentes, Range y no-store. Firebase Hosting sirve React estático.

Firestore Standard (default), southamerica-west1, proyecto autorizado fotosconailu: colecciones rincon_media, rincon_notes y rincon_settings/main. Claims administrativos restringen todas las operaciones. Reglas validan los modelos compartidos.

Supabase: bucket rincon privado; tabla de reservas bajo RLS; RPC reserve/release con bloqueo de cuota; políticas verifican claims y tamaño reservado. Reservas fallidas no se liberan si quedan objetos. Persistencia distribuida: primero reservar y subir, luego registrar en Firestore; compensación al fallar.

Validación: Vitest/PGlite para políticas y RPC, emulador Firestore para reglas, Playwright local, reglas con emulador y smoke real cloud sin contenido personal. Cuenta Supabase y configuración de integración requieren acceso del usuario.
