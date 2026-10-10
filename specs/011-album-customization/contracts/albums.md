# API and UI contracts
GET /api/library añade albums opcional, array de {album,title,coverId}. Datos sólo tras sesión.
PATCH /api/albums recibe objeto estricto {album,title,coverId}, título 1–80 caracteres, album existente 1–80, coverId UUID o null. 404 grupo inexistente, 400 título/portada inválida, 409 nombre ambiguo, 401 sesión ausente, 403 mutación insegura. Éxito200 configuración guardada. Sin UPDATE/DELETE media, notes o archivos.
Editor: Nombre del álbum, Portada automática y opciones radio de miniaturas con títulos accesibles; Guardar álbum/Cancelar. Busy impide cierre/duplicación. Error en el formulario. Título cambiado aparece en filtros/visor/subidas; valores internos estables.
Exportación recuerdos.json incluye albums, conservando formato compatible.
