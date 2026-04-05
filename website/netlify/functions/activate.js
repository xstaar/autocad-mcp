/**
 * Netlify Function: Activate a license key
 *
 * POST { key, machineId }
 *
 * Flow:
 * 1. Look up key in Netlify Blobs store
 * 2. If not found → error
 * 3. If found + status "available" → bind to machineId, return signed token
 * 4. If found + status "activated" + same machineId → return token (re-activation)
 * 5. If found + status "activated" + different machineId → REJECT
 * 6. If expired → error
 *
 * Required env vars:
 *   LICENSE_SECRET — for signing activation tokens
 */

const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

function hmacSign(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function calculateExpiry(plan) {
  const now = new Date();
  if (plan === "permanent") {
    return "2099-12-31";
  } else if (plan === "yearly") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    // monthly
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { key, machineId } = JSON.parse(event.body);

    // Validate inputs
    if (!key || !/^ACMCP-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/i.test(key)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid key format" }) };
    }
    if (!machineId || !/^[a-f0-9]{24}$/.test(machineId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid machine ID" }) };
    }

    const secret = process.env.LICENSE_SECRET;
    if (!secret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server misconfigured" }) };
    }

    // Look up key in blob store
    const store = getStore("license-keys");
    const keyNorm = key.toUpperCase();
    const raw = await store.get(keyNorm);

    if (!raw) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Invalid license key. Key not found." }) };
    }

    const keyData = JSON.parse(raw);

    // Check if key is already activated on a DIFFERENT machine
    if (keyData.status === "activated" && keyData.machineId && keyData.machineId !== machineId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: "This key is already activated on another machine. Each key can only be used on one device. Contact support for help.",
        }),
      };
    }

    // Calculate expiry (from activation date, not from key creation)
    let expires = keyData.expires;
    if (!expires || keyData.status === "available") {
      expires = calculateExpiry(keyData.plan);
    }

    // Check if expired
    const expiryDate = new Date(expires + "T23:59:59");
    if (expiryDate < new Date()) {
      return {
        statusCode: 410,
        headers,
        body: JSON.stringify({ error: "This license key has expired. Please purchase a new key." }),
      };
    }

    // Activate the key (bind to machine)
    keyData.status = "activated";
    keyData.machineId = machineId;
    keyData.expires = expires;
    keyData.activatedAt = keyData.activatedAt || new Date().toISOString();
    keyData.lastSeen = new Date().toISOString();

    // Save updated key data
    await store.set(keyNorm, JSON.stringify(keyData));

    // Create signed activation token
    const signature = hmacSign(`${keyNorm}:${machineId}:${expires}`, secret);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        key: keyNorm,
        machineId,
        expires,
        plan: keyData.plan,
        signature,
      }),
    };
  } catch (err) {
    console.error("Activation error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Activation failed. Please try again." }),
    };
  }
};
