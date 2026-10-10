# Data model
AlbumCustomization: album string original exacto, title string trimmed no vacío máximo 80, coverId UUID o null. Identidad album no cambia. JSON completo en meta bajo album:encodeURIComponent(album), escritura upsert atómica.
Library.albums?: AlbumCustomization[]; ausente equivale a [] en clientes antiguos y fixtures. Sólo grupos con miembros photo/video actuales se presentan. Media y notes intactos.
Nombre visible title o clave original; para subir/editar, resolver texto del nombre visible a clave antes de guardar. Colisiones entre títulos y otras claves/nombres visibles se rechazan. Portada preferida sólo si foto aún pertenece al grupo; si no, primera foto disponible o símbolo.
