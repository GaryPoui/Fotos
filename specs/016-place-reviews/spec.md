# 016 — Fotos y estrellas de nuestros lugares
Fecha: 2026-10-14. Estado: implementado, verificado y publicado.

## Historias y aceptación
US1: Al agregar o editar un lugar, Ailu y Tomy pueden elegir de una a cinco estrellas, cambiar o quitar la puntuación. Después de recargar se conserva y aparece en su ficha y lista.
US2: Pueden subir una foto y verla en la ficha y lista del lugar. Cambiarla o quitarla del mapa conserva la foto anterior en Recuerdos. Una falla conserva el formulario y permite reintentar sin duplicar la subida.
US3: Pueden elegir y filtrar Cultura y Eventos, con un icono distinto para cada categoría en el mapa.

## Requisitos
- FR01: Puntuación opcional de 1–5 estrellas enteras; los lugares actuales permanecen sin puntuación.
- FR02: Una foto opcional por lugar, privada y persistente; compatible con los formatos actuales y la conversión HEIC existente.
- FR03: Las fotos nuevas se guardan también en el álbum Lugares y cuentan en el espacio disponible. No se borran al reemplazar la foto o quitar el lugar.
- FR04: Cultura agrupa museos, bibliotecas y similares; Eventos agrupa conciertos, encuentros y otros eventos. Se conserva la búsqueda exclusivamente por enlaces de Maps.
- FR05: Conservar todos los archivos, títulos, fechas, horas, cartas, canciones, álbumes y lugares existentes. Sin migración destructiva ni cambio de plan de hosting.
- FR06: Controles accesibles de 44 px y sin desbordamiento a 360 px; vista previa y mensajes de progreso/error.

## Supuestos
Una puntuación compartida por la pareja y una foto principal por lugar. Quitar una foto del mapa sólo quita su asociación; su original permanece en Recuerdos.

## Éxito verificable
SC01: Puntuar, subir, editar, recargar y filtrar funciona en móvil y escritorio.
SC02: Cero cambios en los registros y archivos previos durante despliegue y pruebas con datos de ejemplo.
SC03: Reintentar una operación fallida no duplica la foto; una foto guardada sigue disponible incluso si se cancela la ficha.
