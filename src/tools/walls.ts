import { dispatch } from "../ipc.js";

// All wall/column tools dispatch to the LISP bridge which calls real YQArch functions.
// YQArch opens its native dialog in AutoCAD for parameter input.

export const emptySchema = {};

// ── Walls ──
export async function handleYqWall(a: Record<string, unknown>) { return dispatch("yq_wall", a); }
export async function handleYqTrimFixWall(a: Record<string, unknown>) { return dispatch("yq_trim_fix_wall", a); }
export async function handleYqWallChgthk(a: Record<string, unknown>) { return dispatch("yq_wall_chgthk", a); }
export async function handleYqLine2wall(a: Record<string, unknown>) { return dispatch("yq_line2wall", a); }
export async function handleYqWallOffset(a: Record<string, unknown>) { return dispatch("yq_wall_offset", a); }
export async function handleYqRebuiltWallAxis(a: Record<string, unknown>) { return dispatch("yq_rebuilt_wall_axis", a); }
export async function handleYqFillWalls(a: Record<string, unknown>) { return dispatch("yq_fill_walls", a); }
export async function handleYqEraseWall(a: Record<string, unknown>) { return dispatch("yq_erase_wall", a); }
export async function handleYqPartitionwall(a: Record<string, unknown>) { return dispatch("yq_partitionwall", a); }
export async function handleYqCurtainwall(a: Record<string, unknown>) { return dispatch("yq_curtainwall", a); }
export async function handleYqDoubleline(a: Record<string, unknown>) { return dispatch("yq_doubleline", a); }
export async function handleYqTrimDoubleline(a: Record<string, unknown>) { return dispatch("yq_trimdoubleline", a); }
export async function handleYqDoublelineThk(a: Record<string, unknown>) { return dispatch("yq_doubleline_thk", a); }

// ── Columns ──
export async function handleYqRColumn(a: Record<string, unknown>) { return dispatch("yq_r_column", a); }
export async function handleYqOColumn(a: Record<string, unknown>) { return dispatch("yq_o_column", a); }
export async function handleYqLColumn(a: Record<string, unknown>) { return dispatch("yq_l_column", a); }
export async function handleYqTColumn(a: Record<string, unknown>) { return dispatch("yq_t_column", a); }
export async function handleYqCColumn(a: Record<string, unknown>) { return dispatch("yq_c_column", a); }
export async function handleYqAxisColumn(a: Record<string, unknown>) { return dispatch("yq_axis_column", a); }
export async function handleYqConvertColumn(a: Record<string, unknown>) { return dispatch("yq_convert_column", a); }
export async function handleYqFillColumn(a: Record<string, unknown>) { return dispatch("yq_fill_column", a); }

// ── Grid / Axis ──
export async function handleYqAxisline(a: Record<string, unknown>) { return dispatch("yq_axisline", a); }
export async function handleYqGridaxis(a: Record<string, unknown>) { return dispatch("yq_gridaxis", a); }
