# Feature Specification: Nombres y portadas de álbumes
**Feature Branch**: `main` (publicación autorizada)
**Created**: 2026-10-09
**Status**: Implemented, published and verified
**Input**: Poder editar los títulos y fotos de portada de los álbumes.

## User Scenarios & Testing
### User Story 1 - Nombrar una historia (Priority: P1)
Abro Editar en un álbum, cambio su nombre y lo veo actualizado al volver a entrar.
**Why this priority**: Identificar y personalizar nuestras historias.
**Independent Test**: Guardar un nombre, recargar, buscarlo y subir otro recuerdo al mismo álbum.
**Acceptance Scenarios**:
1. **Given** un álbum existente, **When** cambio su nombre, **Then** mantiene todos sus recuerdos y el nombre se ve en tarjetas, filtros y visor.
2. **Given** un álbum con nombre cambiado, **When** lo elijo al subir o editar un recuerdo, **Then** éste se agrega al mismo álbum.
3. **Given** un formulario sin guardar, **When** cancelo, **Then** el álbum conserva su nombre.

### User Story 2 - Elegir nuestra portada (Priority: P1)
Elijo una de las fotos del álbum como portada sin reemplazar el archivo original.
**Why this priority**: Reconocer el álbum por nuestra imagen favorita.
**Independent Test**: Cambiar portada y comprobarla después de recargar en móvil y PC.
**Acceptance Scenarios**:
1. **Given** varias fotos, **When** elijo una portada y guardo, **Then** la tarjeta usa esa imagen y conserva el total de recuerdos.
2. **Given** una portada elegida, **When** selecciono Automática o la foto deja de pertenecer al álbum, **Then** usa otra foto disponible sin errores.

### Edge Cases
- Álbum sólo con videos: permite nombre y portada automática con símbolo; explica que faltan fotos.
- Nombre vacío o mayor a 80 caracteres: error; una colisión con otro nombre visible se rechaza para evitar confusión.
- Portada de otro álbum, video o archivo inexistente: rechazada.
- Fallo de conexión: mantiene el formulario y permite reintentar.
- Nombres largos, acentos y caracteres especiales: no desbordan a 360 px.

## Requirements
### Functional Requirements
- **FR-001**: Cada álbum MUST ofrecer edición de nombre y portada mediante controles táctiles accesibles.
- **FR-002**: Nombre MUST ser no vacío, de máximo 80 caracteres y sin colisión con otro nombre visible.
- **FR-003**: Portada MUST elegirse entre fotos del propio álbum o volver a Automática.
- **FR-004**: Cambios MUST persistir tras recargar y verse en tarjetas, búsqueda, filtros, visor, subida y edición de recuerdos.
- **FR-005**: Edición del álbum MUST conservar miembros, títulos individuales, fechas manuales, originales, canciones, cartas y ajustes; la publicación no reclasifica contenido.
- **FR-006**: Cancelación y errores MUST conservar lo guardado y evitar guardados parciales de nombre y portada.
- **FR-007**: Selección MUST funcionar a 360 px y PC, con teclado, sesión privada y sin nuevos servicios de pago.
- **FR-008**: Copias exportadas MUST incluir nombres y portadas elegidos; integración y navegador MUST verificar preservación.
- **FR-009**: El acceso a editar MUST mostrarse como un lápiz pequeño en la esquina superior derecha de la portada, con nombre accesible y área táctil de 44 px, en móvil y PC.
### Key Entities
- **Álbum**: Grupo de recuerdos con identidad estable, nombre visible y portada opcional.
- **Portada**: Referencia a una foto existente del grupo; no modifica ni duplica archivos.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Nombre y portada guardados permanecen al recargar en móvil y PC.
- **SC-002**: El 100% de campos y originales históricos comparados sigue intacto tras publicar.
- **SC-003**: Cambiar el nombre no divide el álbum: subir usando el nombre visible aumenta el mismo grupo.
- **SC-004**: Todos los controles caben a 360 px y son accesibles con teclado y tamaño táctil de 44 px.

## Assumptions
- Se elige portada entre las fotos ya guardadas en ese álbum. Para usar otra imagen se la sube primero allí.
- Cambiar el nombre visible conserva la identidad original y la pertenencia de los recuerdos.
- Se reutilizan sesión, hosting y almacenamiento privados actuales. No se modifica la alternativa Firebase heredada, que no está desplegada.
