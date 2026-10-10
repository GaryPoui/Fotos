# Feature Specification: Nuestro mapa
**Feature Branch**: `main` (avances y publicación autorizados)
**Created**: 2026-10-10
**Status**: Implemented, published and verified
**Input**: Nuevo apartado Mapa con ubicación actual, lugares guardados por dirección o URL de Maps, categorías e íconos distintos.

## User Scenarios & Testing
### User Story 1 - Guardar nuestros lugares (Priority: P1)
Entro a Mapa, busco una dirección o pego un enlace de Google Maps, confirmo el punto, doy un nombre y categoría y guardo.
**Why this priority**: Crear una historia compartida de salidas y próximos planes.
**Independent Test**: Guardar un café y un restaurante; recargar y comprobar sus posiciones, nombres e íconos.
**Acceptance Scenarios**:
1. **Given** una dirección, **When** busco y elijo un resultado, **Then** puedo revisar el punto antes de guardarlo.
2. **Given** un enlace de un lugar de Google Maps largo o compartido corto, **When** lo busco, **Then** obtengo el punto o resultados para confirmar; si no se puede interpretar, explica cómo elegirlo manualmente.
3. **Given** un punto, **When** guardo nombre y categoría, **Then** aparece en mapa y lista, y permanece al recargar.
4. **Given** una conexión caída, **When** falla el guardado, **Then** el formulario permanece para reintentar.

### User Story 2 - Recorrer y organizar (Priority: P1)
Exploro el mapa, filtro categorías y elijo un lugar para ver su detalle, cambiarlo o quitarlo.
**Why this priority**: Encontrar y mantener los lugares compartidos.
**Independent Test**: Filtrar cafés, seleccionar marcador o tarjeta, editar categoría y nombre y quitar únicamente un lugar de prueba tras confirmar.
**Acceptance Scenarios**:
1. **Given** lugares de distintas categorías, **When** filtro, **Then** mapa y lista muestran los mismos lugares con íconos y etiquetas distinguibles.
2. **Given** un lugar, **When** lo selecciono en mapa o lista, **Then** veo nombre, categoría, dirección, nota y acceso para abrirlo en Maps.
3. **Given** una edición o eliminación cancelada, **When** vuelvo al mapa, **Then** conserva lo guardado.

### User Story 3 - Ver dónde estamos (Priority: P2)
Toco Mi ubicación y permito el acceso para ver mi posición actual en el mapa.
**Why this priority**: Orientarnos al recorrer lugares.
**Independent Test**: Simular ubicación permitida/denegada; verificar posición temporal y que no se guarda automáticamente.
**Acceptance Scenarios**:
1. **Given** permiso concedido, **When** toco Mi ubicación, **Then** centra el mapa y distingue mi posición de los lugares guardados.
2. **Given** permiso denegado o ubicación no disponible, **When** intento localizarme, **Then** explica el problema y puedo seguir buscando y guardando lugares.

### Edge Cases
- Dirección ambigua: resultados a elegir; sin resultado: selección manual en mapa.
- Enlace inválido, acortado vencido, ruta con múltiples paradas o proveedor sin conexión: error útil, sin guardar una ubicación inventada.
- Texto largo, caracteres especiales y notas: legibles sin desbordar; no se interpretan como instrucciones ni HTML.
- Mapa base sin conexión: mantiene lista y formularios disponibles e informa el fallo.
- Álbumes, canciones, cartas y fechas manuales actuales: intactos tras incorporar Mapa.

## Requirements
### Functional Requirements
- **FR-001**: Navegación principal MUST incluir Mapa junto a Recuerdos, Música y Palabras, accesible a 360 px y PC.
- **FR-002**: Mapa MUST permitir desplazamiento y zoom, mostrar lugares guardados y una lista alternativa accesible.
- **FR-003**: Búsqueda MUST aceptar dirección o enlace de un lugar de Google Maps y exigir confirmación del resultado antes de guardar; MUST ofrecer selección manual del punto.
- **FR-004**: Lugares MUST contener nombre no vacío (máximo100), dirección (máximo400), coordenadas válidas, categoría y nota opcional (máximo1000).
- **FR-005**: Categorías MUST incluir Cafés, Restaurantes, Shoppings, Lugares a visitar, Lugares importantes, Parques y paseos, Otros, cada una con ícono distinto y texto; filtro sincronizado en mapa/lista.
- **FR-006**: Crear, editar y quitar lugares MUST persistir de forma privada; quitar exige confirmación. Cancelación/error MUST conservar lo guardado y el borrador.
- **FR-007**: Mi ubicación MUST solicitar permiso sólo por acción del usuario; ubicación actual MUST permanecer temporal, sin historial ni guardado automático.
- **FR-008**: Sólo usuarios con sesión MUST leer/modificar lugares y usar búsqueda; enlaces arbitrarios o redirecciones ajenas a Maps MUST rechazarse.
- **FR-009**: Cambios MUST conservar el 100% de fotos, videos, cartas, títulos, canciones, fechas y ajustes anteriores; lugares MUST incluirse en copia exportada.
- **FR-010**: Diseño MUST ser mobile first celeste/rosado, con teclado, controles44px y movimiento reducido; no requiere servicios de pago ni nuevas cuentas.
- **FR-011**: Fallos de búsqueda, ubicación o mapa MUST mostrar explicación recuperable; no bloquear los lugares existentes.
### Key Entities
- **Lugar**: Punto compartido con identidad estable, nombre, dirección, categoría, nota y fecha de creación.
- **Resultado de búsqueda**: Candidato temporal pendiente de confirmar.
- **Ubicación actual**: Posición temporal del dispositivo, separada de los lugares.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Crear/editar un lugar y recargar conserva todos sus campos en móvil y PC.
- **SC-002**: Las siete categorías se distinguen por ícono y etiqueta y filtran mapa y lista de forma coherente.
- **SC-003**: Flujos principales funcionan a360/390/1440px sin desplazamiento horizontal y controles táctiles mínimos44px.
- **SC-004**: Sin permiso de ubicación se puede completar búsqueda y guardado; sin sesión no se accede a datos ni búsqueda.
- **SC-005**: La comparación anterior/posterior a publicación conserva todos los datos históricos; pruebas usan contenido sintético.

## Assumptions
- Ubicación corresponde al dispositivo actual; no se rastrea ni comparte en vivo el celular de la otra persona.
- La dirección se busca sólo al enviar la consulta, sin autocompletado. La nota y el nombre privado no se envían al buscador.
- No se incluyen navegación giro a giro, rutas, reseñas ni importación masiva. Un enlace que sólo contiene una identificación opaca puede requerir elegir entre resultados o marcar el punto.
- Se reutilizan hosting gratuito, sesión y almacenamiento privados existentes. Se muestra atribución del mapa y buscador.
