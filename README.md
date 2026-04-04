<p align="center">
  <img src="https://img.shields.io/badge/YQArch-684_Commands-blue?style=for-the-badge" alt="684 Commands">
  <img src="https://img.shields.io/badge/MCP-v2024--11--05-green?style=for-the-badge" alt="MCP Protocol">
  <img src="https://img.shields.io/badge/AutoCAD-2000%2B-red?style=for-the-badge" alt="AutoCAD">
  <img src="https://img.shields.io/badge/Node.js-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

# yqarch-mcp

**MCP server that gives Claude full control of YQArch (源泉设计) — the 684-command Chinese architectural plugin for AutoCAD.**

> Draw walls, insert doors/windows, place columns, create stairs, auto-dimension, manage layers, hatch materials — all through natural language via Claude.

---

## How it works

```
┌─────────────┐     stdio/JSON-RPC      ┌──────────────┐     file IPC (C:\temp\)     ┌──────────────┐
│   Claude     │ ◄──────────────────────► │  yqarch-mcp  │ ◄────────────────────────► │   AutoCAD    │
│  (Desktop /  │    MCP Protocol          │  (Node.js)   │   yqarch_mcp_cmd_*.json    │  + YQArch    │
│   CLI)       │                          │  55 tools     │   yqarch_mcp_result_*.json │  (684 cmds)  │
└─────────────┘                          └──────────────┘                             └──────────────┘
```

1. **Claude** calls an MCP tool (e.g., `yq_wall` with thickness + points)
2. **yqarch-mcp** writes a command JSON file to `C:\temp\`
3. **LISP bridge** in AutoCAD reads the file, executes the YQ command, writes result
4. **yqarch-mcp** polls for the result and returns it to Claude

---

## Features

| Category | Typed Tools | All Commands | Examples |
|----------|:-----------:|:------------:|---------|
| **Walls** | 8 | 22 | `yq_wall`, `yq_partitionwall`, `yq_curtainwall` |
| **Doors & Windows** | 6 | 34 | `yq_door`, `yq_window`, `yq_glass_partition` |
| **Columns** | 6 | 9 | `yq_r_column`, `yq_c_column`, `yq_l_column` |
| **Stairs** | 6 | 8 | `yq_staircase_plan`, `yq_lift_plan`, `yq_banister` |
| **Dimensions** | 8 | 58 | `yq_dim_auto`, `yq_gridaxis`, `yq_dim_linear` |
| **Layers** | 9 | 35 | `yq_layer_new`, `yq_layer_iso`, `yq_layer_rename` |
| **Hatching** | 4 | 26 | `yq_hatch_quick`, `yq_insulation`, `yq_stonetile` |
| **Annotations** | 6 | 48 | `yq_text`, `yq_leader`, `yq_drawingtitle` |
| **+ 14 more categories** | — | 444 | Blocks, Editing, Curves, Viewports, etc. |
| **Generic** | 2 | **684** | `yq_execute` (any cmd), `yq_list_commands` |
| **Total** | **55 tools** | **684 commands** | |

---

## Quick Start

### Prerequisites

- **Windows 10/11** with AutoCAD (2000+)
- **YQArch** (源泉设计) installed and loaded in AutoCAD
- **Node.js** v18+ ([download](https://nodejs.org/))
- **Claude Desktop** or **Claude CLI**

### 1. Install

```bash
git clone https://github.com/xstaar/yqarch-mcp.git
cd yqarch-mcp
npm install
npm run build
```

### 2. Load LISP Bridge in AutoCAD

In the AutoCAD command line:

```
(load "C:/path/to/yqarch-mcp/lisp/yq_mcp_bridge.lsp")
YQMCP-START
```

Or add it to your `acaddoc.lsp` for auto-loading:

```lisp
(if (findfile "C:/path/to/yqarch-mcp/lisp/yq_mcp_bridge.lsp")
    (load "C:/path/to/yqarch-mcp/lisp/yq_mcp_bridge.lsp"))
```

### 3. Configure Claude

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "yqarch": {
      "command": "node",
      "args": ["C:/path/to/yqarch-mcp/dist/index.js"]
    }
  }
}
```

Or for Claude CLI (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "yqarch": {
      "command": "node",
      "args": ["C:/path/to/yqarch-mcp/dist/index.js"]
    }
  }
}
```

### 4. Use it

Just talk to Claude:

> "Dessine un appartement T3 avec un salon de 5x4m, une cuisine de 3x3m, et deux chambres de 3.5x3m. Murs de 200mm. Ajoute les portes, fenêtres et cotation auto."

Claude will use the MCP tools to draw everything in AutoCAD via YQArch.

---

## Tool Reference

### Typed Tools (53)

These have full Zod schemas with parameter validation and descriptions:

<details>
<summary><b>Walls (8)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_wall` | Draw a double-line wall with thickness and points |
| `yq_simple_wall` | Draw a single-line wall |
| `yq_areawall` | Create walls around a closed area |
| `yq_line2wall` | Convert existing lines to walls |
| `yq_wall_chgthk` | Change wall thickness |
| `yq_partitionwall` | Draw a partition wall |
| `yq_curtainwall` | Draw a curtain wall |
| `yq_doubleline` | Draw a double line (foundation beam) |

</details>

<details>
<summary><b>Columns (6)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_r_column` | Rectangular column |
| `yq_c_column` | Circular column |
| `yq_l_column` | L-shaped column |
| `yq_t_column` | T-shaped column |
| `yq_o_column` | Hollow/annular column |
| `yq_axis_column` | Column on grid axis |

</details>

<details>
<summary><b>Doors & Windows (6)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_door` | Insert a door (single, double, sliding, pocket) |
| `yq_window` | Insert a window (fixed, casement, sliding, awning) |
| `yq_windowdoor` | Insert a French door |
| `yq_hole_door` | Punch a door opening in a wall |
| `yq_hole_window` | Punch a window opening in a wall |
| `yq_glass_partition` | Glass partition wall |

</details>

<details>
<summary><b>Stairs (6)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_staircase_plan` | Straight staircase plan |
| `yq_staircase_section` | Staircase section view |
| `yq_arcstair_plan` | Curved staircase plan |
| `yq_lift_plan` | Elevator plan |
| `yq_banister` | Railing / handrail |
| `yq_escalator` | Escalator |

</details>

<details>
<summary><b>Dimensions & Grid (8)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_dim_auto` | Auto-dimension walls and openings |
| `yq_gridaxis` | Structural grid axes |
| `yq_dim_linear` | Linear dimension |
| `yq_dim_aligned` | Aligned dimension |
| `yq_dim_continue` | Continuous dimension chain |
| `yq_dim_baseline` | Baseline dimension |
| `yq_auto_axis_dim` | Auto-dimension grid axes |
| `yq_axisline` | Axis line |

</details>

<details>
<summary><b>Layers (9)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_layer_new` | Create a new layer |
| `yq_layer_current` | Set current layer |
| `yq_layer_off` / `yq_layer_on` | Toggle layer visibility |
| `yq_layer_freeze` / `yq_layer_thaw` | Toggle layer freeze |
| `yq_layer_iso` | Isolate a layer |
| `yq_layer_showall` | Show all layers |
| `yq_layer_rename` | Rename a layer |

</details>

<details>
<summary><b>Hatching & Materials (4)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_hatch_quick` | Quick hatch with pattern |
| `yq_insulation` | Insulation hatch |
| `yq_stonetile` | Stone/tile pattern |
| `yq_woodflooring` | Wood flooring pattern |

</details>

<details>
<summary><b>Annotations & Symbols (6)</b></summary>

| Tool | Description |
|------|-------------|
| `yq_text` | Insert text |
| `yq_leader` | Leader line with text |
| `yq_drawingtitle` | Drawing title block |
| `yq_section_symbol` | Section cut symbol |
| `yq_elevation_marker` | Elevation level marker |
| `yq_entrance_arrow` | Entrance arrow |

</details>

### Generic Tools (2)

| Tool | Description |
|------|-------------|
| `yq_execute` | Execute **any** of the 684 YQArch commands by name |
| `yq_list_commands` | Search and browse all 684 commands by category or keyword |

---

## Architecture

```
yqarch-mcp/
├── src/
│   ├── index.ts              # MCP server entry point (55 tools)
│   ├── ipc.ts                # File-based IPC (atomic write, poll, cleanup)
│   ├── commands.ts           # Registry of all 684 commands in 22 categories
│   └── tools/
│       ├── walls.ts          # Wall operations (8 tools)
│       ├── columns.ts        # Column operations (6 tools)
│       ├── doors.ts          # Door & window operations (6 tools)
│       ├── stairs.ts         # Stair operations (6 tools)
│       ├── dimensions.ts     # Dimension & grid operations (8 tools)
│       ├── layers.ts         # Layer management (9 tools)
│       ├── hatching.ts       # Hatching & materials (4 tools)
│       ├── annotations.ts    # Text, symbols & annotations (6 tools)
│       └── execute.ts        # Generic execute + list commands (2 tools)
├── lisp/
│   └── yq_mcp_bridge.lsp    # AutoCAD LISP bridge (generic dispatcher)
├── dist/                     # Compiled JavaScript (ready to run)
├── package.json
└── tsconfig.json
```

### IPC Protocol

Same file-based protocol as [autocad-mcp](https://github.com/lucas-laza/autocad-mcp):

| Step | File | Direction |
|------|------|-----------|
| 1. Request | `C:\temp\yqarch_mcp_cmd_{id}.json` | Node.js -> LISP |
| 2. Response | `C:\temp\yqarch_mcp_result_{id}.json` | LISP -> Node.js |

All writes are atomic (`.tmp` + rename). Files are cleaned up after each command.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `YQARCH_MCP_IPC_DIR` | `C:/temp` | IPC directory for command/result files |
| `YQARCH_MCP_IPC_TIMEOUT` | `15000` | Timeout in ms for LISP response |
| `YQARCH_LICENSE_KEY` | — | License key (bypasses trial) |

---

## Pricing

<p align="center">
  <img src="https://img.shields.io/badge/24h_Free_Trial-Try_Now-brightgreen?style=for-the-badge" alt="Free Trial">
</p>

yqarch-mcp includes a **24-hour free trial** with full access to all 684 commands. After the trial, a license key is required.

| Plan | Price | Duration | What you get |
|------|-------|----------|-------------|
| **Free Trial** | Free | 24 hours | All 684 commands, all 55 tools |
| **Monthly** | $9.99/mo | 30 days | All features, 1 machine |
| **Yearly** | $79.99/yr | 365 days | All features, 1 machine (save 33%) |
| **Enterprise** | Contact us | Custom | Multiple machines, priority support |

### How to get a license

1. Run `node dist/index.js --license` to get your **Machine ID**
2. Contact me with your **Machine ID** and desired plan (monthly or yearly):

<p align="center">
  <a href="https://t.me/plxarized">
    <img src="https://img.shields.io/badge/Telegram-@plxarized-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram">
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/xstaar">
    <img src="https://img.shields.io/badge/LinkedIn-xstaar-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  &nbsp;
  <a href="https://github.com/xstaar/yqarch-mcp/issues">
    <img src="https://img.shields.io/badge/GitHub-Open_Issue-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Issues">
  </a>
</p>

3. You will receive a license key tied to your machine (format: `YQMCP-XXXXX-XXXXX-XXXXX-XXXXXXXX`)

### Activate your license

```bash
# Get your Machine ID
node dist/index.js --license

# Option 1: Environment variable
set YQARCH_LICENSE_KEY=YQMCP-XXXXX-XXXXX-XXXXX-XXXXXXXX

# Option 2: Save to file
echo YQMCP-XXXXX-XXXXX-XXXXX-XXXXXXXX > %USERPROFILE%\.yqarch-mcp-license
```

### Key renewal

License keys expire after the subscription period (monthly or yearly). When your key expires, reach out on [Telegram](https://t.me/plxarized) or [LinkedIn](https://www.linkedin.com/in/xstaar) for a renewal key. The server will notify you when your key is about to expire.

---

## About YQArch (源泉设计)

[YQArch](http://www.yqarch.cn/) is a comprehensive Chinese architectural CAD plugin for AutoCAD with **684 commands** covering:

- Architectural drawing (walls, doors, windows, columns, stairs)
- Structural grids and dimensioning
- Interior design (furniture, lighting, flooring)
- Layer management and batch operations
- Block management and symbols
- Construction details (steel, pipes, welding)
- Drawing export and batch plotting

This MCP server makes every single one of those commands accessible to Claude AI.

---

## License

MIT License - see [LICENSE](LICENSE)

The software is open source, but a **license key** is required for use beyond the 24-hour trial period.

---

<p align="center">
  <sub>Built with Claude Code | Powered by <a href="https://modelcontextprotocol.io">Model Context Protocol</a></sub>
  <br>
  <sub>Copyright 2026 xstaar. All rights reserved.</sub>
</p>
