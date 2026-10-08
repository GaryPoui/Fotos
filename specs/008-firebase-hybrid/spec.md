# Spec 008: Firebase parcial con almacenamiento gratuito

Fecha: 2026-10-08. Pedido: usar fotosconailu sin Blaze y un proveedor adicional gratuito.
Esta alternativa sustituye el despliegue Render/PostgreSQL de spec 007; no borra la modalidad local.

## Escenarios
1. La pareja entra con la contraseña compartida; sólo su cuenta autorizada puede leer o modificar recuerdos.
2. Fotos, miniaturas, videos, música, cartas y ajustes sobreviven a recargas y despliegues.
3. Una persona sin sesión o con otra cuenta no accede a datos ni objetos.
4. Dos subidas simultáneas no exceden el cupo reservado del almacenamiento.
5. Si falta el proveedor, la web explica qué falta; nunca afirma que guardó un archivo.

## Requisitos
- FR-001: Hosting/Auth/Firestore en Firebase Spark; Supabase Free para archivos; sin servidor persistente, Functions, Firebase Storage ni facturación.
- FR-002: Mantener diseño, navegación, formularios y modalidad Node/SQLite local.
- FR-003: Una cuenta Firebase compartida, aprovisionada administrativamente, con claims rincon=true y role=authenticated. No hay registro público ni emails/contraseñas del usuario en Git.
- FR-004: Firestore sólo admite esa membresía y valida campos en creates/updates. Supabase valida emisor, audiencia y membresía del mismo JWT.
- FR-005: Bucket privado; 50.000.000 bytes por archivo y 900.000.000 reservados entre originales y miniaturas; cuotas serializadas en PostgreSQL. Ninguna clave service_role en cliente.
- FR-006: Archivos mediante service worker que solicita token vigente a la página y transmite Range al objeto autenticado; sin URLs firmadas persistentes ni caché de contenido privado.
- FR-007: Fallos conservan formulario, eliminan objetos parciales cuando es posible y conservan reserva si falla la limpieza. No migrar recuerdos locales automáticamente.
- FR-008: Validar reglas con emulador, cuotas/privacidad en PostgreSQL, regresión local y navegador antes de publicación. No afirmar funcionalidad completa antes de verificar Supabase real.

## Cambios respecto de modalidad local
La sesión cloud usa Firebase Auth persistente y sus tokens renovables, no cookies HttpOnly ni expiración fija de siete días. Cambiar contraseña no revoca automáticamente tokens ya emitidos: revocación administrativa y expiración de tokens quedan documentadas. Inspección de firma y miniaturas ocurren en navegador; Storage aplica límites/tipos declarados y autorización. La pareja autorizada es el límite de confianza; no se ofrece carga pública.

## Criterios de éxito
SC-001: URL HTTPS verificada y Spark/Free sin habilitar billing.
SC-002: Ninguna lectura privada sin membresía en pruebas.
SC-003: Subidas concurrentes respetan cuota y fallos no se presentan como éxito.
SC-004: Datos y archivos recuperables después de cerrar sesión y desplegar nuevamente.
