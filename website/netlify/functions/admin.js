/**
 * Netlify Function: Admin API for key stock management
 *
 * All admin endpoints require Authorization header with ADMIN_PASSWORD env var.
 *
 * GET  /admin?action=stock          — View all keys and their status
 * GET  /admin?action=stats          — Stock statistics
 * POST /admin { action: "add", keys: [...], plan: "monthly"|"yearly" }  — Add keys to stock
 * POST /admin { action: "revoke", key: "ACMCP-..." }  — Revoke a key
 *
 * Required env vars:
 *   ADMIN_PASSWORD — password for admin access
 */

const { getStore } = require("@netlify/blobs");

function checkAuth(event) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const auth = event.headers.authorization || event.headers.Authorization || "";
  // Support both "Bearer <password>" and raw password
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  return provided === password;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Auth check
  if (!checkAuth(event)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized. Invalid admin password." }) };
  }

  const store = getStore("license-keys");

  try {
    if (event.httpMethod === "GET") {
      const action = event.queryStringParameters?.action || "stock";

      if (action === "stock" || action === "stats") {
        // List all keys
        const { blobs } = await store.list();
        const allKeys = [];

        for (const blob of blobs) {
          const raw = await store.get(blob.key);
          if (raw) {
            const data = JSON.parse(raw);
            data._key = blob.key;
            allKeys.push(data);
          }
        }

        if (action === "stats") {
          const stats = {
            total: allKeys.length,
            available: { monthly: 0, yearly: 0 },
            activated: { monthly: 0, yearly: 0 },
            expired: 0,
          };

          const now = new Date();
          for (const k of allKeys) {
            const isExpired = k.expires && new Date(k.expires + "T23:59:59") < now;
            if (isExpired) {
              stats.expired++;
            } else if (k.status === "available") {
              stats.available[k.plan] = (stats.available[k.plan] || 0) + 1;
            } else if (k.status === "activated") {
              stats.activated[k.plan] = (stats.activated[k.plan] || 0) + 1;
            }
          }

          return { statusCode: 200, headers, body: JSON.stringify(stats) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ keys: allKeys }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);
      const action = body.action;

      if (action === "add") {
        const keys = body.keys;
        const plan = body.plan || "monthly";

        if (!Array.isArray(keys) || keys.length === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "keys must be a non-empty array" }) };
        }

        if (!["monthly", "yearly", "permanent"].includes(plan)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "plan must be monthly, yearly, or permanent" }) };
        }

        let added = 0;
        for (const key of keys) {
          const keyNorm = key.toUpperCase().trim();
          if (!/^ACMCP-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/.test(keyNorm)) {
            continue; // Skip invalid keys
          }

          // Check if key already exists
          const existing = await store.get(keyNorm);
          if (existing) continue; // Don't overwrite

          await store.set(keyNorm, JSON.stringify({
            key: keyNorm,
            plan,
            status: "available",
            machineId: null,
            expires: null,
            createdAt: new Date().toISOString(),
            activatedAt: null,
            lastSeen: null,
          }));
          added++;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, added, total: keys.length }),
        };
      }

      if (action === "revoke") {
        const keyNorm = (body.key || "").toUpperCase().trim();
        if (!keyNorm) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "key is required" }) };
        }

        const existing = await store.get(keyNorm);
        if (!existing) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Key not found" }) };
        }

        await store.delete(keyNorm);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, revoked: keyNorm }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("Admin error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error" }) };
  }
};
