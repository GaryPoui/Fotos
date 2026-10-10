# Validation guide
Run npm test and npm run build, then node node_modules/@playwright/test/cli.js test --grep "map|places". Isolated SQLite/PGlite fixtures only.
1. Login, Mapa, paste long/short Maps link; a single result fills draft automatically, ambiguous results require choosing. Review nearby suggested address and exact point, category Café, note, save and reload. Change URL during pending lookup and correct fields: stale replies must not overwrite corrections. No automatic save.
2. Mock address search multiple/no results/failure; select result, correct pin, retry save, cancel edit.
3. Mock shortlink redirects and malicious final hosts in unit tests; no arbitrary network fetch.
4. Create different categories, filter map/list, select marker or list, edit/reload, cancel then confirm deletion.
5. Simulate geolocation grant/denial, temporary marker and no persisted position. Block tiles to verify visible fallback.
6. At360/390/1440px: no horizontal overflow, touch44px, keyboard controls; screenshot synthetic data.
7. Before deployment save private DB/library snapshot; after deployment compare historical media,notes,meta and columns; no personal places changed by browser QA. Public provider smoke uses public landmark query only. Include places in export.
