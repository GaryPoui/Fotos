# Verification — 2026-10-10
## Design and preservation
Spec Kit spec/plan/tasks before implementation, checklist8/8 PASS; research agent explicitly dispatched by plan skill. No extension hooks configured. Supabase changelog/current connection docs checked; no relevant breaking changes for existing pg connection.
Private fresh snapshot backups/pre-map-2026-10-10/:153 media files,186011570 bytes,3 notes; raw media/notes/meta rows and all rincon schema columns. Sessions and credentials excluded. Existing originals remain in private object storage, no storage operations in this feature.
Place rows use separate place:UUID JSON keys in existing private meta. No migrations, DDL, permissions or writes to historical media/notes/album/settings. Resolver authenticated/CSRF protected, links restricted to exact Google Maps HTTPS domains and paths with manual redirects max5, no HTML scraping. Position stays client-side, explicit button request only.
## Local validation
- Build and TypeScript: PASS. Map module lazy loaded; Leaflet1.9.4/types pinned and lockfile committed. npm audit reported0 vulnerabilities.
- Vitest41 passed,5 legacy Firebase emulator tests skipped. Tests cover invalid/private mutations, URL points vs camera, redirects/SSRF rejection/loops, Photon failure/empty results/cache/throttle, SQLite and PostgreSQL persistence, historical rows/objects preservation, ZIP places export.
- Full browser suite36/36 PASS mobile/desktop. Map cases use360px mobile and1440px desktop; save/retry/reload, filtering/list+markers, editing/cancellation, keyboard marker selection, removal confirmation, address candidates/manual point, location explicit/temporary/granted/denied and no-results/provider error. All prior media/music/letters/responsive/backup cases pass.
- Synthetic local mobile screenshot inspected; maps controls44px and no horizontal overflow. Editor flow refined so map preview precedes data/save on mobile.
- Actual Photon public landmark lookup 'Obelisco Buenos Aires':5 valid results; no personal address/location used.
## Publication
Pending CI, Render and public synthetic UI verification plus historical DB comparison; T013 remains open until verified.
