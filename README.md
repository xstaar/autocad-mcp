<p align="center">
  <img src="https://img.shields.io/badge/Claude_AI-MCP_Server-blueviolet?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude AI">
  <img src="https://img.shields.io/badge/AutoCAD-684_Commands-blue?style=for-the-badge" alt="684 Commands">
  <img src="https://img.shields.io/badge/55_Tools-MCP_Protocol-green?style=for-the-badge" alt="55 Tools">
  <img src="https://img.shields.io/badge/TypeScript-Node.js-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<h1 align="center">autocad-mcp</h1>

<p align="center">
  <strong>The most complete MCP server for AutoCAD architectural design.</strong><br>
  684 commands. 55 tools. Powered by Claude AI.
</p>

<p align="center">
  <em>Tell Claude what to draw. It handles the rest.</em>
</p>

---

## What is this?

**autocad-mcp** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that connects **Claude AI** directly to **AutoCAD**. It gives Claude the ability to execute 684 architectural design commands — walls, doors, windows, columns, stairs, dimensions, layers, hatching, annotations, and more.

Instead of clicking through menus, you just describe what you want:

> *"Draw a 3-bedroom apartment. 200mm exterior walls, 100mm partitions. Add doors, windows, and auto-dimension everything."*

Claude does the rest.

### Requirements

- **[Claude Pro/Max](https://claude.ai)** recommended for best results (more tool calls, longer context)
- **Claude Desktop** or **Claude Code** (MCP host)
- **AutoCAD** 2000+ on Windows
- **Node.js** v18+

---

## How it works

```
┌─────────────────┐                    ┌──────────────┐                    ┌──────────────┐
│   Claude AI     │   MCP Protocol     │  autocad-mcp │   File IPC         │   AutoCAD    │
│   (Desktop /    │ ◄────────────────► │  (Node.js)   │ ◄───────────────► │              │
│    Code)        │   55 tools         │  684 commands │   C:\temp\*.json   │  Arch Plugin │
└─────────────────┘                    └──────────────┘                    └──────────────┘
```

1. You tell **Claude** what to draw in natural language
2. Claude picks the right MCP tools and calls **autocad-mcp**
3. autocad-mcp writes command files to `C:\temp\`
4. The **LISP bridge** in AutoCAD executes them and writes results back
5. Claude reads the results and continues — iterating until your drawing is complete

Everything happens in seconds. No manual intervention needed.

---

## 684 Commands across 22 Categories

| Category | Tools | Commands | Examples |
|----------|:-----:|:--------:|---------|
| **Walls** | 8 | 22 | Double-line, partition, curtain walls |
| **Doors & Windows** | 6 | 34 | Single, double, sliding, French doors |
| **Columns** | 6 | 9 | Rectangular, circular, L, T, hollow |
| **Stairs & Elevators** | 6 | 8 | Straight, curved, escalators, lifts |
| **Dimensions & Grids** | 8 | 58 | Auto-dim, linear, aligned, grid axes |
| **Layer Management** | 9 | 35 | Create, freeze, isolate, rename |
| **Hatching & Materials** | 4 | 26 | Stone, wood, insulation patterns |
| **Annotations** | 6 | 48 | Text, leaders, title blocks, symbols |
| **+ 14 more categories** | -- | 444 | Blocks, editing, curves, viewports... |
| **Total** | **55 tools** | **684 commands** | |

Plus 2 generic tools:
- `yq_execute` — run **any** of the 684 commands by name
- `yq_list_commands` — search and browse all commands by category

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/xstaar/autocad-mcp.git
cd autocad-mcp
npm install && npm run build
```

### 2. Load LISP Bridge in AutoCAD

```
(load "C:/path/to/autocad-mcp/lisp/acad_mcp_bridge.lsp")
YQMCP-START
```

### 3. Configure Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "autocad": {
      "command": "node",
      "args": ["C:/path/to/autocad-mcp/dist/index.js"],
      "env": {
        "ACAD_LICENSE_KEY": "YOUR-KEY-HERE"
      }
    }
  }
}
```

### 4. Talk to Claude

> *"Create a structural grid 6x4m, place columns at every intersection, draw 200mm walls between them, add a main entrance door and 4 windows."*

Claude will execute the commands in AutoCAD through autocad-mcp.

---

## Licensing

<p align="center">
  <img src="https://img.shields.io/badge/24h_Free_Trial-brightgreen?style=for-the-badge" alt="Free Trial">
</p>

| Plan | Price | Duration |
|------|-------|----------|
| **Free Trial** | Free | 24 hours, all features |
| **Monthly** | $9.99 | 30 days |
| **Yearly** | $79.99 | 365 days (save 33%) |

### How it works

1. Set your license key: `set ACAD_LICENSE_KEY=ACMCP-XXXXX-XXXXX-XXXXX-XXXXX`
2. Restart the server — your key **auto-locks to your machine**
3. One key = one machine. No exceptions.

Keys are validated through our activation server. Even with full source code access, license tokens cannot be forged — the signing key is server-side only.

### Get a license

<p align="center">
  <a href="https://t.me/plxarized">
    <img src="https://img.shields.io/badge/Telegram-@plxarized-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram">
  </a>
  &nbsp;
  <a href="https://github.com/xstaar/autocad-mcp/issues">
    <img src="https://img.shields.io/badge/GitHub-Open_Issue-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

**Accepted payments:** PayPal, cryptocurrency (BTC, ETH, SOL, USDT, and more).

---

## Why Claude Pro / Max?

This MCP server works with any Claude plan, but **Claude Pro or Max** is strongly recommended:

- **More tool calls per conversation** — architectural drawings need many sequential commands
- **Longer context window** — Claude can plan complex multi-room layouts in one go
- **Priority access** — no rate limits interrupting your workflow
- **Extended thinking** — better spatial reasoning for complex floor plans

With Claude Free, you'll hit tool call limits quickly. With Pro/Max, Claude can design and draw an entire building floor plan in a single conversation.

---

## Architecture

```
autocad-mcp/
├── src/
│   ├── index.ts          # MCP server (55 tools registered)
│   ├── ipc.ts            # File-based IPC with AutoCAD
│   ├── license.ts        # Server-side activation system
│   ├── commands.ts        # Registry of all 684 commands
│   └── tools/            # Typed tool implementations
├── lisp/
│   └── acad_mcp_bridge.lsp  # AutoCAD LISP dispatcher
├── website/              # Landing page + activation API
└── dist/                 # Compiled + obfuscated output
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ACAD_LICENSE_KEY` | Your license key |
| `ACAD_MCP_IPC_DIR` | IPC directory (default: `C:/temp`) |
| `ACAD_MCP_IPC_TIMEOUT` | Response timeout in ms (default: `15000`) |

---

## License

Proprietary Software. Source provided for transparency. See [LICENSE](LICENSE).

---

<p align="center">
  <sub>An MCP server for <a href="https://claude.ai">Claude AI</a> | Powered by <a href="https://modelcontextprotocol.io">Model Context Protocol</a></sub>
</p>
