import { dispatch } from "../ipc.js";

// ── yq_r_column: Rectangular column ──
export const yqRColumnSchema = {};
export async function handleYqRColumn(args: Record<string, unknown>) {
  return dispatch("yq_r_column", args);
}

// ── yq_o_column: Circular column ──
export const yqOColumnSchema = {};
export async function handleYqOColumn(args: Record<string, unknown>) {
  return dispatch("yq_o_column", args);
}

// ── yq_l_column: L-shaped column ──
export const yqLColumnSchema = {};
export async function handleYqLColumn(args: Record<string, unknown>) {
  return dispatch("yq_l_column", args);
}

// ── yq_t_column: T-shaped column ──
export const yqTColumnSchema = {};
export async function handleYqTColumn(args: Record<string, unknown>) {
  return dispatch("yq_t_column", args);
}

// ── yq_c_column: Cross/+ column ──
export const yqCColumnSchema = {};
export async function handleYqCColumn(args: Record<string, unknown>) {
  return dispatch("yq_c_column", args);
}

// ── yq_axis_column: Columns on grid axes ──
export const yqAxisColumnSchema = {};
export async function handleYqAxisColumn(args: Record<string, unknown>) {
  return dispatch("yq_axis_column", args);
}
