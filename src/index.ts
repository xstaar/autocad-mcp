#!/usr/bin/env node
/**
 * autocad-mcp — MCP server for AutoCAD architectural design.
 *
 * Exposes ALL 684 architectural commands via:
 *   - ~35 typed tools for the most common architectural operations
 *   - yq_execute: generic tool to run ANY of the 684 commands
 *   - yq_list_commands: discover commands by category or keyword
 *
 * IPC: file-based JSON in C:\temp\ (same protocol as autocad-mcp).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IpcResponse } from "./ipc.js";
import { validateLicense, printLicenseInfo, printStockKeys, activateOwnerKey, tryActivateKey, LicenseStatus } from "./license.js";

// ── License check (runs on every tool call) ──
let licenseStatus: LicenseStatus;

function checkLicense(): boolean {
  licenseStatus = validateLicense();
  return licenseStatus.valid;
}

function licenseDenied() {
  return {
    content: [{
      type: "text" as const,
      text: `ACCESS DENIED - License required\n\n${licenseStatus.message}\n\n` +
        `Purchase: https://github.com/xstaar/autocad-mcp#pricing`,
    }],
    isError: true,
  };
}

// Typed tools
import * as walls from "./tools/walls.js";
import * as columns from "./tools/columns.js";
import * as doors from "./tools/doors.js";
import * as stairs from "./tools/stairs.js";
import * as dimensions from "./tools/dimensions.js";
import * as layers from "./tools/layers.js";
import * as hatching from "./tools/hatching.js";
import * as annotations from "./tools/annotations.js";

// Generic tools
import {
  yqExecuteSchema, handleYqExecute,
  yqListCommandsSchema, handleYqListCommands,
} from "./tools/execute.js";

const server = new McpServer({
  name: "autocad-mcp",
  version: "2.0.0",
});

// ── Helpers ──

function fmt(result: IpcResponse) {
  if (!result.ok) {
    return {
      content: [{ type: "text" as const, text: `Error: ${result.error || "Command failed"}` }],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result.payload, null, 2) }],
  };
}

function fmtLocal(result: { ok: boolean; payload: unknown; error?: string }) {
  if (!result.ok) {
    return {
      content: [{ type: "text" as const, text: `Error: ${result.error || "Failed"}` }],
      isError: true,
    };
  }
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result.payload, null, 2) }],
  };
}

function err(e: unknown) {
  return {
    content: [{ type: "text" as const, text: `IPC Error: ${e instanceof Error ? e.message : "Unknown"}` }],
    isError: true,
  };
}

// Helper to register a tool concisely (with license gate)
function reg(
  name: string,
  desc: string,
  schema: Record<string, unknown>,
  handler: (args: Record<string, unknown>) => Promise<IpcResponse>
) {
  server.tool(name, desc, schema, async (args: Record<string, unknown>) => {
    if (!checkLicense()) return licenseDenied();
    try { return fmt(await handler(args)); } catch (e) { return err(e); }
  });
}

// ══════════════════════════════════════════════════════════
//  WALLS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_wall", "Draw a double-line wall", walls.yqWallSchema, walls.handleYqWall);
reg("yq_simple_wall", "Draw a single-line wall", walls.yqSimpleWallSchema, walls.handleYqSimpleWall);
reg("yq_areawall", "Create wall from closed area/region", walls.yqAreawallSchema, walls.handleYqAreawall);
reg("yq_line2wall", "Convert an existing line to a wall", walls.yqLine2wallSchema, walls.handleYqLine2wall);
reg("yq_wall_chgthk", "Change thickness of an existing wall", walls.yqWallChgthkSchema, walls.handleYqWallChgthk);
reg("yq_partitionwall", "Draw a partition wall", walls.yqPartitionwallSchema, walls.handleYqPartitionwall);
reg("yq_curtainwall", "Draw a curtain wall", walls.yqCurtainwallSchema, walls.handleYqCurtainwall);
reg("yq_doubleline", "Draw a double line (beam/foundation)", walls.yqDoublelineSchema, walls.handleYqDoubleline);

// ══════════════════════════════════════════════════════════
//  COLUMNS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_r_column", "Insert rectangular column", columns.yqRColumnSchema, columns.handleYqRColumn);
reg("yq_c_column", "Insert circular column", columns.yqCColumnSchema, columns.handleYqCColumn);
reg("yq_l_column", "Insert L-shaped column", columns.yqLColumnSchema, columns.handleYqLColumn);
reg("yq_t_column", "Insert T-shaped column", columns.yqTColumnSchema, columns.handleYqTColumn);
reg("yq_o_column", "Insert hollow/annular column", columns.yqOColumnSchema, columns.handleYqOColumn);
reg("yq_axis_column", "Place column on structural grid axis", columns.yqAxisColumnSchema, columns.handleYqAxisColumn);

// ══════════════════════════════════════════════════════════
//  DOORS & WINDOWS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_door", "Insert a door in a wall", doors.yqDoorSchema, doors.handleYqDoor);
reg("yq_window", "Insert a window in a wall", doors.yqWindowSchema, doors.handleYqWindow);
reg("yq_windowdoor", "Insert a window-door (french door)", doors.yqWindowdoorSchema, doors.handleYqWindowdoor);
reg("yq_hole_door", "Cut a door opening in a wall", doors.yqHoleDoorSchema, doors.handleYqHoleDoor);
reg("yq_hole_window", "Cut a window opening in a wall", doors.yqHoleWindowSchema, doors.handleYqHoleWindow);
reg("yq_glass_partition", "Insert a glass partition", doors.yqGlassPartitionSchema, doors.handleYqGlassPartition);

// ══════════════════════════════════════════════════════════
//  STAIRS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_staircase_plan", "Draw straight staircase plan", stairs.yqStaircasePlanSchema, stairs.handleYqStaircasePlan);
reg("yq_staircase_section", "Draw staircase section view", stairs.yqStaircaseSectionSchema, stairs.handleYqStaircaseSection);
reg("yq_arcstair_plan", "Draw curved staircase plan", stairs.yqArcstairPlanSchema, stairs.handleYqArcstairPlan);
reg("yq_lift_plan", "Draw elevator/lift plan", stairs.yqLiftPlanSchema, stairs.handleYqLiftPlan);
reg("yq_banister", "Draw railing/handrail", stairs.yqBanisterSchema, stairs.handleYqBanister);
reg("yq_escalator", "Draw escalator", {}, stairs.handleYqEscalator);

// ══════════════════════════════════════════════════════════
//  DIMENSIONS & GRIDS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_dim_auto", "Auto-dimension walls and openings", dimensions.yqDimAutoSchema, dimensions.handleYqDimAuto);
reg("yq_gridaxis", "Create structural grid axis system", dimensions.yqGridaxisSchema, dimensions.handleYqGridaxis);
reg("yq_dim_linear", "Linear dimension between 2 points", dimensions.yqDimLinearSchema, dimensions.handleYqDimLinear);
reg("yq_dim_aligned", "Aligned dimension between 2 points", dimensions.yqDimAlignedSchema, dimensions.handleYqDimAligned);
reg("yq_dim_continue", "Continue dimension chain", dimensions.yqDimContinueSchema, dimensions.handleYqDimContinue);
reg("yq_dim_baseline", "Baseline dimension from reference", dimensions.yqDimBaselineSchema, dimensions.handleYqDimBaseline);
reg("yq_auto_axis_dim", "Auto-dimension grid axes", dimensions.yqAutoAxisDimSchema, dimensions.handleYqAutoAxisDim);
reg("yq_axisline", "Draw axis line", dimensions.yqAxislinesSchema, dimensions.handleYqAxisline);

// ══════════════════════════════════════════════════════════
//  LAYERS (9 tools)
// ══════════════════════════════════════════════════════════

reg("yq_layer_new", "Create a new layer", layers.yqLayerNewSchema, layers.handleYqLayerNew);
reg("yq_layer_current", "Set the current/active layer", layers.yqLayerCurrentSchema, layers.handleYqLayerCurrent);
reg("yq_layer_off", "Turn off a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerOff);
reg("yq_layer_on", "Turn on a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerOn);
reg("yq_layer_freeze", "Freeze a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerFreeze);
reg("yq_layer_thaw", "Thaw a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerThaw);
reg("yq_layer_iso", "Isolate a layer (turn off all others)", layers.yqLayerOnOffSchema, layers.handleYqLayerIso);
reg("yq_layer_showall", "Show all layers", {}, layers.handleYqLayerShowall);
reg("yq_layer_rename", "Rename a layer", layers.yqLayerRenameSchema, layers.handleYqLayerRename);

// ══════════════════════════════════════════════════════════
//  HATCHING & MATERIALS (4 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hatch_quick", "Quick hatch fill", hatching.yqHatchQuickSchema, hatching.handleYqHatchQuick);
reg("yq_insulation", "Insulation hatch pattern", hatching.yqInsulationSchema, hatching.handleYqInsulation);
reg("yq_stonetile", "Stone tile pattern", hatching.yqStonetileSchema, hatching.handleYqStonetile);
reg("yq_woodflooring", "Wood flooring pattern", hatching.yqWoodflooringSchema, hatching.handleYqWoodflooring);

// ══════════════════════════════════════════════════════════
//  ANNOTATIONS & SYMBOLS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_text", "Insert text annotation", annotations.yqTextSchema, annotations.handleYqText);
reg("yq_leader", "Insert leader line with text", annotations.yqLeaderSchema, annotations.handleYqLeader);
reg("yq_drawingtitle", "Insert title block", annotations.yqDrawingtitleSchema, annotations.handleYqDrawingtitle);
reg("yq_section_symbol", "Insert section cut symbol", annotations.yqSymbolSectioncutterSchema, annotations.handleYqSymbolSectioncutter);
reg("yq_elevation_marker", "Insert elevation level marker", annotations.yqElevindexerSchema, annotations.handleYqElevindexer);
reg("yq_entrance_arrow", "Insert entrance arrow", annotations.yqEntrancearrowSchema, annotations.handleYqEntrancearrow);

// ══════════════════════════════════════════════════════════
//  GENERIC TOOLS (2 tools) — access to ALL 684 commands
// ══════════════════════════════════════════════════════════

// yq_execute: run any command
server.tool(
  "yq_execute",
  "Execute any of the 684 architectural commands by name. " +
  "Use yq_list_commands to discover available commands by category.",
  yqExecuteSchema,
  async (args: Record<string, unknown>) => {
    if (!checkLicense()) return licenseDenied();
    try {
      const result = await handleYqExecute(args as { command: string; params?: Record<string, unknown> });
      return fmt(result);
    } catch (e) {
      return err(e);
    }
  }
);

// yq_list_commands: discover commands
server.tool(
  "yq_list_commands",
  "List and search the 684 available architectural commands. " +
  "Filter by category (walls, doors_windows, columns, stairs, dimensions, " +
  "grid_axes, hatching, layers, blocks, text, editing, curves, viewports, etc.) " +
  "or search by keyword.",
  yqListCommandsSchema,
  async (args: Record<string, unknown>) => {
    const result = handleYqListCommands(args as { category?: string; search?: string });
    return fmtLocal(result);
  }
);

// ── Start ──

async function main() {
  // Handle --license flag to show license info
  if (process.argv.includes("--license")) {
    printLicenseInfo();
    process.exit(0);
  }

  // Handle --generate-stock for batch key generation
  const stockIdx = process.argv.indexOf("--generate-stock");
  if (stockIdx !== -1) {
    const plan = (process.argv[stockIdx + 1] || "monthly") as "monthly" | "yearly" | "permanent";
    const count = parseInt(process.argv[stockIdx + 2] || "10", 10);
    printStockKeys(plan, count);
    process.exit(0);
  }

  // Handle --owner to activate permanent owner license (requires ACAD_OWNER_KEY env var)
  if (process.argv.includes("--owner")) {
    if (!process.env.ACAD_OWNER_KEY) {
      console.error("Owner activation requires ACAD_OWNER_KEY environment variable.");
      process.exit(1);
    }
    activateOwnerKey();
    process.exit(0);
  }

  // Validate license on startup
  licenseStatus = validateLicense();
  console.error(`autocad-mcp v2.0.0 — 684 commands, 55 MCP tools`);

  // If key needs activation, try it now
  if (licenseStatus.needsActivation && licenseStatus.key) {
    licenseStatus = await tryActivateKey(licenseStatus.key);
  }

  console.error(`License: ${licenseStatus.message.split("\n")[0]}`);

  if (!licenseStatus.valid) {
    console.error("\n" + licenseStatus.message);
    console.error("Server will start but all tools will require a license.");
    console.error('Run with --license flag for info.\n');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
