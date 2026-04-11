/**
 * File-based IPC for communicating with AutoCAD via LISP dispatcher.
 *
 * Flow:
 *  1. Write  C:/temp/acad_mcp_cmd_{id}.json
 *  2. Poke AutoCAD via Win32 PostMessage (types "(c:yqmcp-dispatch)" + Enter)
 *  3. LISP reads cmd, executes, writes C:/temp/acad_mcp_result_{id}.json
 *  4. We poll until the result file appears, re-poking every few seconds.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { exec } from "child_process";

const IPC_DIR = process.env.ACAD_MCP_IPC_DIR || "C:/temp";
const POLL_INTERVAL_MS = 200;
const TIMEOUT_MS = Number(process.env.ACAD_MCP_IPC_TIMEOUT) || 120000;
const POKE_INTERVAL_MS = 3000; // re-poke every 3 seconds

export interface IpcRequest {
  request_id: string;
  command: string;
  params: Record<string, unknown>;
  ts: number;
}

export interface IpcResponse {
  request_id: string;
  ok: boolean;
  payload: Record<string, unknown>;
  error?: string;
}

function ensureIpcDir(): void {
  if (!fs.existsSync(IPC_DIR)) {
    fs.mkdirSync(IPC_DIR, { recursive: true });
  }
}

/**
 * Poke AutoCAD via Win32 PostMessage — non-blocking.
 * Sends "(c:yqmcp-dispatch)" keystrokes to AutoCAD's command line.
 */
function pokeAutoCAD(): void {
  const scriptPath = path.join(path.dirname(__dirname), "scripts", "poke_autocad.ps1");
  if (!fs.existsSync(scriptPath)) return;
  try {
    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${scriptPath}"`,
      { timeout: 10000 }
    );
  } catch {}
}

/**
 * Poll for result file, re-poking AutoCAD periodically.
 */
function pollForFile(filePath: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let lastPoke = start;

    const check = () => {
      if (fs.existsSync(filePath)) {
        // Small delay to let LISP finish writing
        setTimeout(() => resolve(), 100);
        return;
      }
      const elapsed = Date.now() - start;
      if (elapsed > timeoutMs) {
        reject(new Error(`Timeout after ${timeoutMs}ms waiting for AutoCAD response. Make sure AutoCAD is open with the LISP bridge loaded.`));
        return;
      }
      // Re-poke every POKE_INTERVAL_MS
      if (Date.now() - lastPoke > POKE_INTERVAL_MS) {
        pokeAutoCAD();
        lastPoke = Date.now();
      }
      setTimeout(check, POLL_INTERVAL_MS);
    };
    check();
  });
}

// Serialize IPC calls so only one command runs at a time.
let ipcLock: Promise<unknown> = Promise.resolve();

export async function dispatch(
  command: string,
  params: Record<string, unknown> = {}
): Promise<IpcResponse> {
  const result = ipcLock.then(() => dispatchUnlocked(command, params));
  ipcLock = result.catch(() => {});
  return result;
}

async function dispatchUnlocked(
  command: string,
  params: Record<string, unknown>
): Promise<IpcResponse> {
  ensureIpcDir();

  const requestId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  if (!/^[a-f0-9]{12}$/.test(requestId)) {
    throw new Error("Invalid request ID");
  }
  const cmdFile = path.join(IPC_DIR, `acad_mcp_cmd_${requestId}.json`);
  const resultFile = path.join(IPC_DIR, `acad_mcp_result_${requestId}.json`);

  const request: IpcRequest = {
    request_id: requestId,
    command,
    params,
    ts: Date.now() / 1000,
  };

  // 1. Write command file directly (no atomic rename — LISP had issues with .tmp)
  fs.writeFileSync(cmdFile, JSON.stringify(request, null, 2), "utf-8");

  // 2. Poke AutoCAD immediately (non-blocking)
  pokeAutoCAD();

  try {
    // 3. Poll for result, re-poking periodically
    await pollForFile(resultFile, TIMEOUT_MS);

    // 4. Read and validate result
    const stat = fs.statSync(resultFile);
    if (stat.size > 10 * 1024 * 1024) {
      throw new Error("IPC response too large (>10MB)");
    }
    const raw = fs.readFileSync(resultFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null ||
        typeof parsed.ok !== "boolean" ||
        typeof parsed.request_id !== "string") {
      throw new Error("Invalid IPC response structure");
    }
    return {
      request_id: String(parsed.request_id),
      ok: Boolean(parsed.ok),
      payload: (typeof parsed.payload === "object" && parsed.payload !== null) ? parsed.payload : {},
      error: parsed.error ? String(parsed.error) : undefined,
    };
  } finally {
    // 5. Cleanup
    try { fs.unlinkSync(cmdFile); } catch {}
    try { fs.unlinkSync(resultFile); } catch {}
  }
}
