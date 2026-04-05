# Deploying autocad-mcp Website to Netlify

## Prerequisites

1. A [Stripe](https://stripe.com) account (for payments)
2. A [Netlify](https://netlify.com) account (for hosting)

## Step 1: Set up Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your **Secret Key** from Developers > API keys
   - Use `sk_test_...` for testing, `sk_live_...` for production
3. Note: No Stripe Products need to be created — they're created dynamically

## Step 2: Deploy to Netlify

### Option A: Deploy via GitHub (recommended)

1. Push the `website/` folder to a GitHub repo (can be the same or separate)
2. Go to [Netlify](https://app.netlify.com) > Add new site > Import from Git
3. Set **Base directory** to `website`
4. Set **Publish directory** to `website`
5. Click Deploy

### Option B: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# From the website/ directory
cd website
npm install
netlify deploy --prod --dir=.
```

## Step 3: Set Environment Variables

In Netlify Dashboard > Site settings > Environment variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Your Stripe secret key |
| `LICENSE_SECRET` | `acad-mcp-2026-claude` | **Must match** the secret in your MCP server's license.ts |
| `SITE_URL` | `https://your-site.netlify.app` | Your Netlify site URL |

**IMPORTANT**: The `LICENSE_SECRET` must be the EXACT same value used in `src/license.ts`.
If you changed it via env var `ACAD_LICENSE_SECRET`, use that value here too.

## Step 4: Test

1. Go to your site URL
2. Enter a Machine ID (24 hex chars)
3. Click Buy — should redirect to Stripe Checkout (test mode)
4. Use Stripe test card: `4242 4242 4242 4242`, any future date, any CVC
5. After payment, you should see the license key on the success page

## Step 5: Go Live

1. Switch from `sk_test_...` to `sk_live_...` in Netlify env vars
2. Redeploy

## Security Notes

- All payment processing happens on Stripe's servers (PCI compliant)
- No credit card data touches your server
- License keys are generated server-side in Netlify Functions
- HTTPS is automatic on Netlify
- CSP headers prevent XSS attacks
- CORS is restricted to your site URL
- Session IDs are validated before key generation
