<p align="center">
  <img src="https://img.shields.io/badge/AutoCAD-684_Commands-blue?style=for-the-badge" alt="684 Commands">
  <img src="https://img.shields.io/badge/MCP-Protocol-green?style=for-the-badge" alt="MCP Protocol">
  <img src="https://img.shields.io/badge/AutoCAD-2000%2B-red?style=for-the-badge" alt="AutoCAD">
  <img src="https://img.shields.io/badge/TypeScript-Node.js-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

# autocad-mcp

**MCP server that gives Claude AI full control of AutoCAD for architectural design — 684 commands, 55 tools.**

> Draw walls, insert doors/windows, place columns, create stairs, auto-dimension, manage layers, hatch materials — all through natural language via Claude.

---

## How it works

```
┌─────────────┐     stdio/JSON-RPC      ┌──────────────┐     file IPC (C:\temp\)     ┌──────────────┐
│   Claude     │ ◄──────────────────────► │  autocad-mcp │ ◄────────────────────────► │   AutoCAD    │
│  (Desktop /  │    MCP Protocol          │  (Node.js)   │   acad_mcp_cmd_*.json      │  Arch Plugin │
│   CLI)       │                          │  55 tools     │   acad_mcp_result_*.json   │  (684 cmds)  │
└─────────────┘                          └──────────────┘                             └──────────────┘
```

1. **Claude** calls an MCP tool (e.g., `yq_wall` with thickness + points)
2. **autocad-mcp** writes a command JSON file to `C:\temp\`
3. **LISP bridge** in AutoCAD reads the file, executes the command, writes result
4. **autocad-mcp** polls for the result and returns it to Claude

---

## Features

| Category | Tools | Commands | Examples |
|----------|:-----:|:--------:|---------|
| **Walls** | 8 | 22 | `yq_wall`, `yq_partitionwall`, `yq_curtainwall` |
| **Doors & Windows** | 6 | 34 | `yq_door`, `yq_window`, `yq_glass_partition` |
| **Columns** | 6 | 9 | `yq_r_column`, `yq_c_column`, `yq_l_column` |
| **Stairs** | 6 | 8 | `yq_staircase_plan`, `yq_lift_plan`, `yq_banister` |
| **Dimensions** | 8 | 58 | `yq_dim_auto`, `yq_gridaxis`, `yq_dim_linear` |
| **Layers** | 9 | 35 | `yq_layer_new`, `yq_layer_iso`, `yq_layer_rename` |
| **Hatching** | 4 | 26 | `yq_hatch_quick`, `yq_insulation`, `yq_stonetile` |
| **Annotations** | 6 | 48 | `yq_text`, `yq_leader`, `yq_drawingtitle` |
| **+ 14 categories** | -- | 444 | Blocks, Editing, Curves, Viewports, etc. |
| **Generic** | 2 | **684** | `yq_execute` (any cmd), `yq_list_commands` |
| **Total** | **55** | **684** | |

---

## Quick Start

### Prerequisites

- **Windows 10/11** with AutoCAD (2000+)
- **Node.js** v18+
- **Claude Desktop** or **Claude CLI**

### Install

```bash
git clone https://github.com/xstaar/autocad-mcp.git
cd autocad-mcp
npm install
npm run build
```

### Load LISP Bridge in AutoCAD

```
(load "C:/path/to/autocad-mcp/lisp/acad_mcp_bridge.lsp")
YQMCP-START
```

### Configure Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "autocad": {
      "command": "node",
      "args": ["C:/path/to/autocad-mcp/dist/index.js"],
      "env": {
        "ACAD_LICENSE_KEY": "ACMCP-XXXXX-XXXXX-XXXXX-XXXXX"
      }
    }
  }
}
```

### Use it

Just talk to Claude:

> "Draw a 3-bedroom apartment with 200mm walls, doors, windows and auto-dimensions."

---

## Pricing

<p align="center">
  <img src="https://img.shields.io/badge/24h_Free_Trial-brightgreen?style=for-the-badge" alt="Free Trial">
</p>

| Plan | Price | Duration |
|------|-------|----------|
| **Free Trial** | Free | 24 hours |
| **Monthly** | $9.99/mo | 30 days |
| **Yearly** | $79.99/yr | 365 days (save 33%) |

### Get a license

Contact me with your desired plan. You'll receive a key that activates automatically on your machine — no setup, no device IDs.

<p align="center">
  <a href="https://t.me/plxarized">
    <img src="https://img.shields.io/badge/Telegram-@plxarized-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram">
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/mohamedaminehaddach">
    <img src="https://img.shields.io/badge/LinkedIn-Mohamed_Amine-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  &nbsp;
  <a href="mailto:haddach.omteq@gmail.com">
    <img src="https://img.shields.io/badge/Email-haddach.omteq-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
</p>

**Accepted payments:** PayPal ([paypal.me/haddachdev](https://www.paypal.com/paypalme/haddachdev)) and cryptocurrency.

### Activate

```bash
set ACAD_LICENSE_KEY=ACMCP-XXXXX-XXXXX-XXXXX-XXXXX
```

That's it. The key locks to your machine on first use. One key = one machine.

---

## How licensing works

```
┌──────────┐      key + fingerprint      ┌───────────────────┐
│  Your PC │  ────────────────────────►  │ Activation Server │
│          │  ◄────────────────────────  │ (Netlify)         │
│          │      signed token            │                   │
└──────────┘                             └───────────────────┘
     │                                          │
     │  Token stored locally                    │  Key bound to
     │  for offline use                         │  your machine
     ▼                                          ▼
  Works offline                           Can't reuse on
  after activation                        another device
```

- **First launch**: Key is sent to the activation server with your machine fingerprint
- **Server binds** the key to your machine and returns a signed token
- **After activation**: Everything works offline — no internet needed
- **Another machine?** Server rejects it. One key = one machine. No exceptions.

The activation server is the single source of truth. Even with full access to this code, valid license tokens **cannot** be generated without the server's signing key.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ACAD_LICENSE_KEY` | Your license key |
| `ACAD_MCP_IPC_DIR` | IPC directory (default: `C:/temp`) |
| `ACAD_MCP_IPC_TIMEOUT` | LISP response timeout in ms (default: `15000`) |

---

## License

Proprietary Software - All Rights Reserved

Copyright 2026 Mohamed Amine Haddach. The source code is provided for transparency. A valid license key and activation are required for use beyond the trial period. Unauthorized redistribution, modification for license bypass, or reverse engineering of the activation system is prohibited.

---

<p align="center">
  <sub>Powered by <a href="https://modelcontextprotocol.io">Model Context Protocol</a></sub>
  <br>
  <sub>Copyright 2026 Mohamed Amine Haddach. All rights reserved.</sub>
</p>
