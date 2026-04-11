import { dispatch } from "../ipc.js";

export const emptySchema = {};

// ── Dimension Draw ──
export async function handleYqDimLinear(a: Record<string, unknown>) { return dispatch("yq_dim_linear", a); }
export async function handleYqDimAligned(a: Record<string, unknown>) { return dispatch("yq_dim_aligned", a); }
export async function handleYqDimBaseline(a: Record<string, unknown>) { return dispatch("yq_dim_baseline", a); }
export async function handleYqDimRadius(a: Record<string, unknown>) { return dispatch("yq_dim_radius", a); }
export async function handleYqDimDiameter(a: Record<string, unknown>) { return dispatch("yq_dim_diameter", a); }
export async function handleYqDimAngular(a: Record<string, unknown>) { return dispatch("yq_dim_angular", a); }
export async function handleYqDimQdim(a: Record<string, unknown>) { return dispatch("yq_dim_qdim", a); }
export async function handleYqDimClosedspace(a: Record<string, unknown>) { return dispatch("yq_dim_closedspace", a); }
export async function handleYqDimClosedpline(a: Record<string, unknown>) { return dispatch("yq_dim_closedpline", a); }
export async function handleYqDimPlines(a: Record<string, unknown>) { return dispatch("yq_dim_plines", a); }
export async function handleYqDimAxiswd(a: Record<string, unknown>) { return dispatch("yq_dim_axiswd", a); }
export async function handleYqDimBlksWalls(a: Record<string, unknown>) { return dispatch("yq_dim_blks_walls", a); }
export async function handleYqDimSteps(a: Record<string, unknown>) { return dispatch("yq_dim_steps", a); }
export async function handleYqDimSetStyle(a: Record<string, unknown>) { return dispatch("yq_dim_set_style", a); }
export async function handleYqDimUpdateStyle(a: Record<string, unknown>) { return dispatch("yq_dim_update", a); }
export async function handleYqDimSwitchStyle(a: Record<string, unknown>) { return dispatch("yq_dim_switch_style", a); }

// ── Dimension Modify ──
export async function handleYqDimAdjustText(a: Record<string, unknown>) { return dispatch("yq_dim_adjust_text", a); }
export async function handleYqDimExtend(a: Record<string, unknown>) { return dispatch("yq_dim_extend", a); }
export async function handleYqDimSplit(a: Record<string, unknown>) { return dispatch("yq_dim_split", a); }
export async function handleYqDimMerge(a: Record<string, unknown>) { return dispatch("yq_dim_merge_one", a); }
export async function handleYqDimAlignPts(a: Record<string, unknown>) { return dispatch("yq_dim_align_pts", a); }
export async function handleYqDimToMeter(a: Record<string, unknown>) { return dispatch("yq_dim_to_meter", a); }
export async function handleYqDimRound(a: Record<string, unknown>) { return dispatch("yq_dim_round", a); }

// ── Axis symbols ──
export async function handleYqAutoAxisDim(a: Record<string, unknown>) { return dispatch("yq_auto_axis_dim", a); }
export async function handleYqSymbolAxis(a: Record<string, unknown>) { return dispatch("yq_symbol_axis_c", a); }
