/**
 * Netlify Function: Get License Key after payment
 *
 * Called from success.html with ?session_id=cs_xxx
 * Verifies payment was successful, generates license key, returns it.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   LICENSE_SECRET — must match the secret in the MCP server
 */

const crypto = require("crypto");

function hashString(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function formatExpiry(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function generateLicenseKey(machineId, durationDays, secret) {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + durationDays);

  const expiryStr = formatExpiry(expiry);
  const raw = hashString(`${secret}:${machineId}:${expiryStr}`);

  return {
    key: [
      "ACMCP",
      raw.slice(0, 5).toUpperCase(),
      raw.slice(5, 10).toUpperCase(),
      raw.slice(10, 15).toUpperCase(),
      expiryStr,
    ].join("-"),
    expires: expiry.toISOString().slice(0, 10),
  };
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.SITE_URL || "*",
    "Content-Type": "application/json",
  };

  // Only GET
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const sessionId = event.queryStringParameters?.session_id;
  if (!sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing session_id" }) };
  }

  // Validate session_id format (prevent injection)
  if (!/^cs_[a-zA-Z0-9_]{10,200}$/.test(sessionId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid session ID format" }) };
  }

  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      return {
        statusCode: 402,
        headers,
        body: JSON.stringify({ error: "Payment not completed. Please complete payment first." }),
      };
    }

    // Extract metadata
    const machineId = session.metadata?.machineId;
    const plan = session.metadata?.plan || "monthly";
    const duration = parseInt(session.metadata?.duration || "30", 10);

    if (!machineId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Machine ID not found in session. Contact support." }),
      };
    }

    // Generate license key
    const secret = process.env.LICENSE_SECRET;
    if (!secret) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server configuration error. Contact support." }),
      };
    }

    const { key, expires } = generateLicenseKey(machineId, duration, secret);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        licenseKey: key,
        machineId: machineId,
        plan: plan,
        expires: expires,
        orderId: session.payment_intent?.id?.slice(0, 16) || sessionId.slice(0, 16),
      }),
    };
  } catch (err) {
    console.error("Get key error:", err);

    if (err.type === "StripeInvalidRequestError") {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Session not found. It may have expired." }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to retrieve license key. Contact support." }),
    };
  }
};
