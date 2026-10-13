# Contracts
Existing session/CSRF/private endpoints unchanged.
- GET /api/library storage:{used,limit,maxFile,maxVideoFile,available,reserved}. Production others50M, video209715200, total900M. No internal descriptors or keys exposed in Media.
- POST /api/media still one multipart file/X-Upload-Id; multer accepts max(maxFile,maxVideo), actual detected kind selects bound. Quota checks before writes and after reservation. Commit only allparts persisted;201new/200knownid/413sizequota/409activeunknownowner/400format/500providerfail. Preserve draft and historical content.
- GET/HEAD /api/files/:id: legacy proxy unchanged; segmented presents one original file with sameContent-Type. GET200full or206 single satisfiableRange; HEAD200fulllength ignoresRange;416 bytes */size. Streaming validates upstream bytes; errors beforeheaders502 and afterheadersconnectionclosed. Requires session; no provider secrets.
- DELETE /api/media/:id removes exact derived keys only then row; failure retains row for retry. File portions are private objects through existing bridge. No new bridge paths or permissions.
