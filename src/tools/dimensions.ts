import { dispatch } from "../ipc.js";

// ── yq_gridaxis: Structural grid axis system ──
export const yqGridaxisSchema = {};
export async function handleYqGridaxis(args: Record<string, unknown>) {
  return dispatch("yq_gridaxis", args);
}

// ── yq_axisline: Single axis line ──
export const yqAxislinesSchema = {};
export async function handleYqAxisline(args: Record<string, unknown>) {
  return dispatch("yq_axisline", args);
}

// ── yq_auto_axis_dim: Auto-dimension all axes ──
export const yqAutoAxisDimSchema = {};
export async function handleYqAutoAxisDim(args: Record<string, unknown>) {
  return dispatch("yq_auto_axis_dim", args);
}

// ── yq_symbol_axis_c: Axis circle symbols ──
export const yqSymbolAxisSchema = {};
export async function handleYqSymbolAxis(args: Record<string, unknown>) {
  return dispatch("yq_symbol_axis_c", args);
}

// ── yq_dim_linear: Linear dimension ──
export const yqDimLinearSchema = {};
export async function handleYqDimLinear(args: Record<string, unknown>) {
  return dispatch("yq_dim_linear", args);
}

// ── yq_dim_aligned: Aligned dimension ──
export const yqDimAlignedSchema = {};
export async function handleYqDimAligned(args: Record<string, unknown>) {
  return dispatch("yq_dim_aligned", args);
}

// ── yq_dim_baseline: Baseline dimension ──
export const yqDimBaselineSchema = {};
export async function handleYqDimBaseline(args: Record<string, unknown>) {
  return dispatch("yq_dim_baseline", args);
}

// ── yq_dim_closedspace: Auto-dimension closed space ──
export const yqDimClosedspaceSchema = {};
export async function handleYqDimClosedspace(args: Record<string, unknown>) {
  return dispatch("yq_dim_closedspace", args);
}

// ── yq_dim_axiswd: Dimension doors/windows on axis ──
export const yqDimAxiswdSchema = {};
export async function handleYqDimAxiswd(args: Record<string, unknown>) {
  return dispatch("yq_dim_axiswd", args);
}

// ── yq_dim_qdim: Quick dimension ──
export const yqDimQdimSchema = {};
export async function handleYqDimQdim(args: Record<string, unknown>) {
  return dispatch("yq_dim_qdim", args);
}
