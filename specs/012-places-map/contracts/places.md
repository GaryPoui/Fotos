# Places contract
All endpoints use current session; mutations and resolution require X-Requested-With: NuestroRincon and matching Origin when supplied. JSON strict schemas,400validation,401session,403CSRF,404missingplace,502lookupfailure,429throttle.
- GET /api/library: additive places array.
- POST /api/places: {name,address,category,note,lat,lng},201 Place. No arbitrary client id/timestamps.
- PATCH /api/places/:id: same full payload,200 Place; UUIDvalidated and row must exist.
- DELETE /api/places/:id: validated UUID and existingplace,204; no other keys can be removed.
- POST /api/places/resolve: {query:trimmed3–2048}; returns {results:Candidate[]}. No persistent writes. Explicit address or supported Maps URL only, no arbitrary network destinations. Search queue/cooldown cap and bounded cache.
UI: Mapa tab, Mi ubicación, Ver todos, Agregar lugar, seven category filters; map+list in sync, safe DOM labels, editor inline with candidate choice/manual point, name/category/note fields, save/cancel, clear failure feedback, selected place edit/remove/Maps link.
