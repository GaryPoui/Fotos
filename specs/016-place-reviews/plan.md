# Plan 016
React/TypeScript, Express, PostgreSQL privado y Storage privado existentes. Sin dependencias ni DDL.

Place incorpora rating?: number|null y photoId?: UUID|null. Campos opcionales para leer filas anteriores sin reescribirlas. PATCH conserva propiedades omitidas por clientes anteriores. Validar referencias a media de tipo photo. GET entrega sólo referencias válidas, por si una foto se eliminó de Recuerdos; no modifica las filas guardadas.

Subir por /api/media con X-Upload-Id estable, álbum Lugares y límites/cuota existentes. Guardar primero la foto y después la ficha. Reintentos usan el mismo ID y mantienen el formulario. Cambiar o quitar la asociación nunca elimina media. Mantener foto anterior ante fallas. Mostrar progreso; explicar la conservación en Recuerdos. Vista previa con object URL y liberación al cambiar/cerrar.

Añadir culture/event al modelo, validación y registro compartido de categorías; Landmark y CalendarDays para marcadores. Estrellas por botones aria-pressed, etiquetas explícitas, controles de 44px; lectura accesible de puntuación.

Constitución: PASS privacidad, persistencia, especificación previa, accesibilidad y cero servicios pagos. Respaldo privado pre-place-reviews-2026-10-14 realizado antes de cambios.

Validación: integración API local y proveedor remoto, referencias inválidas y campos omitidos; UI móvil/escritorio con errores/reintentos, fotos y categorías; build, suite, CI, despliegue y comparación de snapshot privado.
