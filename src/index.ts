#!/usr/bin/env node
/**
 * autocad-mcp — MCP server for AutoCAD architectural design with YQArch plugin.
 *
 * Exposes real YQArch LISP functions as MCP tools:
 *   - ~60 typed tools for walls, doors, windows, columns, stairs, decoration, etc.
 *   - yq_execute: generic tool to run any command by name
 *   - yq_list_commands: discover commands by category or keyword
 *
 * IPC: file-based JSON in C:\temp\ → LISP bridge → YQArch functions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IpcResponse } from "./ipc.js";
import { validateLicense, printLicenseInfo, printStockKeys, activateOwnerKey, tryActivateKey, LicenseStatus } from "./license.js";

// ── License check ──
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

// ── Tool imports ──
import * as walls from "./tools/walls.js";
import * as columns from "./tools/columns.js";
import * as doors from "./tools/doors.js";
import * as stairs from "./tools/stairs.js";
import * as dimensions from "./tools/dimensions.js";
import * as layers from "./tools/layers.js";
import * as hatching from "./tools/hatching.js";
import * as annotations from "./tools/annotations.js";
import {
  yqExecuteSchema, handleYqExecute,
  yqListCommandsSchema, handleYqListCommands,
} from "./tools/execute.js";

const server = new McpServer({
  name: "autocad-mcp",
  version: "3.0.0",
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
//  WALLS (11 tools) — Real YQArch wall functions
// ══════════════════════════════════════════════════════════

reg("yq_wall", "Draw double-line wall (YQArch main wall tool, shortcut: ww). Opens wall dialog in AutoCAD.", walls.yqWallSchema, walls.handleYqWall);
reg("yq_simple_wall", "Draw single-line wall", walls.yqSimpleWallSchema, walls.handleYqSimpleWall);
reg("yq_areawall", "Create wall from closed area/polyline", walls.yqAreawallSchema, walls.handleYqAreawall);
reg("yq_line2wall", "Convert existing lines to double-line walls (shortcut: Xww)", walls.yqLine2wallSchema, walls.handleYqLine2wall);
reg("yq_wall_chgthk", "Change thickness of existing wall (shortcut: wwT)", walls.yqWallChgthkSchema, walls.handleYqWallChgthk);
reg("yq_trim_fix_wall", "Trim/fix wall intersections (shortcut: TW). Auto-cleans wall joints.", walls.yqTrimFixWallSchema, walls.handleYqTrimFixWall);
reg("yq_erase_wall", "Delete wall, column, or door/window (shortcut: EW)", walls.yqEraseWallSchema, walls.handleYqEraseWall);
reg("yq_partitionwall", "Draw partition wall (shortcut: GQ)", walls.yqPartitionwallSchema, walls.handleYqPartitionwall);
reg("yq_curtainwall", "Draw curtain wall elevation (shortcut: MQ)", walls.yqCurtainwallSchema, walls.handleYqCurtainwall);
reg("yq_doubleline", "Draw double line for beam/foundation (shortcut: xd)", walls.yqDoublelineSchema, walls.handleYqDoubleline);
reg("yq_trimdoubleline", "Trim double line intersections (shortcut: TX)", walls.yqTrimDoublelineSchema, walls.handleYqTrimDoubleline);

// ══════════════════════════════════════════════════════════
//  COLUMNS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_r_column", "Insert rectangular column (shortcut: zzR)", columns.yqRColumnSchema, columns.handleYqRColumn);
reg("yq_o_column", "Insert circular column (shortcut: zzC)", columns.yqOColumnSchema, columns.handleYqOColumn);
reg("yq_l_column", "Insert L-shaped column (shortcut: zzL)", columns.yqLColumnSchema, columns.handleYqLColumn);
reg("yq_t_column", "Insert T-shaped column (shortcut: zzT)", columns.yqTColumnSchema, columns.handleYqTColumn);
reg("yq_c_column", "Insert cross/+ shaped column (shortcut: zzX)", columns.yqCColumnSchema, columns.handleYqCColumn);
reg("yq_axis_column", "Place columns on structural grid axes (shortcut: zzBZ)", columns.yqAxisColumnSchema, columns.handleYqAxisColumn);

// ══════════════════════════════════════════════════════════
//  DOORS (10 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hole_door", "Open door on wall — cuts wall and inserts door with swing arc (shortcut: AD). Most common door tool.", doors.yqHoleDoorSchema, doors.handleYqHoleDoor);
reg("yq_door", "Draw a door at free position (shortcut: AD2)", doors.yqDoorSchema, doors.handleYqDoor);
reg("yq_hole_pocketdoor", "Open pocket/sliding door on wall (shortcut: ADT)", doors.yqHolePocketdoorSchema, doors.handleYqHolePocketdoor);
reg("yq_pocketdoor", "Draw pocket door at free position (shortcut: ADT2)", doors.yqPocketdoorSchema, doors.handleYqPocketdoor);
reg("yq_windoor_replace", "Replace door/window type (shortcut: TD)", doors.yqWindoorReplaceSchema, doors.handleYqWindoorReplace);
reg("yq_width_windoor", "Change door/window width (shortcut: CW)", doors.yqWidthWindoorSchema, doors.handleYqWidthWindoor);
reg("yq_move_windoor", "Move door/window along wall (shortcut: VW)", doors.yqMoveWindoorSchema, doors.handleYqMoveWindoor);
reg("yq_overturn", "Flip/overturn door or window opening direction (shortcut: FZ)", doors.yqOverturnSchema, doors.handleYqOverturn);
reg("yq_hole", "Cut hole in wall without inserting door/window (shortcut: HO)", doors.yqHoleSchema, doors.handleYqHole);
reg("yq_repair", "Repair door/window/column display (shortcut: XF)", doors.yqRepairSchema, doors.handleYqRepair);

// ══════════════════════════════════════════════════════════
//  WINDOWS (5 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hole_win", "Open window on wall — cuts wall and inserts window (shortcut: AW). Most common window tool.", doors.yqHoleWinSchema, doors.handleYqHoleWin);
reg("yq_win", "Draw a window at free position (shortcut: AW2)", doors.yqWinSchema, doors.handleYqWin);
reg("yq_hole_window", "Open parametric window on wall (shortcut: WD)", doors.yqHoleWindowSchema, doors.handleYqHoleWindow);
reg("yq_window", "Draw parametric window at free position (shortcut: WD2)", doors.yqWindowSchema, doors.handleYqWindow);
reg("yq_hole_cornerwindow", "Insert corner window on wall (shortcut: WDZ)", doors.yqHoleCornerwindowSchema, doors.handleYqHoleCornerwindow);

// ══════════════════════════════════════════════════════════
//  STAIRS & ELEVATORS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_staircase_plan", "Draw staircase plan view (shortcut: LTJ)", stairs.yqStaircasePlanSchema, stairs.handleYqStaircasePlan);
reg("yq_staircase_section", "Draw staircase section view (shortcut: LTP)", stairs.yqStaircaseSectionSchema, stairs.handleYqStaircaseSection);
reg("yq_arcstair_plan", "Draw arc/curved staircase plan (shortcut: LTA)", stairs.yqArcstairPlanSchema, stairs.handleYqArcstairPlan);
reg("yq_escalator", "Draw escalator (shortcut: LTF)", stairs.yqEscalatorSchema, stairs.handleYqEscalator);
reg("yq_lift_plan", "Draw elevator/lift plan (shortcut: DTJ)", stairs.yqLiftPlanSchema, stairs.handleYqLiftPlan);
reg("yq_banister", "Draw banister/railing (shortcut: LG)", stairs.yqBanisterSchema, stairs.handleYqBanister);

// ══════════════════════════════════════════════════════════
//  DECORATION & INTERIOR (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_autofurniture", "Auto-arrange furniture in room (shortcut: JJ). Detects room boundaries.", hatching.yqAutofurnitureSchema, hatching.handleYqAutofurniture);
reg("yq_arrangewc", "Auto-arrange WC/bathroom fixtures (shortcut: WC)", hatching.yqArrangewcSchema, hatching.handleYqArrangewc);
reg("yq_stonetile", "Apply stone tile floor pattern (shortcut: STB)", hatching.yqStonetileSchema, hatching.handleYqStonetile);
reg("yq_woodflooring", "Apply wood flooring pattern (shortcut: MDB)", hatching.yqWoodflooringSchema, hatching.handleYqWoodflooring);
reg("yq_gypsumboard", "Draw gypsum board ceiling (shortcut: SGB)", hatching.yqGypsumboardSchema, hatching.handleYqGypsumboard);
reg("yq_insulation", "Draw insulation hatch pattern (shortcut: BWM)", hatching.yqInsulationSchema, hatching.handleYqInsulation);
reg("yq_autolamps", "Auto-arrange lamps/lighting (shortcut: DJ)", hatching.yqAutolampsSchema, hatching.handleYqAutolamps);
reg("yq_glass_partition", "Insert glass partition wall (shortcut: MQS)", doors.yqGlassPartitionSchema, doors.handleYqGlassPartition);

// ══════════════════════════════════════════════════════════
//  GRID & AXES (4 tools)
// ══════════════════════════════════════════════════════════

reg("yq_gridaxis", "Draw structural grid axis system (shortcut: zxw)", dimensions.yqGridaxisSchema, dimensions.handleYqGridaxis);
reg("yq_axisline", "Draw single axis line (shortcut: ax)", dimensions.yqAxislinesSchema, dimensions.handleYqAxisline);
reg("yq_auto_axis_dim", "Auto-dimension all grid axes (shortcut: aZH). One-click axis dimensioning.", dimensions.yqAutoAxisDimSchema, dimensions.handleYqAutoAxisDim);
reg("yq_symbol_axis_c", "Draw axis circle symbols (shortcut: ZH)", dimensions.yqSymbolAxisSchema, dimensions.handleYqSymbolAxis);

// ══════════════════════════════════════════════════════════
//  DIMENSIONS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_dim_linear", "Linear dimension between 2 points (shortcut: dd)", dimensions.yqDimLinearSchema, dimensions.handleYqDimLinear);
reg("yq_dim_aligned", "Aligned dimension (shortcut: ddX)", dimensions.yqDimAlignedSchema, dimensions.handleYqDimAligned);
reg("yq_dim_baseline", "Baseline dimension from reference (shortcut: ddB)", dimensions.yqDimBaselineSchema, dimensions.handleYqDimBaseline);
reg("yq_dim_closedspace", "Auto-dimension closed space/room (shortcut: ddZ)", dimensions.yqDimClosedspaceSchema, dimensions.handleYqDimClosedspace);
reg("yq_dim_axiswd", "Dimension doors/windows on axis (shortcut: ddW)", dimensions.yqDimAxiswdSchema, dimensions.handleYqDimAxiswd);
reg("yq_dim_qdim", "Quick dimension (shortcut: ddQ)", dimensions.yqDimQdimSchema, dimensions.handleYqDimQdim);

// ══════════════════════════════════════════════════════════
//  ANNOTATIONS & SYMBOLS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_text", "Insert text annotation (shortcut: tt)", annotations.yqTextSchema, annotations.handleYqText);
reg("yq_text_replace", "Find and replace text in drawing (shortcut: ttR)", annotations.yqTextReplaceSchema, annotations.handleYqTextReplace);
reg("yq_changetext", "Modify text properties — height, style, etc. (shortcut: ttC)", annotations.yqChangetextSchema, annotations.handleYqChangetext);
reg("yq_leader", "Insert arrow leader with text (shortcut: aax)", annotations.yqLeaderSchema, annotations.handleYqLeader);
reg("yq_drawingtitle", "Insert drawing title block (shortcut: bt)", annotations.yqDrawingtitleSchema, annotations.handleYqDrawingtitle);
reg("yq_elevation_marker", "Insert elevation level marker (shortcut: BG)", annotations.yqElevationSchema, annotations.handleYqElevation);
reg("yq_section_symbol", "Insert section cut symbol (shortcut: dmf)", annotations.yqSectionSymbolSchema, annotations.handleYqSectionSymbol);
reg("yq_entrance_arrow", "Insert entrance arrow symbol (shortcut: aae)", annotations.yqEntrancearrowSchema, annotations.handleYqEntrancearrow);

// ══════════════════════════════════════════════════════════
//  EXTRA TOOLS (2 tools)
// ══════════════════════════════════════════════════════════

reg("yq_alignment", "Align elements (shortcut: DQ)", annotations.yqAlignmentSchema, annotations.handleYqAlignment);
reg("yq_transform", "Transform/scale elements (shortcut: TF)", annotations.yqTransformSchema, annotations.handleYqTransform);

// ══════════════════════════════════════════════════════════
//  LAYERS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_layer_new", "Create a new layer", layers.yqLayerNewSchema, layers.handleYqLayerNew);
reg("yq_layer_current", "Set the current/active layer", layers.yqLayerCurrentSchema, layers.handleYqLayerCurrent);
reg("yq_layer_off", "Turn off (hide) a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerOff);
reg("yq_layer_on", "Turn on (show) a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerOn);
reg("yq_layer_freeze", "Freeze a layer", layers.yqLayerOnOffSchema, layers.handleYqLayerFreeze);
reg("yq_layer_thaw", "Thaw a frozen layer", layers.yqLayerOnOffSchema, layers.handleYqLayerThaw);
reg("yq_layer_showall", "Show all layers (turn on + thaw all)", {}, layers.handleYqLayerShowall);
reg("yq_layertools", "Open YQArch layer management dialog", {}, layers.handleYqLayertools);

// ══════════════════════════════════════════════════════════
//  GENERIC TOOLS (2 tools)
// ══════════════════════════════════════════════════════════

server.tool(
  "yq_execute",
  "Execute any YQArch command by function name. Use yq_list_commands to discover available commands.",
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

server.tool(
  "yq_list_commands",
  "List available YQArch architectural commands. Filter by category or search by keyword.",
  yqListCommandsSchema,
  async (args: Record<string, unknown>) => {
    const result = handleYqListCommands(args as { category?: string; search?: string });
    return fmtLocal(result);
  }
);

// ── Start ──

async function main() {
  if (process.argv.includes("--license")) {
    printLicenseInfo();
    process.exit(0);
  }

  const stockIdx = process.argv.indexOf("--generate-stock");
  if (stockIdx !== -1) {
    const plan = (process.argv[stockIdx + 1] || "monthly") as "monthly" | "yearly" | "permanent";
    const count = parseInt(process.argv[stockIdx + 2] || "10", 10);
    printStockKeys(plan, count);
    process.exit(0);
  }

  if (process.argv.includes("--owner")) {
    if (!process.env.ACAD_OWNER_KEY) {
      console.error("Owner activation requires ACAD_OWNER_KEY environment variable.");
      process.exit(1);
    }
    activateOwnerKey();
    process.exit(0);
  }

  licenseStatus = validateLicense();
  console.error(`autocad-mcp v3.0.0 — YQArch integration, 76 MCP tools`);

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
