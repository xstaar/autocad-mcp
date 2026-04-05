/**
 * File-based IPC for communicating with AutoCAD via LISP dispatcher.
 * Same protocol as autocad-mcp: write request JSON, poll for response JSON.
 *
 * Flow:
 *  1. Write  C:/temp/acad_mcp_cmd_{id}.json
 *  2. LISP dispatcher (yq_mcp_bridge.lsp) picks it up
 *  3. LISP writes C:/temp/acad_mcp_result_{id}.json
 *  4. We poll until the result file appears, then read & delete both files.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const IPC_DIR = process.env.ACAD_MCP_IPC_DIR || "C:/temp";
const POLL_INTERVAL_MS = 100;
const TIMEOUT_MS = Number(process.env.ACAD_MCP_IPC_TIMEOUT) || 15000;

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

/** Ensure the IPC directory exists. */
function ensureIpcDir(): void {
  if (!fs.existsSync(IPC_DIR)) {
    fs.mkdirSync(IPC_DIR, { recursive: true });
  }
}

/** Atomic write: write to .tmp then rename. */
function atomicWrite(filePath: string, data: string): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, data, "utf-8");
  fs.renameSync(tmp, filePath);
}

/** Wait until a file appears on disk, with timeout. */
function pollForFile(filePath: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(filePath)) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout after ${timeoutMs}ms waiting for ${filePath}`));
      } else {
        setTimeout(check, POLL_INTERVAL_MS);
      }
    };
    check();
  });
}

// Serialize IPC calls so only one command runs at a time.
let ipcLock: Promise<unknown> = Promise.resolve();

/**
 * Dispatch a command to the AutoCAD LISP bridge and return the response.
 */
export async function dispatch(
  command: string,
  params: Record<string, unknown> = {}
): Promise<IpcResponse> {
  // Queue behind any pending dispatch
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
  // Validate requestId is strictly alphanumeric (prevent path traversal)
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

  // 1. Write the command file atomically
  atomicWrite(cmdFile, JSON.stringify(request, null, 2));

  try {
    // 2. Wait for LISP to process and write the result
    await pollForFile(resultFile, TIMEOUT_MS);

    // 3. Read result with size limit and validation
    const stat = fs.statSync(resultFile);
    if (stat.size > 10 * 1024 * 1024) { // 10MB max
      throw new Error("IPC response too large (>10MB)");
    }
    const raw = fs.readFileSync(resultFile, "utf-8");
    const parsed = JSON.parse(raw);
    // Validate response structure
    if (typeof parsed !== "object" || parsed === null ||
        typeof parsed.ok !== "boolean" ||
        typeof parsed.request_id !== "string") {
      throw new Error("Invalid IPC response structure");
    }
    const response: IpcResponse = {
      request_id: String(parsed.request_id),
      ok: Boolean(parsed.ok),
      payload: (typeof parsed.payload === "object" && parsed.payload !== null) ? parsed.payload : {},
      error: parsed.error ? String(parsed.error) : undefined,
    };
    return response;
  } finally {
    // 4. Cleanup
    try { fs.unlinkSync(cmdFile); } catch {}
    try { fs.unlinkSync(resultFile); } catch {}
  }
}
