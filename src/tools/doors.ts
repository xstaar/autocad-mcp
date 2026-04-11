import { dispatch } from "../ipc.js";

// All door/window tools dispatch to the LISP bridge which calls real YQArch functions.

export const emptySchema = {};

// ── Doors ──
export async function handleYqHoleDoor(a: Record<string, unknown>) { return dispatch("yq_hole_door", a); }
export async function handleYqDoor(a: Record<string, unknown>) { return dispatch("yq_door", a); }
export async function handleYqHolePocketdoor(a: Record<string, unknown>) { return dispatch("yq_hole_pocketdoor", a); }
export async function handleYqPocketdoor(a: Record<string, unknown>) { return dispatch("yq_pocketdoor", a); }
export async function handleYqReplacePocketdoor(a: Record<string, unknown>) { return dispatch("yq_replace_pocketdoor", a); }

// ── Windows ──
export async function handleYqHoleWin(a: Record<string, unknown>) { return dispatch("yq_hole_win", a); }
export async function handleYqWin(a: Record<string, unknown>) { return dispatch("yq_win", a); }
export async function handleYqHoleWindow(a: Record<string, unknown>) { return dispatch("yq_hole_window", a); }
export async function handleYqWindow(a: Record<string, unknown>) { return dispatch("yq_window", a); }
export async function handleYqHoleCornerwindow(a: Record<string, unknown>) { return dispatch("yq_hole_cornerwindow", a); }
export async function handleYqReplaceParamwindow(a: Record<string, unknown>) { return dispatch("yq_replace_paramwindow", a); }
export async function handleYqReplaceCornerwindow(a: Record<string, unknown>) { return dispatch("yq_replace_cornerwindow", a); }

// ── Door/Window editing ──
export async function handleYqWindoorReplace(a: Record<string, unknown>) { return dispatch("yq_windoor_replace", a); }
export async function handleYqWidthWindoor(a: Record<string, unknown>) { return dispatch("yq_width_windoor", a); }
export async function handleYqMoveWindoor(a: Record<string, unknown>) { return dispatch("yq_move_windoor", a); }
export async function handleYqOverturn(a: Record<string, unknown>) { return dispatch("yq_overturn", a); }
export async function handleYqHole(a: Record<string, unknown>) { return dispatch("yq_hole", a); }
export async function handleYqRepair(a: Record<string, unknown>) { return dispatch("yq_repair", a); }
export async function handleYqMoveRepair(a: Record<string, unknown>) { return dispatch("yq_move_repair", a); }
export async function handleYqCopyRepair(a: Record<string, unknown>) { return dispatch("yq_copy_repair", a); }
export async function handleYqMirrorRepair(a: Record<string, unknown>) { return dispatch("yq_mirror_repair", a); }
export async function handleYqGlassPartition(a: Record<string, unknown>) { return dispatch("yq_glass_partition", a); }
export async function handleYqDoorsillManager(a: Record<string, unknown>) { return dispatch("yq_doorsill_manager", a); }
export async function handleYqDooropeningManager(a: Record<string, unknown>) { return dispatch("yq_dooropening_manager", a); }
export async function handleYqLines2windows(a: Record<string, unknown>) { return dispatch("yq_lines2windows", a); }
export async function handleYqWindowSerial(a: Record<string, unknown>) { return dispatch("yq_window_serial", a); }

// ── Building component elevations/sections ──
export async function handleYqDoorElevation(a: Record<string, unknown>) { return dispatch("yq_door_elevation", a); }
export async function handleYqDoorSection(a: Record<string, unknown>) { return dispatch("yq_door_section", a); }
export async function handleYqWindowElevation(a: Record<string, unknown>) { return dispatch("yq_window_elevation", a); }
export async function handleYqWindowSection(a: Record<string, unknown>) { return dispatch("yq_window_section", a); }
export async function handleYqShutter(a: Record<string, unknown>) { return dispatch("yq_shutter", a); }
export async function handleYqBaywinSection(a: Record<string, unknown>) { return dispatch("yq_baywin_section", a); }
