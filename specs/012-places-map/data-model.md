# Data model
- Place: id UUID; name trimmed1–100; address trimmed0–400; category enum cafe|restaurant|shopping|visit|important|park|other; note trimmed0–1000; lat finite[-90,90]; lng finite[-180,180]; createdAt ISO server assigned; updatedAt ISO server assigned. Each persisted under meta key place:<id>. No relation to media or notes.
- Candidate: name, address, lat, lng, optional approximate (camera-only point) and addressApproximate (nearby reverse suggestion) flags; temporary search/map selection, not persisted until confirmation. Flags are excluded from persisted Place.
- Current position: lat/lng/accuracy only in component memory; cleared on navigation/logout; never persisted/transmitted to application server.
- Library.places?: Place[]; absence interpreted as empty. Export JSON includes places array.
- Create assigns id/timestamps. Edit preserves id/createdAt; delete only exact validated place UUID key. Failed write leaves prior row intact.
