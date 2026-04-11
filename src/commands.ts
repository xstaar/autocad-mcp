/**
 * YQArch command registry — real commands from C:\YQArch\sys\yqshortcut.txt
 *
 * Each command maps to a real YQArch LISP function (e.g., yq_wall, yq_hole_door).
 * The LISP bridge calls these directly via (c:yq_functionname).
 */

export interface CommandDef {
  name: string;        // LISP function name (lowercase, e.g. "yq_wall")
  shortcut: string;    // YQArch shortcut key (e.g. "ww")
  description: string; // English description
  importance: number;  // 1-5 stars
}

export interface Category {
  id: string;
  label: string;
  description: string;
  commands: CommandDef[];
}

export const categories: Category[] = [
  {
    id: "walls",
    label: "Walls",
    description: "Double-line walls, partition walls, curtain walls, wall editing",
    commands: [
      { name: "yq_wall", shortcut: "ww", description: "Draw double-line wall (main wall tool)", importance: 5 },
      { name: "yq_trim_fix_wall", shortcut: "TW", description: "Trim/fix wall intersections", importance: 5 },
      { name: "yq_wall_chgthk", shortcut: "wwT", description: "Change wall thickness", importance: 4 },
      { name: "yq_line2wall", shortcut: "Xww", description: "Convert lines to walls", importance: 3 },
      { name: "yq_erase_wall", shortcut: "EW", description: "Delete wall/column/door", importance: 4 },
      { name: "yq_areawall", shortcut: "", description: "Create wall from closed area", importance: 3 },
      { name: "yq_simple_wall", shortcut: "", description: "Draw single-line wall", importance: 2 },
      { name: "yq_partitionwall", shortcut: "GQ", description: "Partition wall", importance: 2 },
      { name: "yq_curtainwall", shortcut: "MQ", description: "Curtain wall elevation", importance: 3 },
      { name: "yq_doubleline", shortcut: "xd", description: "Draw double line (beam/foundation)", importance: 5 },
      { name: "yq_trimdoubleline", shortcut: "TX", description: "Trim double line intersections", importance: 5 },
    ],
  },
  {
    id: "columns",
    label: "Columns",
    description: "Rectangular, circular, L-shaped, T-shaped, cross columns",
    commands: [
      { name: "yq_r_column", shortcut: "zzR", description: "Rectangular column", importance: 4 },
      { name: "yq_o_column", shortcut: "zzC", description: "Circular column", importance: 4 },
      { name: "yq_l_column", shortcut: "zzL", description: "L-shaped column", importance: 3 },
      { name: "yq_t_column", shortcut: "zzT", description: "T-shaped column", importance: 3 },
      { name: "yq_c_column", shortcut: "zzX", description: "Cross/+ shaped column", importance: 3 },
      { name: "yq_axis_column", shortcut: "zzBZ", description: "Place columns on grid axes", importance: 2 },
    ],
  },
  {
    id: "doors",
    label: "Doors",
    description: "Doors on walls, free placement doors, pocket doors",
    commands: [
      { name: "yq_hole_door", shortcut: "AD", description: "Open door on wall (cuts wall + inserts door)", importance: 5 },
      { name: "yq_door", shortcut: "AD2", description: "Draw a door (free placement)", importance: 3 },
      { name: "yq_hole_pocketdoor", shortcut: "ADT", description: "Open pocket/sliding door on wall", importance: 5 },
      { name: "yq_pocketdoor", shortcut: "ADT2", description: "Draw pocket door (free placement)", importance: 3 },
      { name: "yq_windoor_replace", shortcut: "TD", description: "Replace door/window type", importance: 4 },
      { name: "yq_width_windoor", shortcut: "CW", description: "Change door/window width", importance: 4 },
      { name: "yq_move_windoor", shortcut: "VW", description: "Move door/window along wall", importance: 4 },
      { name: "yq_overturn", shortcut: "FZ", description: "Flip/overturn door or window", importance: 4 },
      { name: "yq_hole", shortcut: "HO", description: "Cut hole in wall (no door/window)", importance: 2 },
      { name: "yq_repair", shortcut: "XF", description: "Repair door/window/column", importance: 4 },
      { name: "yq_move_repair", shortcut: "vX", description: "Move and repair door/window/column", importance: 3 },
      { name: "yq_copy_repair", shortcut: "cX", description: "Copy and repair door/window/column", importance: 3 },
      { name: "yq_mirror_repair", shortcut: "rrX", description: "Mirror and repair door/window/column", importance: 3 },
      { name: "yq_matchwindoor", shortcut: "ssB", description: "Match/replace door or window style", importance: 3 },
      { name: "yq_doorsill_manager", shortcut: "MKX", description: "Doorsill manager", importance: 2 },
      { name: "yq_dooropening_manager", shortcut: "MDX", description: "Door opening manager", importance: 2 },
    ],
  },
  {
    id: "windows",
    label: "Windows",
    description: "Windows on walls, free placement, parametric, corner windows",
    commands: [
      { name: "yq_hole_win", shortcut: "AW", description: "Open window on wall (cuts wall + inserts window)", importance: 5 },
      { name: "yq_win", shortcut: "AW2", description: "Draw a window (free placement)", importance: 3 },
      { name: "yq_hole_window", shortcut: "WD", description: "Open parametric window on wall", importance: 5 },
      { name: "yq_window", shortcut: "WD2", description: "Draw parametric window (free placement)", importance: 3 },
      { name: "yq_hole_cornerwindow", shortcut: "WDZ", description: "Corner window on wall", importance: 5 },
      { name: "yq_replace_pocketdoor", shortcut: "TDD", description: "Replace pocket door type", importance: 3 },
      { name: "yq_replace_paramwindow", shortcut: "TDW", description: "Replace parametric window type", importance: 3 },
      { name: "yq_replace_cornerwindow", shortcut: "TDZ", description: "Replace corner window type", importance: 3 },
      { name: "yq_lines2windows", shortcut: "xWD", description: "Convert lines to windows", importance: 2 },
      { name: "yq_window_serial", shortcut: "wbh", description: "Window serial number", importance: 1 },
    ],
  },
  {
    id: "stairs",
    label: "Stairs & Elevators",
    description: "Staircases, escalators, elevators",
    commands: [
      { name: "yq_staircase_plan", shortcut: "LTJ", description: "Staircase plan view", importance: 4 },
      { name: "yq_staircase_section", shortcut: "LTP", description: "Staircase section view", importance: 4 },
      { name: "yq_arcstair_plan", shortcut: "LTA", description: "Arc/curved staircase plan", importance: 3 },
      { name: "yq_escalator", shortcut: "LTF", description: "Escalator", importance: 4 },
      { name: "yq_lift_plan", shortcut: "DTJ", description: "Elevator/lift plan", importance: 2 },
      { name: "yq_banister", shortcut: "LG", description: "Banister/railing", importance: 3 },
    ],
  },
  {
    id: "decoration",
    label: "Decoration & Interior",
    description: "Auto-furniture, bathroom, flooring, lighting",
    commands: [
      { name: "yq_autofurniture", shortcut: "JJ", description: "Auto-arrange furniture in room", importance: 5 },
      { name: "yq_arrangewc", shortcut: "WC", description: "Auto-arrange WC/bathroom fixtures", importance: 5 },
      { name: "yq_stonetile", shortcut: "STB", description: "Stone tile floor pattern", importance: 3 },
      { name: "yq_woodflooring", shortcut: "MDB", description: "Wood flooring pattern", importance: 1 },
      { name: "yq_gypsumboard", shortcut: "SGB", description: "Gypsum board ceiling", importance: 3 },
      { name: "yq_insulation", shortcut: "BWM", description: "Insulation hatch pattern", importance: 1 },
      { name: "yq_autolamps", shortcut: "DJ", description: "Auto-arrange lamps/lighting", importance: 1 },
      { name: "yq_glass_partition", shortcut: "MQS", description: "Glass partition wall", importance: 2 },
    ],
  },
  {
    id: "grid_axes",
    label: "Grid & Axes",
    description: "Structural grid, axis lines, axis symbols",
    commands: [
      { name: "yq_gridaxis", shortcut: "zxw", description: "Draw structural grid axis system", importance: 2 },
      { name: "yq_axisline", shortcut: "ax", description: "Draw single axis line", importance: 1 },
      { name: "yq_auto_axis_dim", shortcut: "aZH", description: "Auto-dimension all axes", importance: 5 },
      { name: "yq_symbol_axis_c", shortcut: "ZH", description: "Draw axis circle symbols", importance: 4 },
    ],
  },
  {
    id: "dimensions",
    label: "Dimensions",
    description: "Linear, aligned, baseline, quick dimensioning",
    commands: [
      { name: "yq_dim_linear", shortcut: "dd", description: "Linear dimension between 2 points", importance: 4 },
      { name: "yq_dim_aligned", shortcut: "ddX", description: "Aligned dimension", importance: 2 },
      { name: "yq_dim_baseline", shortcut: "ddB", description: "Baseline dimension from reference", importance: 2 },
      { name: "yq_dim_closedspace", shortcut: "ddZ", description: "Auto-dimension closed space (room)", importance: 4 },
      { name: "yq_dim_axiswd", shortcut: "ddW", description: "Dimension doors/windows on axis", importance: 3 },
      { name: "yq_dim_qdim", shortcut: "ddQ", description: "Quick dimension", importance: 2 },
    ],
  },
  {
    id: "symbols",
    label: "Architectural Symbols",
    description: "Elevation markers, section cuts, entrance arrows, leaders",
    commands: [
      { name: "yq_designed_elevation", shortcut: "BG", description: "Elevation level marker", importance: 4 },
      { name: "yq_symbol_sectioncutter", shortcut: "dmf", description: "Section cut symbol", importance: 2 },
      { name: "yq_entrancearrow", shortcut: "aae", description: "Entrance arrow symbol", importance: 1 },
      { name: "yq_leader", shortcut: "aax", description: "Arrow leader with text", importance: 4 },
      { name: "yq_drawingtitle", shortcut: "bt", description: "Drawing title block", importance: 3 },
    ],
  },
  {
    id: "text",
    label: "Text",
    description: "Text insertion, find/replace, text properties",
    commands: [
      { name: "yq_text", shortcut: "tt", description: "Insert text annotation", importance: 4 },
      { name: "yq_text_replace", shortcut: "ttR", description: "Find and replace text", importance: 5 },
      { name: "yq_changetext", shortcut: "ttC", description: "Modify text properties (height, style, etc.)", importance: 5 },
    ],
  },
  {
    id: "tools",
    label: "Extra Tools",
    description: "Alignment, transform, flip, layer tools",
    commands: [
      { name: "yq_alignment", shortcut: "DQ", description: "Align elements", importance: 4 },
      { name: "yq_transform", shortcut: "TF", description: "Transform/scale elements", importance: 4 },
      { name: "yq_layertools", shortcut: "", description: "Open layer management dialog", importance: 2 },
    ],
  },
  {
    id: "layers",
    label: "Layers",
    description: "Standard AutoCAD layer management",
    commands: [
      { name: "layer_new", shortcut: "", description: "Create a new layer", importance: 3 },
      { name: "layer_current", shortcut: "", description: "Set current/active layer", importance: 3 },
      { name: "layer_off", shortcut: "", description: "Turn off a layer (hide)", importance: 2 },
      { name: "layer_on", shortcut: "", description: "Turn on a layer (show)", importance: 2 },
      { name: "layer_freeze", shortcut: "", description: "Freeze a layer", importance: 2 },
      { name: "layer_thaw", shortcut: "", description: "Thaw a layer", importance: 2 },
      { name: "layer_showall", shortcut: "", description: "Show all layers", importance: 2 },
    ],
  },
];

// Build lookup indexes
export const allCommandNames = new Set<string>();
export const commandIndex = new Map<string, CommandDef>();

for (const cat of categories) {
  for (const cmd of cat.commands) {
    allCommandNames.add(cmd.name);
    commandIndex.set(cmd.name, cmd);
  }
}
