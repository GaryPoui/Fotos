# Data model
Media añade campos opcionales y nullable:
- capturedAt: string YYYY-MM-DDTHH:mm:ss; fecha de calendario real y hora 00–23, minuto/segundo 00–59. Reloj original sin conversión.
- captureOffset: string ±HH:mm con máximo ±14:00, o null. Nunca inferido.
- dateSource: metadata | upload | manual, o null para registros anteriores.
date permanece YYYY-MM-DD; para nuevas fotos automáticas corresponde a capturedAt o día argentino de createdAt. Ninguna fecha existente se recalcula.
UploadItem conserva capturedAt/captureOffset y metadataRead antes de sustituir su File al convertir; null significa lectura realizada sin fecha, undefined aún no leída.
Filtro usa referencia memory/upload más cinco componentes independientes. Recuerdos previos conservan día; hora desconocida no coincide con filtros de hora. Referencia upload siempre usa createdAt válido en Argentina.
Título/álbum/tags/favorito siguen editables; las fechas automáticas se muestran como información, y registros manuales anteriores conservan edición compatible.
