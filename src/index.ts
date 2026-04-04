#!/usr/bin/env node
/**
 * yqarch-mcp — MCP server for YQArch (源泉设计) AutoCAD plugin.
 *
 * Exposes ALL 684 YQArch commands via:
 *   - ~35 typed tools for the most common architectural operations
 *   - yq_execute: generic tool to run ANY of the 684 commands
 *   - yq_list_commands: discover commands by category or keyword
 *
 * IPC: file-based JSON in C:\temp\ (same protocol as autocad-mcp).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IpcResponse } from "./ipc.js";

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
  name: "yqarch-mcp",
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

// Helper to register a tool concisely
function reg(
  name: string,
  desc: string,
  schema: Record<string, unknown>,
  handler: (args: Record<string, unknown>) => Promise<IpcResponse>
) {
  server.tool(name, desc, schema, async (args: Record<string, unknown>) => {
    try { return fmt(await handler(args)); } catch (e) { return err(e); }
  });
}

// ══════════════════════════════════════════════════════════
//  WALLS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_wall", "Tracer un mur double ligne avec YQArch", walls.yqWallSchema, walls.handleYqWall);
reg("yq_simple_wall", "Mur simple (une ligne)", walls.yqSimpleWallSchema, walls.handleYqSimpleWall);
reg("yq_areawall", "Mur par zone/surface fermée", walls.yqAreawallSchema, walls.handleYqAreawall);
reg("yq_line2wall", "Convertir une ligne existante en mur", walls.yqLine2wallSchema, walls.handleYqLine2wall);
reg("yq_wall_chgthk", "Changer l'épaisseur d'un mur existant", walls.yqWallChgthkSchema, walls.handleYqWallChgthk);
reg("yq_partitionwall", "Tracer un mur de cloison", walls.yqPartitionwallSchema, walls.handleYqPartitionwall);
reg("yq_curtainwall", "Tracer un mur-rideau", walls.yqCurtainwallSchema, walls.handleYqCurtainwall);
reg("yq_doubleline", "Tracer une double ligne (longrine/fondation)", walls.yqDoublelineSchema, walls.handleYqDoubleline);

// ══════════════════════════════════════════════════════════
//  COLUMNS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_r_column", "Poteau rectangulaire", columns.yqRColumnSchema, columns.handleYqRColumn);
reg("yq_c_column", "Poteau circulaire", columns.yqCColumnSchema, columns.handleYqCColumn);
reg("yq_l_column", "Poteau en L", columns.yqLColumnSchema, columns.handleYqLColumn);
reg("yq_t_column", "Poteau en T", columns.yqTColumnSchema, columns.handleYqTColumn);
reg("yq_o_column", "Poteau creux/annulaire", columns.yqOColumnSchema, columns.handleYqOColumn);
reg("yq_axis_column", "Poteau sur axe (grille structurelle)", columns.yqAxisColumnSchema, columns.handleYqAxisColumn);

// ══════════════════════════════════════════════════════════
//  DOORS & WINDOWS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_door", "Insérer une porte dans un mur", doors.yqDoorSchema, doors.handleYqDoor);
reg("yq_window", "Insérer une fenêtre dans un mur", doors.yqWindowSchema, doors.handleYqWindow);
reg("yq_windowdoor", "Insérer une porte-fenêtre", doors.yqWindowdoorSchema, doors.handleYqWindowdoor);
reg("yq_hole_door", "Percement de porte dans un mur", doors.yqHoleDoorSchema, doors.handleYqHoleDoor);
reg("yq_hole_window", "Percement de fenêtre dans un mur", doors.yqHoleWindowSchema, doors.handleYqHoleWindow);
reg("yq_glass_partition", "Cloison vitrée", doors.yqGlassPartitionSchema, doors.handleYqGlassPartition);

// ══════════════════════════════════════════════════════════
//  STAIRS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_staircase_plan", "Plan d'escalier droit", stairs.yqStaircasePlanSchema, stairs.handleYqStaircasePlan);
reg("yq_staircase_section", "Coupe d'escalier", stairs.yqStaircaseSectionSchema, stairs.handleYqStaircaseSection);
reg("yq_arcstair_plan", "Plan d'escalier courbe", stairs.yqArcstairPlanSchema, stairs.handleYqArcstairPlan);
reg("yq_lift_plan", "Plan d'ascenseur", stairs.yqLiftPlanSchema, stairs.handleYqLiftPlan);
reg("yq_banister", "Garde-corps / rampe", stairs.yqBanisterSchema, stairs.handleYqBanister);
reg("yq_escalator", "Escalier mécanique / escalator", {}, stairs.handleYqEscalator);

// ══════════════════════════════════════════════════════════
//  DIMENSIONS & GRIDS (8 tools)
// ══════════════════════════════════════════════════════════

reg("yq_dim_auto", "Cotation automatique des murs et ouvertures", dimensions.yqDimAutoSchema, dimensions.handleYqDimAuto);
reg("yq_gridaxis", "Grille d'axes structurelle (trame)", dimensions.yqGridaxisSchema, dimensions.handleYqGridaxis);
reg("yq_dim_linear", "Cotation linéaire entre 2 points", dimensions.yqDimLinearSchema, dimensions.handleYqDimLinear);
reg("yq_dim_aligned", "Cotation alignée entre 2 points", dimensions.yqDimAlignedSchema, dimensions.handleYqDimAligned);
reg("yq_dim_continue", "Cotation continue (chaîne de cotes)", dimensions.yqDimContinueSchema, dimensions.handleYqDimContinue);
reg("yq_dim_baseline", "Cotation depuis une ligne de base", dimensions.yqDimBaselineSchema, dimensions.handleYqDimBaseline);
reg("yq_auto_axis_dim", "Cotation automatique des axes", dimensions.yqAutoAxisDimSchema, dimensions.handleYqAutoAxisDim);
reg("yq_axisline", "Ligne d'axe", dimensions.yqAxislinesSchema, dimensions.handleYqAxisline);

// ══════════════════════════════════════════════════════════
//  LAYERS (9 tools)
// ══════════════════════════════════════════════════════════

reg("yq_layer_new", "Créer un nouveau calque", layers.yqLayerNewSchema, layers.handleYqLayerNew);
reg("yq_layer_current", "Définir le calque courant", layers.yqLayerCurrentSchema, layers.handleYqLayerCurrent);
reg("yq_layer_off", "Éteindre un calque", layers.yqLayerOnOffSchema, layers.handleYqLayerOff);
reg("yq_layer_on", "Allumer un calque", layers.yqLayerOnOffSchema, layers.handleYqLayerOn);
reg("yq_layer_freeze", "Geler un calque", layers.yqLayerOnOffSchema, layers.handleYqLayerFreeze);
reg("yq_layer_thaw", "Dégeler un calque", layers.yqLayerOnOffSchema, layers.handleYqLayerThaw);
reg("yq_layer_iso", "Isoler un calque (éteindre les autres)", layers.yqLayerOnOffSchema, layers.handleYqLayerIso);
reg("yq_layer_showall", "Afficher tous les calques", {}, layers.handleYqLayerShowall);
reg("yq_layer_rename", "Renommer un calque", layers.yqLayerRenameSchema, layers.handleYqLayerRename);

// ══════════════════════════════════════════════════════════
//  HATCHING & MATERIALS (4 tools)
// ══════════════════════════════════════════════════════════

reg("yq_hatch_quick", "Hachure rapide", hatching.yqHatchQuickSchema, hatching.handleYqHatchQuick);
reg("yq_insulation", "Hachure d'isolation thermique", hatching.yqInsulationSchema, hatching.handleYqInsulation);
reg("yq_stonetile", "Carrelage / pierre", hatching.yqStonetileSchema, hatching.handleYqStonetile);
reg("yq_woodflooring", "Parquet / bois", hatching.yqWoodflooringSchema, hatching.handleYqWoodflooring);

// ══════════════════════════════════════════════════════════
//  ANNOTATIONS & SYMBOLS (6 tools)
// ══════════════════════════════════════════════════════════

reg("yq_text", "Insérer un texte", annotations.yqTextSchema, annotations.handleYqText);
reg("yq_leader", "Ligne de repère avec texte", annotations.yqLeaderSchema, annotations.handleYqLeader);
reg("yq_drawingtitle", "Cartouche / titre de plan", annotations.yqDrawingtitleSchema, annotations.handleYqDrawingtitle);
reg("yq_section_symbol", "Symbole de coupe", annotations.yqSymbolSectioncutterSchema, annotations.handleYqSymbolSectioncutter);
reg("yq_elevation_marker", "Repère de cote de niveau", annotations.yqElevindexerSchema, annotations.handleYqElevindexer);
reg("yq_entrance_arrow", "Flèche d'entrée", annotations.yqEntrancearrowSchema, annotations.handleYqEntrancearrow);

// ══════════════════════════════════════════════════════════
//  GENERIC TOOLS (2 tools) — access to ALL 684 commands
// ══════════════════════════════════════════════════════════

// yq_execute: run any command
server.tool(
  "yq_execute",
  "Exécuter n'importe laquelle des 684 commandes YQArch. " +
  "Utilisez yq_list_commands pour découvrir les commandes disponibles par catégorie.",
  yqExecuteSchema,
  async (args: Record<string, unknown>) => {
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
  "Lister et rechercher parmi les 684 commandes YQArch disponibles. " +
  "Filtrer par catégorie (walls, doors_windows, columns, stairs, dimensions, " +
  "grid_axes, hatching, layers, blocks, text, editing, curves, viewports, etc.) " +
  "ou rechercher par mot-clé.",
  yqListCommandsSchema,
  async (args: Record<string, unknown>) => {
    const result = handleYqListCommands(args as { category?: string; search?: string });
    return fmtLocal(result);
  }
);

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("yqarch-mcp v2.0.0 — 684 commands, " +
    (53 + 2) + " MCP tools — running on stdio");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
