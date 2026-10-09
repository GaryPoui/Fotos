# Nuestro rincón Constitution

## Core Principles

### I. Privacidad por defecto
La aplicación MUST exigir sesión para leer o modificar recuerdos, archivos, música y escritos.
Contraseñas, cookies, contenido personal y datos de ejecución MUST permanecer fuera de Git.
No habrá registro público. La primera versión permite una contraseña compartida por la pareja.

### II. Persistencia real
El contenido MUST guardarse en una base de datos y almacenamiento persistente, sea un volumen
del servidor o un proveedor remoto privado. El disco efímero sólo puede usarse como staging.
El navegador guarda preferencias y copias temporales explícitas de subidas pendientes;
éstas se eliminan al completar, descartar o cerrar sesión. Nunca será el único almacenamiento
de recuerdos que se presenten como guardados.
Las subidas fallidas MUST limpiarse y los errores MUST explicarse sin perder el formulario.

### III. Desarrollo desde especificaciones
Cada función MUST tener spec.md, plan.md y tasks.md antes de implementarse.
Los requisitos y tareas MUST tener identificadores; la verificación se registra al terminar.
Se usará Spec Kit oficial con sus scripts y skills instalados.

### IV. Verificación proporcional
Autenticación, privacidad, archivos y persistencia MUST tener pruebas de integración.
Los recorridos principales MUST verificarse en navegador y la compilación MUST pasar.
Los cambios visuales de bajo impacto no requieren pruebas que dupliquen su implementación.

### V. Sencillez y accesibilidad
La experiencia MUST diseñarse mobile first desde 360 px, en español, con teclado y movimiento reducido.
Celeste y rosado MUST ser los colores principales, con texto oscuro de contraste legible.
Los controles táctiles MUST tener al menos 44 px y la navegación principal debe ser cómoda con una mano.
La música MUST intentar comenzar al entrar con una canción aleatoria al 15%, respetando las políticas del navegador y ofreciendo activación explícita si se bloquea, además de pausa y volumen accesibles. El contenido ficticio MUST identificarse como demo.
No se incorporarán servicios de pago ni dependencias de cuentas sin necesidad.

## Restricciones del producto
Una sola pareja y una instancia del servidor. Fotos JPEG/PNG/WebP/GIF/AVIF, videos MP4/WebM
y audio MP3/WAV/OGG/M4A según compatibilidad del navegador. Se permite conversión HEIC/HEIF a JPEG en el dispositivo para las fotos de iPhone;
el original permanece con el usuario y se conserva el JPEG. Sin transcodificación de video.
Node.js, TypeScript, React y SQLite permiten desplegar el mismo repositorio en un servidor
con disco persistente. Para hosting gratuito se admite Firestore o PostgreSQL y almacenamiento de objetos
remotos privados; esta ampliación responde al pedido de presupuesto cero del 2026-10-08.
Un hosting estático por sí solo no satisface la persistencia requerida.

## Flujo de desarrollo
Constitución → especificación → plan → tareas → implementación → verificación/convergencia.
Se harán commits y push a origin después de avances coherentes autorizados por el usuario.
No se esperará a agotar la cuota. Las tareas pendientes y limitaciones quedarán documentadas.

## Governance
Las modificaciones deben justificar su motivo y actualizar su versión: major para reglas
incompatibles, minor para principios nuevos y patch para aclaraciones.
Cada cierre de spec debe revisar privacidad, persistencia y verificación.

**Version**: 1.4.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-08
