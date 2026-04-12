#!/usr/bin/env node
/**
 * autocad-mcp v3.1 — MCP server for AutoCAD + YQArch plugin.
 *
 * All 465 YQArch commands available via:
 *   - ~100 dedicated typed tools for common architectural operations
 *   - yq_execute: generic tool to run ANY of the 465 commands by name
 *   - yq_list_commands: discover commands by category or keyword
 *
 * IPC: file-based JSON in C:\temp\ → LISP bridge → real YQArch functions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IpcResponse } from "./ipc.js";
import { validateLicense, printLicenseInfo, printStockKeys, activateOwnerKey, tryActivateKey, LicenseStatus } from "./license.js";

// ── License ──
let licenseStatus: LicenseStatus;
function checkLicense(): boolean { licenseStatus = validateLicense(); return licenseStatus.valid; }
function licenseDenied() {
  return { content: [{ type: "text" as const, text: `ACCESS DENIED - License required\n\n${licenseStatus.message}\n\nPurchase: https://github.com/xstaar/autocad-mcp#pricing` }], isError: true };
}

// ── Tool imports ──
import * as W from "./tools/walls.js";
import * as D from "./tools/doors.js";
import * as S from "./tools/stairs.js";
import * as DIM from "./tools/dimensions.js";
import * as L from "./tools/layers.js";
import * as H from "./tools/hatching.js";
import * as A from "./tools/annotations.js";
import { yqExecuteSchema, handleYqExecute, yqListCommandsSchema, handleYqListCommands } from "./tools/execute.js";

const server = new McpServer({ name: "autocad-mcp", version: "3.1.0" });

// ── Helpers ──
function fmt(r: IpcResponse) {
  return r.ok
    ? { content: [{ type: "text" as const, text: JSON.stringify(r.payload, null, 2) }] }
    : { content: [{ type: "text" as const, text: `Error: ${r.error || "Command failed"}` }], isError: true };
}
function fmtLocal(r: { ok: boolean; payload: unknown; error?: string }) {
  return r.ok
    ? { content: [{ type: "text" as const, text: JSON.stringify(r.payload, null, 2) }] }
    : { content: [{ type: "text" as const, text: `Error: ${r.error || "Failed"}` }], isError: true };
}
function err(e: unknown) {
  return { content: [{ type: "text" as const, text: `IPC Error: ${e instanceof Error ? e.message : "Unknown"}` }], isError: true };
}

function reg(name: string, desc: string, schema: Record<string, unknown>, handler: (a: Record<string, unknown>) => Promise<IpcResponse>) {
  server.tool(name, desc, schema, async (args: Record<string, unknown>) => {
    if (!checkLicense()) return licenseDenied();
    try { return fmt(await handler(args)); } catch (e) { return err(e); }
  });
}

const E = {}; // empty schema shorthand

// ══════════════════════════════════════════════════════════
//  WALLS (13 tools)
// ══════════════════════════════════════════════════════════

reg("yq_wall", "Draw double-line wall (shortcut: WW). Main wall tool — opens YQArch wall dialog.", E, W.handleYqWall);
reg("yq_trim_fix_wall", "Trim/fix wall intersections automatically (shortcut: TW). Essential after drawing walls.", E, W.handleYqTrimFixWall);
reg("yq_wall_chgthk", "Change thickness of existing wall (shortcut: WWT)", E, W.handleYqWallChgthk);
reg("yq_line2wall", "Convert lines to double-line walls (shortcut: XWW)", E, W.handleYqLine2wall);
reg("yq_wall_offset", "Offset wall (shortcut: WWO)", E, W.handleYqWallOffset);
reg("yq_rebuilt_wall_axis", "Rebuild wall axis line (shortcut: WWA)", E, W.handleYqRebuiltWallAxis);
reg("yq_fill_walls", "Fill in walls/columns with hatch (shortcut: WWF)", E, W.handleYqFillWalls);
reg("yq_erase_wall", "Delete wall, column, door or window (shortcut: EW)", E, W.handleYqEraseWall);
reg("yq_partitionwall", "Draw partition wall (shortcut: GQ)", E, W.handleYqPartitionwall);
reg("yq_curtainwall", "Draw curtain wall elevation (shortcut: MQ)", E, W.handleYqCurtainwall);
reg("yq_doubleline", "Draw double line for beam/foundation (shortcut: XD)", E, W.handleYqDoubleline);
reg("yq_trimdoubleline", "Trim double line intersections (shortcut: TX)", E, W.handleYqTrimDoubleline);
reg("yq_doubleline_thk", "Change double line thickness (shortcut: XDT)", E, W.handleYqDoublelineThk);

// ══════════════════════════════════════════════════════════
//  COLUMNS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_r_column", "Rectangular column (shortcut: ZZR)", E, W.handleYqRColumn);
reg("yq_o_column", "Circular/O-shape column (shortcut: ZZC)", E, W.handleYqOColumn);
reg("yq_l_column", "L-shaped column (shortcut: ZZL)", E, W.handleYqLColumn);
reg("yq_t_column", "T-shaped column (shortcut: ZZT)", E, W.handleYqTColumn);
reg("yq_c_column", "Cross/+ shaped column (shortcut: ZZX)", E, W.handleYqCColumn);
reg("yq_axis_column", "Arrange columns on grid axes (shortcut: ZZBZ)", E, W.handleYqAxisColumn);
reg("yq_convert_column", "Convert object to column (shortcut: XXZZ)", E, W.handleYqConvertColumn);
reg("yq_fill_column", "Fill in columns (shortcut: ZZF)", E, W.handleYqFillColumn);

// ══════════════════════════════════════════════════════════
//  GRID & AXES (4 tools)
// ══════════════════════════════════════════════════════════

reg("yq_axisline", "Draw single axis line (shortcut: AX)", E, W.handleYqAxisline);
reg("yq_gridaxis", "Draw structural grid axis system (shortcut: ZXW)", E, W.handleYqGridaxis);
reg("yq_auto_axis_dim", "Auto-arrange axis symbols on all axes (shortcut: AZH)", E, DIM.handleYqAutoAxisDim);
reg("yq_symbol_axis_c", "Draw individual axis circle symbol (shortcut: ZH)", E, DIM.handleYqSymbolAxis);

// ══════════════════════════════════════════════════════════
//  DOORS (12 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hole_door", "Open door on wall — cuts wall + inserts door with swing arc (shortcut: AD). Most common door tool.", E, D.handleYqHoleDoor);
reg("yq_door", "Draw a door at free position (shortcut: AD2)", E, D.handleYqDoor);
reg("yq_hole_pocketdoor", "Open pocket/sliding door on wall (shortcut: ADT)", E, D.handleYqHolePocketdoor);
reg("yq_pocketdoor", "Draw pocket door at free position (shortcut: ADT2)", E, D.handleYqPocketdoor);
reg("yq_replace_pocketdoor", "Replace existing door by pocket door (shortcut: TDD)", E, D.handleYqReplacePocketdoor);
reg("yq_windoor_replace", "Replace door/window type (shortcut: TD)", E, D.handleYqWindoorReplace);
reg("yq_width_windoor", "Change door/window width (shortcut: CW)", E, D.handleYqWidthWindoor);
reg("yq_move_windoor", "Move door/window along wall (shortcut: VW)", E, D.handleYqMoveWindoor);
reg("yq_overturn", "Flip/overturn door or window opening direction (shortcut: FZ)", E, D.handleYqOverturn);
reg("yq_hole", "Cut hole in wall without door/window (shortcut: HO)", E, D.handleYqHole);
reg("yq_repair", "Repair door/window/column display (shortcut: XF)", E, D.handleYqRepair);
reg("yq_move_repair", "Move and repair door/window/column (shortcut: VX)", E, D.handleYqMoveRepair);

// ══════════════════════════════════════════════════════════
//  WINDOWS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hole_win", "Open window on wall — cuts wall + inserts window (shortcut: AW). Most common window tool.", E, D.handleYqHoleWin);
reg("yq_win", "Draw a window at free position (shortcut: AW2)", E, D.handleYqWin);
reg("yq_hole_window", "Open parametric window on wall (shortcut: WD)", E, D.handleYqHoleWindow);
reg("yq_window", "Draw parametric window at free position (shortcut: WD2)", E, D.handleYqWindow);
reg("yq_hole_cornerwindow", "Insert corner window on wall (shortcut: WDZ)", E, D.handleYqHoleCornerwindow);
reg("yq_replace_paramwindow", "Replace by parametric window (shortcut: TDW)", E, D.handleYqReplaceParamwindow);
reg("yq_replace_cornerwindow", "Replace by corner window (shortcut: TDZ)", E, D.handleYqReplaceCornerwindow);
reg("yq_glass_partition", "Glass partition wall section (shortcut: MQS)", E, D.handleYqGlassPartition);

// ══════════════════════════════════════════════════════════
//  DOOR/WINDOW UTILITIES (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_copy_repair", "Copy and repair door/window/column (shortcut: CK)", E, D.handleYqCopyRepair);
reg("yq_mirror_repair", "Mirror and repair door/window/column (shortcut: RRX)", E, D.handleYqMirrorRepair);
reg("yq_doorsill_manager", "Doorsill manager (shortcut: MKX)", E, D.handleYqDoorsillManager);
reg("yq_dooropening_manager", "Door opening manager (shortcut: MDX)", E, D.handleYqDooropeningManager);
reg("yq_lines2windows", "Convert lines to windows (shortcut: XWD)", E, D.handleYqLines2windows);
reg("yq_window_serial", "Window serial numbering (shortcut: WBH)", E, D.handleYqWindowSerial);

// ══════════════════════════════════════════════════════════
//  BUILDING ELEVATIONS & SECTIONS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_door_elevation", "Elevation view of door (shortcut: ADE)", E, D.handleYqDoorElevation);
reg("yq_door_section", "Section view of door (shortcut: ADS)", E, D.handleYqDoorSection);
reg("yq_window_elevation", "Elevation view of window (shortcut: WDE)", E, D.handleYqWindowElevation);
reg("yq_window_section", "Section view of window (shortcut: WDS)", E, D.handleYqWindowSection);
reg("yq_shutter", "Elevation/section of shutter (shortcut: BY)", E, D.handleYqShutter);
reg("yq_baywin_section", "Section of bay window (shortcut: WTS)", E, D.handleYqBaywinSection);

// ══════════════════════════════════════════════════════════
//  STAIRS & BUILDING COMPONENTS (9 tools)
// ══════════════════════════════════════════════════════════

reg("yq_staircase_plan", "Draw staircase plan view (shortcut: LTJ)", E, S.handleYqStaircasePlan);
reg("yq_staircase_section", "Draw staircase section view (shortcut: LTP)", E, S.handleYqStaircaseSection);
reg("yq_arcstair_plan", "Draw arc/curved staircase plan (shortcut: ITA)", E, S.handleYqArcstairPlan);
reg("yq_escalator", "Draw escalator plan/elevation (shortcut: LTF)", E, S.handleYqEscalator);
reg("yq_lift_plan", "Draw elevator/lift plan (shortcut: DTJ)", E, S.handleYqLiftPlan);
reg("yq_banister", "Draw banister/railing elevation (shortcut: LG)", E, S.handleYqBanister);
reg("yq_steps_section", "Section of steps (shortcut: LXTB)", E, S.handleYqStepsSection);
reg("yq_waterproof_section", "Section of waterproof membrane (shortcut: FSC)", E, S.handleYqWaterproofSection);
reg("yq_stucco_section", "Section of stucco/plaster (shortcut: FN)", E, S.handleYqStuccoSection);

// ══════════════════════════════════════════════════════════
//  DECORATION & INTERIOR (14 tools)
// ══════════════════════════════════════════════════════════

reg("yq_autofurniture", "Auto-arrange furniture in room — detects room boundaries (shortcut: IJ)", E, H.handleYqAutofurniture);
reg("yq_arrangewc", "Auto-arrange WC/bathroom/shower fixtures (shortcut: WC)", E, H.handleYqArrangewc);
reg("yq_stonetile", "Stone tile floor section pattern (shortcut: STB)", E, H.handleYqStonetile);
reg("yq_woodflooring", "Wood flooring section pattern (shortcut: MDB)", E, H.handleYqWoodflooring);
reg("yq_gypsumboard", "Gypsum board ceiling section (shortcut: SGB)", E, H.handleYqGypsumboard);
reg("yq_insulation", "Cotton insulation section pattern (shortcut: BWM)", E, H.handleYqInsulation);
reg("yq_autolamps", "Auto-arrange lamps/lighting (shortcut: DJ)", E, H.handleYqAutolamps);
reg("yq_chest", "Plan of chest/cabinet (shortcut: YG)", E, H.handleYqChest);
reg("yq_cupboard", "Plan of cupboard (shortcut: GZ)", E, H.handleYqCupboard);
reg("yq_cupboard_elev", "Elevation of cupboard (shortcut: GZE)", E, H.handleYqCupboardElev);
reg("yq_blockboard", "Section of blockboard (shortcut: MGB)", E, H.handleYqBlockboard);
reg("yq_lighttrough", "Section of light trough (shortcut: THDC)", E, H.handleYqLighttrough);
reg("yq_indoor_elevation", "Generate indoor elevation view (shortcut: IM)", E, H.handleYqIndoorElevation);
reg("yq_fill_walls_columns", "Fill in walls and columns with solid hatch (shortcut: WWF)", E, H.handleYqFillWallsColumns);

// ══════════════════════════════════════════════════════════
//  HATCHING (7 tools)
// ══════════════════════════════════════════════════════════

reg("yq_quick_hatch", "Quick hatching (shortcut: TC)", E, H.handleYqQuickHatch);
reg("yq_hatch_template", "Hatching by template (shortcut: TCT)", E, H.handleYqHatchTemplate);
reg("yq_param_hatch", "Parametric/slide hatch (shortcut: TCC)", E, H.handleYqParamHatch);
reg("yq_hatch_scale", "Change hatching scale (shortcut: XTC)", E, H.handleYqHatchScale);
reg("yq_hatch_clip", "Clip hatching boundary (shortcut: HHJ)", E, H.handleYqHatchClip);
reg("yq_hatch_split", "Split hatching into parts (shortcut: HHX)", E, H.handleYqHatchSplit);
reg("yq_hatch_union", "Union/merge hatching (shortcut: HHU)", E, H.handleYqHatchUnion);

// ══════════════════════════════════════════════════════════
//  DIMENSIONS (16 tools)
// ══════════════════════════════════════════════════════════

reg("yq_dim_linear", "Linear dimension between 2 points (shortcut: DD)", E, DIM.handleYqDimLinear);
reg("yq_dim_aligned", "Aligned dimension (shortcut: DDX)", E, DIM.handleYqDimAligned);
reg("yq_dim_baseline", "Baseline dimension from reference (shortcut: DDB)", E, DIM.handleYqDimBaseline);
reg("yq_dim_radius", "Radius dimension (shortcut: DDR)", E, DIM.handleYqDimRadius);
reg("yq_dim_diameter", "Diameter dimension (shortcut: DDJ)", E, DIM.handleYqDimDiameter);
reg("yq_dim_angular", "Angular dimension (shortcut: DDAN)", E, DIM.handleYqDimAngular);
reg("yq_dim_qdim", "Quick dimension (shortcut: DDQ)", E, DIM.handleYqDimQdim);
reg("yq_dim_closedspace", "Auto-dimension closed space/room (shortcut: DDZ)", E, DIM.handleYqDimClosedspace);
reg("yq_dim_closedpline", "Auto-dimension closed polyline (shortcut: DDZZ)", E, DIM.handleYqDimClosedpline);
reg("yq_dim_plines", "Dimension polylines/lines (shortcut: DDSS)", E, DIM.handleYqDimPlines);
reg("yq_dim_axiswd", "Dimension doors/windows on axis (shortcut: DDW)", E, DIM.handleYqDimAxiswd);
reg("yq_dim_blks_walls", "Dimension blocks and walls (shortcut: DDWW)", E, DIM.handleYqDimBlksWalls);
reg("yq_dim_steps", "Dimension staircase steps (shortcut: DDST)", E, DIM.handleYqDimSteps);
reg("yq_dim_set_style", "Set current dimension style (shortcut: DDS)", E, DIM.handleYqDimSetStyle);
reg("yq_dim_update", "Update dimensions by style (shortcut: DDU)", E, DIM.handleYqDimUpdateStyle);
reg("yq_dim_switch_style", "Switch to YQ dimension style (shortcut: DDYQ)", E, DIM.handleYqDimSwitchStyle);

// ══════════════════════════════════════════════════════════
//  DIMENSION MODIFY (7 tools)
// ══════════════════════════════════════════════════════════

reg("yq_dim_adjust_text", "Adjust dimension text position (shortcut: DDAA)", E, DIM.handleYqDimAdjustText);
reg("yq_dim_extend", "Extend dimension line (shortcut: DDE)", E, DIM.handleYqDimExtend);
reg("yq_dim_split", "Split dimension into many (shortcut: DD2)", E, DIM.handleYqDimSplit);
reg("yq_dim_merge_one", "Merge multiple dimensions (shortcut: DD1)", E, DIM.handleYqDimMerge);
reg("yq_dim_align_pts", "Align dimension definition points (shortcut: DDV)", E, DIM.handleYqDimAlignPts);
reg("yq_dim_to_meter", "Convert dimension units to meters (shortcut: DDM)", E, DIM.handleYqDimToMeter);
reg("yq_dim_round", "Round dimension values (shortcut: DDO)", E, DIM.handleYqDimRound);

// ══════════════════════════════════════════════════════════
//  TEXT (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_text", "Insert text annotation (shortcut: TT)", E, A.handleYqText);
reg("yq_text_edit", "Modify any text (shortcut: TTE)", E, A.handleYqTextEdit);
reg("yq_text_replace", "Find and replace text / calculate (shortcut: TTR)", E, A.handleYqTextReplace);
reg("yq_changetext", "Change text properties — font, color, etc. (shortcut: TTC)", E, A.handleYqChangetext);
reg("yq_change_height", "Change text height and aspects (shortcut: TTW)", E, A.handleYqChangeHeight);
reg("yq_text_style", "Create new text style (shortcut: TTN)", E, A.handleYqTextStyle);
reg("yq_set_text_style", "Set current text style (shortcut: TTS)", E, A.handleYqSetTextStyle);
reg("yq_create_texts", "Create/input multiple texts (shortcut: CTT)", E, A.handleYqCreateTexts);

// ══════════════════════════════════════════════════════════
//  ARCHITECTURAL SYMBOLS (12 tools)
// ══════════════════════════════════════════════════════════

reg("yq_designed_elevation", "Insert designed elevation marker (shortcut: BG)", E, A.handleYqDesignedElevation);
reg("yq_contour_elevation", "Insert contour elevation marker (shortcut: XBG)", E, A.handleYqContourElevation);
reg("yq_symbol_sectioncutter", "Insert section cutter symbol (shortcut: DMF)", E, A.handleYqSectionCutter);
reg("yq_section_plane", "Insert section plane symbol (shortcut: PQF)", E, A.handleYqSectionPlane);
reg("yq_slope", "Insert slope symbol (shortcut: PD)", E, A.handleYqSlope);
reg("yq_disconnection", "Insert disconnection line (shortcut: ZX)", E, A.handleYqDisconnection);
reg("yq_entrancearrow", "Insert entrance arrow (shortcut: AAE)", E, A.handleYqEntrancearrow);
reg("yq_bent_arrow", "Insert bent arrow (shortcut: AAW)", E, A.handleYqBentArrow);
reg("yq_symmetry_axis", "Insert symmetry axis (shortcut: DCZ)", E, A.handleYqSymmetryAxis);
reg("yq_geodesic", "Insert geodesic coordinates (shortcut: ZB)", E, A.handleYqGeodesic);
reg("yq_drawingframe", "Insert drawing frame A0-A4 (shortcut: TK)", E, A.handleYqDrawingFrame);
reg("yq_scale", "Set drawing/system scale (shortcut: SD)", E, A.handleYqScale);

// ══════════════════════════════════════════════════════════
//  INDEX SYMBOLS & LEADERS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_leader", "Insert arrow leader with text (shortcut: AAX)", E, A.handleYqLeader);
reg("yq_multi_leader", "Insert multi-point leader (shortcut: AAXX)", E, A.handleYqMultiLeader);
reg("yq_vert_leader", "Insert vertical multi-point leader (shortcut: AAYY)", E, A.handleYqVertLeader);
reg("yq_drawingtitle", "Insert drawing title block (shortcut: BT)", E, A.handleYqDrawingtitle);
reg("yq_section_sym1", "Insert section symbol type 1 (shortcut: SY1)", E, A.handleYqSectionSym1);
reg("yq_section_sym2", "Insert section symbol type 2 (shortcut: SY2)", E, A.handleYqSectionSym2);
reg("yq_detail_sym1", "Insert detail drawing symbol 1 (shortcut: XT1)", E, A.handleYqDetailSym1);
reg("yq_elev_indexer_4in1", "Insert elevation indexer 4-in-1 (shortcut: I0)", E, A.handleYqElevIndexer);

// ══════════════════════════════════════════════════════════
//  EXTRA TOOLS (3 tools)
// ══════════════════════════════════════════════════════════

reg("yq_alignment", "Align objects (shortcut: DQ)", E, A.handleYqAlignment);
reg("yq_transform", "Transform/scale objects (shortcut: TF)", E, A.handleYqTransform);
reg("yq_bounding_box", "Get bounding box of selection (shortcut: JX)", E, A.handleYqBoundingBox);

// ══════════════════════════════════════════════════════════
//  STATISTICS (5 tools)
// ══════════════════════════════════════════════════════════

reg("yq_auto_serial", "Auto serial numbering (shortcut: ABH)", E, A.handleYqAutoSerial);
reg("yq_windoor_list", "Generate window/door schedule list (shortcut: MCB)", E, A.handleYqWindoorList);
reg("yq_accum_area", "Accumulate/calculate area (shortcut: MJ)", E, A.handleYqAccumArea);
reg("yq_building_area", "Building area statistics (shortcut: FTB)", E, A.handleYqBuildingArea);
reg("yq_filtered_select", "Easy filtered select objects (shortcut: SS)", E, A.handleYqFilteredSelect);

// ══════════════════════════════════════════════════════════
//  LAYERS (18 tools)
// ══════════════════════════════════════════════════════════

reg("yq_layer_new", "Make a new layer (shortcut: ERN)", E, L.handleYqLayerNew);
reg("yq_layer_current", "Set current layer (shortcut: ERS)", E, L.handleYqLayerCurrent);
reg("yq_layer_to_current", "Change selected objects to current layer (shortcut: ENC)", E, L.handleYqLayerToCurrent);
reg("yq_layer_off", "Turn off layers (shortcut: ERF)", E, L.handleYqLayerOff);
reg("yq_layer_off_all", "Turn off all layers (shortcut: ERAF)", E, L.handleYqLayerOffAll);
reg("yq_layer_on", "Turn on layers (shortcut: ERA)", E, L.handleYqLayerOn);
reg("yq_layer_on_all", "Turn on all layers (shortcut: ERAA)", E, L.handleYqLayerOnAll);
reg("yq_layer_freeze", "Freeze layers (shortcut: ERZ)", E, L.handleYqLayerFreeze);
reg("yq_layer_thaw", "Thaw layers (shortcut: ERT)", E, L.handleYqLayerThaw);
reg("yq_layer_thaw_all", "Thaw/unlock/open all layers (shortcut: ERER)", E, L.handleYqLayerThawAll);
reg("yq_layer_isolate", "Isolate layers — hide all others (shortcut: ERD)", E, L.handleYqLayerIsolate);
reg("yq_layer_lock", "Lock layers (shortcut: ERL)", E, L.handleYqLayerLock);
reg("yq_layer_unlock", "Unlock layers (shortcut: ERU)", E, L.handleYqLayerUnlock);
reg("yq_layer_toggle", "Toggle all layers on/off (shortcut: ERV)", E, L.handleYqLayerToggle);
reg("yq_layer_merge", "Merge layers (shortcut: ERM)", E, L.handleYqLayerMerge);
reg("yq_layer_batch_replace", "Batch replace layers (shortcut: ERTD)", E, L.handleYqLayerBatchReplace);
reg("yq_layer_batch_rename", "Batch rename layers (shortcut: ERG)", E, L.handleYqLayerBatchRename);
reg("yq_layer_save_restore", "Save/restore layer states (shortcut: ERR)", E, L.handleYqLayerSaveRestore);

// ══════════════════════════════════════════════════════════
//  GENERIC TOOLS (2 tools) — access ALL 465 commands
// ══════════════════════════════════════════════════════════

server.tool(
  "yq_execute",
  "Execute ANY of the 465 YQArch commands by function name. Use yq_list_commands to discover available commands. " +
  "Handles all commands not covered by dedicated tools: blocks, viewports, matching brush, curve tools, check/correct, modify plus, etc.",
  yqExecuteSchema,
  async (args: Record<string, unknown>) => {
    if (!checkLicense()) return licenseDenied();
    try { return fmt(await handleYqExecute(args as { command: string; params?: Record<string, unknown> })); }
    catch (e) { return err(e); }
  }
);

server.tool(
  "yq_list_commands",
  "List/search all 465 YQArch commands. Filter by category (system_setup, plane_wall_column, plane_window_door, " +
  "building_components, decoration, arch_symbols, index_symbols, statistics, text_content, text_other, " +
  "dimension_draw, dimension_modify, curve_tools, extra_tools, modify_plus, check_correct, block_attribute, " +
  "hatching_linetype, layer_tools, viewport_layout, matching_brush, other_tools) or search by keyword.",
  yqListCommandsSchema,
  async (args: Record<string, unknown>) => {
    const result = handleYqListCommands(args as { category?: string; search?: string });
    return fmtLocal(result);
  }
);

// ══════════════════════════════════════════════════════════
//  DIRECT DRAWING TOOLS — no dialogs, instant execution
// ══════════════════════════════════════════════════════════

import * as fs from "fs";
import * as path from "path";
import { dispatch } from "./ipc.js";
import { z } from "zod";

server.tool(
  "draw_villa_rdc",
  "Draw a complete professional Villa RDC (ground floor) plan following Moroccan architectural norms. " +
  "14m x 12m, 3 chambres, salon, cuisine, SDB, WC, garage, hall. " +
  "Columns 250x250mm, murs ext 200mm, murs int 100mm. " +
  "Creates all layers, walls, doors, windows, labels, and grid axes automatically. No user interaction needed.",
  {},
  async () => {
    if (!checkLicense()) return licenseDenied();
    try {
      const lispPath = path.join(path.dirname(__dirname), "lisp", "villa_rdc.lsp").replace(/\\/g, "/");
      const loadCmd = `(load "${lispPath}") (c:VILLA-RDC)`;
      const result = await dispatch("_lisp_eval", { expression: loadCmd });
      return fmt(result);
    } catch (e) { return err(e); }
  }
);

server.tool(
  "run_lisp_file",
  "Load and run a LISP file in AutoCAD. Provide the full path to the .lsp file.",
  { file_path: z.string().describe("Full path to the .lsp file") },
  async (args: { file_path: string }) => {
    if (!checkLicense()) return licenseDenied();
    try {
      const filePath = args.file_path.replace(/\\/g, "/");
      if (!filePath.endsWith(".lsp")) {
        return { content: [{ type: "text" as const, text: "Error: file must be a .lsp file" }], isError: true };
      }
      const result = await dispatch("_lisp_eval", { expression: `(load "${filePath}")` });
      return fmt(result);
    } catch (e) { return err(e); }
  }
);

server.tool(
  "lisp_eval",
  "Evaluate a LISP expression directly in AutoCAD. For drawing geometry, setting variables, or running any AutoLISP code.",
  { expression: z.string().describe("AutoLISP expression to evaluate") },
  async (args: { expression: string }) => {
    if (!checkLicense()) return licenseDenied();
    try {
      const result = await dispatch("_lisp_eval", { expression: args.expression });
      return fmt(result);
    } catch (e) { return err(e); }
  }
);

// ── Start ──

async function main() {
  if (process.argv.includes("--license")) { printLicenseInfo(); process.exit(0); }

  const stockIdx = process.argv.indexOf("--generate-stock");
  if (stockIdx !== -1) {
    const plan = (process.argv[stockIdx + 1] || "monthly") as "monthly" | "yearly" | "permanent";
    const count = parseInt(process.argv[stockIdx + 2] || "10", 10);
    printStockKeys(plan, count);
    process.exit(0);
  }

  if (process.argv.includes("--owner")) {
    if (!process.env.ACAD_OWNER_KEY) { console.error("Owner activation requires ACAD_OWNER_KEY env var."); process.exit(1); }
    activateOwnerKey();
    process.exit(0);
  }

  licenseStatus = validateLicense();
  console.error(`autocad-mcp v3.1.0 — 465 YQArch commands, ~150 MCP tools`);

  if (licenseStatus.needsActivation && licenseStatus.key) {
    licenseStatus = await tryActivateKey(licenseStatus.key);
  }
  console.error(`License: ${licenseStatus.message.split("\n")[0]}`);

  if (!licenseStatus.valid) {
    console.error("\n" + licenseStatus.message);
    console.error("Server will start but all tools will require a license.");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
