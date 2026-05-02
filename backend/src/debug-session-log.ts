import { appendFileSync } from 'fs';
import { basename, dirname, join, normalize } from 'path';
import { tmpdir } from 'os';

/**
 * NDJSON sink for Cursor debug sessions (never log secrets/tokens here).
 *
 * If you cannot find the file: set **`CLIENTECOMM_DEBUG_LOG`** in `.env` to a full absolute path
 * (e.g. `C:\\Users\\You\\Desktop\\ClientEcomm\\debug-4476a5.log`), restart the backend, then reproduce.
 *
 * Fallback: **`%TEMP%\\debug-4476a5.log`** (Windows) or **`$TMPDIR/debug-4476a5.log`**
 */
const SESSION_FILE = 'debug-4476a5.log';

function allCandidatePaths(): string[] {
  const unique = new Set<string>();
  const add = (p: string) => {
    try {
      unique.add(normalize(p));
    } catch {
      /* ignore */
    }
  };

  const fromEnv = process.env.CLIENTECOMM_DEBUG_LOG?.trim();
  if (fromEnv) {
    add(fromEnv);
  }

  const cwd = process.cwd();
  add(join(cwd, SESSION_FILE));
  add(join(cwd, 'backend', SESSION_FILE));
  add(join(cwd, '..', SESSION_FILE));
  add(join(cwd, '..', 'backend', SESSION_FILE));

  if (basename(cwd) === 'backend') {
    add(join(cwd, '..', SESSION_FILE));
  }

  let dir: string =
    typeof __dirname !== 'undefined' ? __dirname : cwd;
  for (let i = 0; i < 12; i++) {
    add(join(dir, SESSION_FILE));
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  add(join(tmpdir(), SESSION_FILE));
  add(join(tmpdir(), `clientecomm-${SESSION_FILE}`));

  return [...unique];
}

let warnedNoSink = false;

export function appendDebugSessionNdjson(
  payload: Record<string, unknown>,
): void {
  const line =
    JSON.stringify({
      sessionId: '4476a5',
      timestamp: Date.now(),
      ...payload,
    }) + '\n';

  const paths = allCandidatePaths();
  let lastErr = '';
  for (const p of paths) {
    try {
      appendFileSync(p, line, 'utf8');
      return;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  if (!warnedNoSink) {
    warnedNoSink = true;
    /* eslint-disable no-console -- deliberate once-per-process diagnostic */
    console.warn(
      `[debug-session-log] Could not write "${SESSION_FILE}" after ${paths.length} attempts. ` +
        `Set CLIENTECOMM_DEBUG_LOG in .env to a full path. Last error: ${lastErr}. ` +
        `Also check TEMP: ${join(tmpdir(), SESSION_FILE)}`,
    );
    /* eslint-enable no-console */
  }
}
