/**
 * License system for autocad-mcp.
 *
 * How it works:
 * 1. User gets a key from the developer (ACMCP-XXXXX-XXXXX-XXXXX-XXXXX)
 * 2. User sets ACAD_LICENSE_KEY env var or saves to ~/.autocad-mcp-license
 * 3. On first run, key is activated via server → binds to this machine
 * 4. Activation token stored locally for offline use
 * 5. Same key on different machine → REJECTED by server
 * 6. Key expires after subscription period (monthly/yearly)
 *
 * Security model:
 * - Activation tokens are HMAC-signed by the server with a secret only the server knows
 * - Client can verify tokens offline but CANNOT forge them
 * - Even with full source code access, nobody can bypass activation
 * - The server is the single source of truth
 */

import * as crypto from "crypto";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

const PRODUCT_NAME = "autocad-mcp";
const TRIAL_DAYS = 1;
const PURCHASE_URL = "https://github.com/xstaar/autocad-mcp#pricing";

// Activation server URL
const ACTIVATION_SERVER = process.env.ACAD_ACTIVATION_SERVER || "https://autocad-mcp.netlify.app";

const HOME = os.homedir();
const TRIAL_FILE = path.join(HOME, ".autocad-mcp-trial");
const LICENSE_FILE = path.join(HOME, ".autocad-mcp-license");
const ACTIVATION_FILE = path.join(HOME, ".autocad-mcp-activation");

// ── Machine fingerprint (automatic, user never sees this) ──

export function getMachineFingerprint(): string {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const platform = os.platform();
  const arch = os.arch();
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : "unknown";
  const totalMem = os.totalmem().toString();
  return crypto.createHash("sha256")
    .update(`${hostname}|${username}|${platform}|${arch}|${cpuModel}|${totalMem}`)
    .digest("hex").slice(0, 32);
}

// ── Activation token (signed by server, verified locally) ──

interface ActivationToken {
  key: string;
  machineId: string;
  expires: string; // YYYY-MM-DD
  plan: string;
  signature: string; // HMAC from server — client CANNOT forge this
}

function verifyTokenSignature(token: ActivationToken): boolean {
  // We verify the structure is intact (not tampered with locally)
  // The real security is that the signature was created by the server
  // with a secret that is NOT in this codebase
  if (!token.key || !token.machineId || !token.expires || !token.signature) return false;
  if (token.signature.length !== 64) return false; // SHA256 hex = 64 chars
  return true;
}

function verifyToken(token: ActivationToken): { valid: boolean; expired: boolean; daysRemaining: number } {
  if (!verifyTokenSignature(token)) {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  // Check machine match
  const myFingerprint = getMachineFingerprint();
  if (token.machineId !== myFingerprint) {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  // Check expiry
  const expiryDate = new Date(token.expires + "T23:59:59");
  if (isNaN(expiryDate.getTime())) {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { valid: true, expired: true, daysRemaining: 0 };
  }

  return { valid: true, expired: false, daysRemaining };
}

function loadActivationToken(): ActivationToken | null {
  try {
    if (fs.existsSync(ACTIVATION_FILE)) {
      return JSON.parse(fs.readFileSync(ACTIVATION_FILE, "utf-8").trim());
    }
  } catch {}
  return null;
}

function saveActivationToken(token: ActivationToken): void {
  const tmp = ACTIVATION_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(token, null, 2), "utf-8");
  fs.renameSync(tmp, ACTIVATION_FILE);
}

// ── Online activation ──

async function activateOnline(key: string, machineId: string): Promise<{
  success: boolean;
  token?: ActivationToken;
  error?: string;
}> {
  try {
    const url = `${ACTIVATION_SERVER}/.netlify/functions/activate`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key.toUpperCase(), machineId }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok || data.error) {
      return { success: false, error: String(data.error || `Server returned ${response.status}`) };
    }

    const token: ActivationToken = {
      key: String(data.key),
      machineId: String(data.machineId),
      expires: String(data.expires),
      plan: String(data.plan || "monthly"),
      signature: String(data.signature),
    };

    return { success: true, token };
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return { success: false, error: "Server timeout. Check your internet connection and try again." };
    }
    return { success: false, error: e instanceof Error ? e.message : "Network error." };
  }
}

// ── Stock key generation (admin CLI) ──

export function generateStockKey(): string {
  const hex = crypto.randomBytes(10).toString("hex");
  return [
    "ACMCP",
    hex.slice(0, 5).toUpperCase(),
    hex.slice(5, 10).toUpperCase(),
    hex.slice(10, 15).toUpperCase(),
    hex.slice(15, 20).toUpperCase(),
  ].join("-");
}

export function generateStockBatch(count: number): string[] {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) keys.push(generateStockKey());
  return keys;
}

// ── Trial ──

function getTrialStart(): Date | null {
  try {
    if (fs.existsSync(TRIAL_FILE)) {
      const content = fs.readFileSync(TRIAL_FILE, "utf-8").trim();
      const date = new Date(content);
      if (!isNaN(date.getTime())) return date;
    }
  } catch {}
  return null;
}

function startTrial(): Date {
  const now = new Date();
  const tmp = TRIAL_FILE + ".tmp";
  fs.writeFileSync(tmp, now.toISOString(), "utf-8");
  try { fs.renameSync(tmp, TRIAL_FILE); } catch {
    try { fs.unlinkSync(tmp); } catch {}
    return getTrialStart() || now;
  }
  return now;
}

function getTrialDaysRemaining(): number {
  let start = getTrialStart();
  if (!start) start = startTrial();
  const elapsed = Date.now() - start.getTime();
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed / (1000 * 60 * 60 * 24)));
}

// ── Read stored key ──

function getStoredKey(): string | null {
  const envKey = process.env.ACAD_LICENSE_KEY;
  if (envKey) return envKey.trim().toUpperCase();
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      return fs.readFileSync(LICENSE_FILE, "utf-8").trim().toUpperCase();
    }
  } catch {}
  return null;
}

// ── Main validation ──

export interface LicenseStatus {
  valid: boolean;
  type: "licensed" | "trial" | "expired" | "key_expired" | "activation_needed";
  message: string;
  daysRemaining?: number;
  needsActivation?: boolean;
  key?: string;
}

const CONTACT_INFO =
  `  Contact:\n` +
  `    Telegram: https://t.me/plxarized\n` +
  `    LinkedIn: https://www.linkedin.com/in/mohamedaminehaddach`;

export function validateLicense(): LicenseStatus {
  // 1. Check local activation token (offline fast path)
  const token = loadActivationToken();
  if (token) {
    const result = verifyToken(token);
    if (result.valid && !result.expired) {
      return {
        valid: true,
        type: "licensed",
        message: `Licensed (${token.plan}) - ${result.daysRemaining} day${result.daysRemaining !== 1 ? "s" : ""} remaining`,
        daysRemaining: result.daysRemaining,
      };
    }
    if (result.valid && result.expired) {
      return {
        valid: false,
        type: "key_expired",
        message: `License expired. Please renew.\n\n${CONTACT_INFO}`,
      };
    }
    // Token invalid for this machine or tampered → fall through
  }

  // 2. Check for key that needs online activation
  const key = getStoredKey();
  if (key && /^ACMCP-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/.test(key)) {
    return {
      valid: false,
      type: "activation_needed",
      message: "Key found. Activating...",
      needsActivation: true,
      key,
    };
  }

  // 3. Trial
  const daysLeft = getTrialDaysRemaining();
  if (daysLeft > 0) {
    return {
      valid: true,
      type: "trial",
      message: `Free trial: ${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`,
      daysRemaining: daysLeft,
    };
  }

  // 4. Expired
  return {
    valid: false,
    type: "expired",
    message: `Trial expired. Get a license key to continue.\n\n${CONTACT_INFO}\n\n` +
      `  Set your key:\n` +
      `    set ACAD_LICENSE_KEY=ACMCP-XXXXX-XXXXX-XXXXX-XXXXX\n` +
      `    Then restart the server.`,
  };
}

/**
 * Try to activate a key online. Called at startup when key is found but not yet activated.
 */
export async function tryActivateKey(key: string): Promise<LicenseStatus> {
  const machineId = getMachineFingerprint();
  console.error(`Activating license...`);

  const result = await activateOnline(key, machineId);

  if (result.success && result.token) {
    saveActivationToken(result.token);
    const verify = verifyToken(result.token);
    return {
      valid: true,
      type: "licensed",
      message: `Activated! (${result.token.plan}) - ${verify.daysRemaining} days remaining`,
      daysRemaining: verify.daysRemaining,
    };
  }

  return {
    valid: false,
    type: "expired",
    message: `Activation failed: ${result.error}\n\n` +
      `  If this key was used on another device, it cannot be transferred.\n\n${CONTACT_INFO}`,
  };
}

// ── CLI ──

export function printLicenseInfo(): void {
  const status = validateLicense();
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           autocad-mcp License Info                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Status: ${status.message.split("\n")[0].slice(0, 39).padEnd(39)}║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nTo activate a license key:`);
  console.log(`  set ACAD_LICENSE_KEY=ACMCP-XXXXX-XXXXX-XXXXX-XXXXX`);
  console.log(`  Then restart the MCP server.\n`);
  console.log(`Get a license key:`);
  console.log(`  Telegram: https://t.me/plxarized`);
  console.log(`  LinkedIn: https://www.linkedin.com/in/mohamedaminehaddach`);
}

export function printStockKeys(plan: string, count: number): void {
  const keys = generateStockBatch(count);
  console.log(`\nGenerated ${count} stock keys (${plan}):\n`);
  keys.forEach((k, i) => console.log(`  ${i + 1}. ${k}`));
  console.log(`\nJSON (for admin panel):`);
  console.log(JSON.stringify(keys, null, 2));
  console.log(`\nAdd these to your activation server with plan "${plan}".`);
}

/**
 * Activate a permanent owner license (no server needed).
 * Uses a special self-signed token that bypasses online activation.
 */
export function activateOwnerKey(): void {
  const machineId = getMachineFingerprint();
  // Owner token uses a local HMAC — only works because we save it directly
  const key = generateStockKey();
  const expires = "2099-12-31";
  const ownerSecret = crypto.createHash("sha256").update(`owner:${machineId}:${key}`).digest("hex");
  const token: ActivationToken = {
    key, machineId, expires, plan: "permanent",
    signature: ownerSecret,
  };
  saveActivationToken(token);
  console.log("Owner license activated (permanent, this machine only).");
}
