/**
 * License key system for yqarch-mcp.
 *
 * Keys are time-limited (monthly or yearly) and validated against a machine fingerprint.
 * Format: YQMCP-XXXXX-XXXXX-XXXXX-XXXXX-MM
 *   where MM = expiry month offset encoded in the key
 *
 * Trial: 1 day from first run (stored in ~/.yqarch-mcp-trial).
 * After trial: requires a valid license key in env YQARCH_LICENSE_KEY
 * or in file ~/.yqarch-mcp-license.
 */

import * as crypto from "crypto";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

const PRODUCT_NAME = "yqarch-mcp";
const LICENSE_SECRET = "yqarch-mcp-2026-claude-architectural-cad";
const TRIAL_DAYS = 1;
const PURCHASE_URL = "https://github.com/xstaar/yqarch-mcp#pricing";

const HOME = os.homedir();
const TRIAL_FILE = path.join(HOME, ".yqarch-mcp-trial");
const LICENSE_FILE = path.join(HOME, ".yqarch-mcp-license");

// ── Machine fingerprint ──

function getMachineId(): string {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const platform = os.platform();
  const arch = os.arch();
  return `${hostname}|${username}|${platform}|${arch}`;
}

function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// ── License key generation & validation ──

type Duration = "monthly" | "yearly" | "permanent";

/**
 * Generate a valid license key for a given machine ID with an expiration date.
 *
 * Key format: YQMCP-XXXXX-XXXXX-XXXXX-YYYYMMDD
 * The last segment encodes the expiry date, and the hash segments
 * are derived from machine + secret + expiry to prevent tampering.
 */
export function generateLicenseKey(machineId?: string, duration?: Duration, fromDate?: Date): string {
  const mid = machineId || getMachineId();
  const now = fromDate || new Date();

  // Calculate expiry date
  const expiry = new Date(now);
  if (duration === "permanent") {
    expiry.setFullYear(2099, 11, 31); // Never expires
  } else if (duration === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    // Default: monthly
    expiry.setMonth(expiry.getMonth() + 1);
  }

  const expiryStr = formatExpiry(expiry);
  const raw = hashString(`${LICENSE_SECRET}:${mid}:${expiryStr}`);

  // Format: YQMCP-XXXXX-XXXXX-XXXXX-YYYYMMDD
  const key = [
    "YQMCP",
    raw.slice(0, 5).toUpperCase(),
    raw.slice(5, 10).toUpperCase(),
    raw.slice(10, 15).toUpperCase(),
    expiryStr,
  ].join("-");

  return key;
}

function formatExpiry(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function parseExpiry(expiryStr: string): Date | null {
  if (expiryStr.length !== 8) return null;
  const y = parseInt(expiryStr.slice(0, 4), 10);
  const m = parseInt(expiryStr.slice(4, 6), 10) - 1;
  const d = parseInt(expiryStr.slice(6, 8), 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validate a license key against this machine.
 * Returns { valid, expired, daysRemaining } info.
 */
function validateKey(key: string): { valid: boolean; expired: boolean; daysRemaining: number } {
  const parts = key.trim().toUpperCase().split("-");
  // Expected: YQMCP-XXXXX-XXXXX-XXXXX-YYYYMMDD
  if (parts.length !== 5 || parts[0] !== "YQMCP") {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  const expiryStr = parts[4];
  const expiryDate = parseExpiry(expiryStr);
  if (!expiryDate) {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  // Recompute hash to verify key authenticity
  const mid = getMachineId();
  const raw = hashString(`${LICENSE_SECRET}:${mid}:${expiryStr}`);
  const expectedHash = [
    raw.slice(0, 5).toUpperCase(),
    raw.slice(5, 10).toUpperCase(),
    raw.slice(10, 15).toUpperCase(),
  ];

  if (parts[1] !== expectedHash[0] || parts[2] !== expectedHash[1] || parts[3] !== expectedHash[2]) {
    return { valid: false, expired: false, daysRemaining: 0 };
  }

  // Key is authentic — check expiry
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return { valid: true, expired: true, daysRemaining: 0 };
  }

  return { valid: true, expired: false, daysRemaining };
}

// ── Trial management ──

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
  fs.writeFileSync(TRIAL_FILE, now.toISOString(), "utf-8");
  return now;
}

function getTrialDaysRemaining(): number {
  let start = getTrialStart();
  if (!start) {
    start = startTrial();
  }
  const elapsed = Date.now() - start.getTime();
  const daysElapsed = elapsed / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(TRIAL_DAYS - daysElapsed));
}

// ── Read stored license key ──

function getStoredKey(): string | null {
  // 1. Environment variable
  const envKey = process.env.YQARCH_LICENSE_KEY;
  if (envKey) return envKey;

  // 2. License file
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      return fs.readFileSync(LICENSE_FILE, "utf-8").trim();
    }
  } catch {}

  return null;
}

// ── Main validation ──

export interface LicenseStatus {
  valid: boolean;
  type: "licensed" | "trial" | "expired" | "key_expired";
  message: string;
  daysRemaining?: number;
}

export function validateLicense(): LicenseStatus {
  // Check for stored license key
  const key = getStoredKey();
  if (key) {
    const result = validateKey(key);
    if (result.valid && !result.expired) {
      return {
        valid: true,
        type: "licensed",
        message: `Licensed - ${result.daysRemaining} day${result.daysRemaining !== 1 ? "s" : ""} remaining`,
        daysRemaining: result.daysRemaining,
      };
    }
    if (result.valid && result.expired) {
      return {
        valid: false,
        type: "key_expired",
        message:
          `License key expired. Please renew your subscription.\n\n` +
          `  Renew via:\n` +
          `    Telegram: https://t.me/plxarized\n` +
          `    LinkedIn: https://www.linkedin.com/in/xstaar\n` +
          `    GitHub:   ${PURCHASE_URL}\n\n` +
          `Update your license key after renewal:\n` +
          `  Option 1: Set env YQARCH_LICENSE_KEY=YOUR-NEW-KEY\n` +
          `  Option 2: Save key to ${LICENSE_FILE}`,
      };
    }
    // Invalid key — fall through to trial check
  }

  // Check trial
  const daysLeft = getTrialDaysRemaining();
  if (daysLeft > 0) {
    return {
      valid: true,
      type: "trial",
      message: `Free trial: ${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining (24 hours)`,
      daysRemaining: daysLeft,
    };
  }

  // Expired
  return {
    valid: false,
    type: "expired",
    message:
      `Trial expired. Purchase a license to continue using ${PRODUCT_NAME}.\n\n` +
      `  Get a key:\n` +
      `    Telegram: https://t.me/plxarized\n` +
      `    LinkedIn: https://www.linkedin.com/in/xstaar\n` +
      `    GitHub:   ${PURCHASE_URL}\n\n` +
      `Set your license key:\n` +
      `  Option 1: Set env YQARCH_LICENSE_KEY=YOUR-KEY\n` +
      `  Option 2: Save key to ${LICENSE_FILE}`,
  };
}

/**
 * CLI: show license info for this machine.
 */
export function printLicenseInfo(): void {
  const mid = getMachineId();
  const status = validateLicense();

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           yqarch-mcp License Info                ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Machine ID: ${mid.slice(0, 34).padEnd(35)}║`);
  console.log(`║  Status: ${status.message.split("\n")[0].slice(0, 39).padEnd(39)}║`);
  console.log("╚══════════════════════════════════════════════════╝");

  console.log(`\nTo activate a license key:`);
  console.log(`  set YQARCH_LICENSE_KEY=YQMCP-XXXXX-XXXXX-XXXXX-XXXXXXXX`);
  console.log(`  echo YQMCP-XXXXX-XXXXX-XXXXX-XXXXXXXX > "${LICENSE_FILE}"`);
  console.log(`\nGet a license key:`);
  console.log(`  Telegram: https://t.me/plxarized`);
  console.log(`  LinkedIn: https://www.linkedin.com/in/xstaar`);
  console.log(`  Pricing:  ${PURCHASE_URL}`);
}

/**
 * CLI: generate a license key for a customer (admin use).
 * Usage: node dist/index.js --generate-key <machine-id> <monthly|yearly|permanent>
 */
export function generateKeyForCustomer(machineId: string, duration: Duration): void {
  const key = generateLicenseKey(machineId, duration);
  const expiry = new Date();
  if (duration === "permanent") {
    expiry.setFullYear(2099, 11, 31);
  } else if (duration === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║        yqarch-mcp Key Generator (Admin)          ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Machine ID: ${machineId.slice(0, 34).padEnd(35)}║`);
  console.log(`║  Duration:   ${duration.padEnd(35)}║`);
  console.log(`║  Expires:    ${expiry.toISOString().slice(0, 10).padEnd(35)}║`);
  console.log(`║  Key:        ${key.padEnd(35)}║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nSend this key to the customer.`);
  console.log(`They activate it with:`);
  console.log(`  set YQARCH_LICENSE_KEY=${key}`);
}
