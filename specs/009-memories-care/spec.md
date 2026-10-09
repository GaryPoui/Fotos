# Spec 009: Cuidar y revivir nuestros recuerdos

Pedido autorizado: mejoras 1–5, publicadas en bloques; acceso y acertijos intactos.

- FR-001: Descargar respaldo ZIP desde sesión privada: metadatos, cartas, ajustes, originales y miniaturas, manifiesto con hashes SHA-256. Dividir en partes manejables; errores no se presentan como respaldo completo.
- FR-002: Subidas con progreso, pausa/reintento, cola recuperable tras recarga y cortes de red sin duplicar éxitos. Cloud reanuda bytes con TUS, reserva estable y sin sobrescritura. Cola local temporal y explícita, eliminada al completar/descartar/cerrar sesión; navegador nunca sustituye almacenamiento remoto.
- FR-003: Seleccionar HEIC/HEIF y convertir en el dispositivo a JPEG compatible, sin servicios externos ni habilitar unsafe-eval (worker local de conversión permitido). Informar conversión y límite; original HEIC permanece en dispositivo del usuario, respaldo contiene JPEG guardado. Primera imagen de secuencias.
- FR-004: Portada privada con foto elegida, días juntos calculados por fecha de calendario y recuerdo destacado configurable. Mantener contraste, móvil, teclado y diseño celeste/rosado. Ajustes persistentes; borrar foto referenciada deja una portada alternativa segura.
- FR-005: Un día como hoy por mes/día de años anteriores y álbumes de viajes, salidas/aniversarios. Filtros navegables, sin inventar aniversarios ni recuerdos ficticios.
- FR-006: Modalidad local y cloud funcionando; conservar cuotas, autenticación/pistas y planes gratuitos. No cambiar contraseña ni acceso.

Aceptación: exportar/examinar ZIP con contenido sintético; interrumpir y retomar una subida; recargar cola; HEIC real convertido y visible; portada/contador persistentes; coincidencia de fecha y álbumes; sin acceso privado tras logout, regresión móvil/escritorio y publicación HTTPS.
