# Napkin Runbook

## Execution & Validation
1. **[2026-10-08] Verify both server and browser flows**
   Do instead: run `npm test`, `npm run build`, and `npm run test:e2e`; browser tests use isolated temporary data and port 4173.
2. **[2026-10-08] Local startup requires a private password**
   Do instead: create ignored `.env` with APP_PASSWORD of 12 to 256 characters and run `npm run dev`; open http://127.0.0.1:5173/.

## Hosting & Privacy
1. **[2026-10-08] Free hosting needs durable remote data and files**
   Do instead: follow specs/008-firebase-hybrid; never deploy SQLite or uploaded memories on an ephemeral disk.
2. **[2026-10-08] Firebase Storage requires billing**
   Do instead: verify the project's plan and current official requirements before choosing Firebase for media; preserve the zero-cost requirement and never enable billing automatically.
3. **[2026-10-08] Shared-chat links may reject automated access**
   Do instead: use current Git history and specs as evidence; ask for relevant chat excerpts when necessary and do not claim to have read an inaccessible chat.
4. **[2026-10-08] Verify real deployments and private media playback**
   Do instead: use Firebase CLI and check the live release; an MCP success did not update rules. Storage CORS can hide Content-Range: validate real audio/video playback, not only fetch status.
5. **[2026-10-08] Storage preflight is not final validation**
   Do instead: permit preliminary requests without size, then enforce reservation size/MIME with the SQL trigger on the final Storage object insert.
