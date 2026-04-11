import { dispatch } from "../ipc.js";

// ── yq_hole_door: Open door on wall (cuts wall + inserts door) ──
export const yqHoleDoorSchema = {};
export async function handleYqHoleDoor(args: Record<string, unknown>) {
  return dispatch("yq_hole_door", args);
}

// ── yq_door: Draw a door (free placement) ──
export const yqDoorSchema = {};
export async function handleYqDoor(args: Record<string, unknown>) {
  return dispatch("yq_door", args);
}

// ── yq_hole_pocketdoor: Pocket/sliding door on wall ──
export const yqHolePocketdoorSchema = {};
export async function handleYqHolePocketdoor(args: Record<string, unknown>) {
  return dispatch("yq_hole_pocketdoor", args);
}

// ── yq_pocketdoor: Pocket door (free placement) ──
export const yqPocketdoorSchema = {};
export async function handleYqPocketdoor(args: Record<string, unknown>) {
  return dispatch("yq_pocketdoor", args);
}

// ── yq_windoor_replace: Replace door/window type ──
export const yqWindoorReplaceSchema = {};
export async function handleYqWindoorReplace(args: Record<string, unknown>) {
  return dispatch("yq_windoor_replace", args);
}

// ── yq_width_windoor: Change door/window width ──
export const yqWidthWindoorSchema = {};
export async function handleYqWidthWindoor(args: Record<string, unknown>) {
  return dispatch("yq_width_windoor", args);
}

// ── yq_move_windoor: Move door/window along wall ──
export const yqMoveWindoorSchema = {};
export async function handleYqMoveWindoor(args: Record<string, unknown>) {
  return dispatch("yq_move_windoor", args);
}

// ── yq_overturn: Flip/overturn door or window ──
export const yqOverturnSchema = {};
export async function handleYqOverturn(args: Record<string, unknown>) {
  return dispatch("yq_overturn", args);
}

// ── yq_hole: Cut hole in wall ──
export const yqHoleSchema = {};
export async function handleYqHole(args: Record<string, unknown>) {
  return dispatch("yq_hole", args);
}

// ── yq_repair: Repair door/window/column ──
export const yqRepairSchema = {};
export async function handleYqRepair(args: Record<string, unknown>) {
  return dispatch("yq_repair", args);
}

// ── yq_hole_win: Open window on wall ──
export const yqHoleWinSchema = {};
export async function handleYqHoleWin(args: Record<string, unknown>) {
  return dispatch("yq_hole_win", args);
}

// ── yq_win: Draw window (free placement) ──
export const yqWinSchema = {};
export async function handleYqWin(args: Record<string, unknown>) {
  return dispatch("yq_win", args);
}

// ── yq_hole_window: Parametric window on wall ──
export const yqHoleWindowSchema = {};
export async function handleYqHoleWindow(args: Record<string, unknown>) {
  return dispatch("yq_hole_window", args);
}

// ── yq_window: Parametric window (free placement) ──
export const yqWindowSchema = {};
export async function handleYqWindow(args: Record<string, unknown>) {
  return dispatch("yq_window", args);
}

// ── yq_hole_cornerwindow: Corner window on wall ──
export const yqHoleCornerwindowSchema = {};
export async function handleYqHoleCornerwindow(args: Record<string, unknown>) {
  return dispatch("yq_hole_cornerwindow", args);
}

// ── yq_glass_partition: Glass partition wall ──
export const yqGlassPartitionSchema = {};
export async function handleYqGlassPartition(args: Record<string, unknown>) {
  return dispatch("yq_glass_partition", args);
}
