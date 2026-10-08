import { mkdirSync } from "node:fs";
import { join } from "node:path";
import lockfile from "proper-lockfile";

// A shared-volume heartbeat works across container PID namespaces.
// After SIGKILL the stale lease expires; a live server or backup keeps it fresh.
export async function acquireLock(dir: string, waitForStale = true) {
  mkdirSync(dir, { recursive: true });
  try {
    const release = await lockfile.lock(dir, {
      lockfilePath: join(dir, ".server.lock"),
      stale: 10000,
      update: 2000,
      retries: waitForStale
        ? { retries: 12, minTimeout: 1000, maxTimeout: 1000 }
        : 0,
    });
    let released = false;
    return async () => {
      if (!released) {
        released = true;
        await release();
      }
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ELOCKED")
      throw new Error(
        "El servidor está activo o el volumen se está respaldando. Detenelo y esperá 10 segundos antes de continuar.",
      );
    throw error;
  }
}
