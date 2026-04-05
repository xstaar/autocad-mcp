/**
 * Netlify Function: Create Stripe Checkout Session
 *
 * Receives { plan: "monthly"|"yearly", machineId: "24-hex-chars" }
 * Returns { url: "stripe checkout URL" }
 *
 * Required env vars (set in Netlify dashboard):
 *   STRIPE_SECRET_KEY — Stripe secret key (sk_live_... or sk_test_...)
 *   SITE_URL — Your site URL (e.g. https://autocad-mcp.netlify.app)
 *   LICENSE_SECRET — Same secret used in the MCP server for key generation
 */

const crypto = require("crypto");

const PLANS = {
  monthly: {
    name: "autocad-mcp Monthly License",
    price: 999, // $9.99 in cents
    duration: 30,
  },
  yearly: {
    name: "autocad-mcp Yearly License",
    price: 7999, // $79.99 in cents
    duration: 365,
  },
};

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": process.env.SITE_URL || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { plan, machineId } = JSON.parse(event.body);

    // Validate inputs
    if (!plan || !PLANS[plan]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid plan. Use 'monthly' or 'yearly'." }) };
    }

    if (!machineId || !/^[a-f0-9]{24}$/.test(machineId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid Machine ID format." }) };
    }

    // Rate limiting: simple check via header (Netlify handles DDoS at edge)
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const planInfo = PLANS[plan];
    const siteUrl = process.env.SITE_URL || "https://autocad-mcp.netlify.app";

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      billing_address_collection: "required",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planInfo.name,
              description: `License key for autocad-mcp (${plan} - ${planInfo.duration} days). Machine ID: ${machineId}`,
            },
            unit_amount: planInfo.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        machineId: machineId,
        plan: plan,
        duration: planInfo.duration.toString(),
      },
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#pricing`,
      // Stripe auto-sends receipt email
      payment_intent_data: {
        metadata: {
          machineId: machineId,
          plan: plan,
        },
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Checkout error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to create checkout session. Please try again." }),
    };
  }
};
