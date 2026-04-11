import { z } from "zod";
import { dispatch } from "../ipc.js";

// ── yq_wall: Draw double-line wall ──
export const yqWallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqWall(args: Record<string, unknown>) {
  return dispatch("yq_wall", args);
}

// ── yq_simple_wall: Single-line wall ──
export const yqSimpleWallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqSimpleWall(args: Record<string, unknown>) {
  return dispatch("yq_simple_wall", args);
}

// ── yq_areawall: Wall from closed area ──
export const yqAreawallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqAreawall(args: Record<string, unknown>) {
  return dispatch("yq_areawall", args);
}

// ── yq_line2wall: Convert lines to walls ──
export const yqLine2wallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqLine2wall(args: Record<string, unknown>) {
  return dispatch("yq_line2wall", args);
}

// ── yq_wall_chgthk: Change wall thickness ──
export const yqWallChgthkSchema = {};
export async function handleYqWallChgthk(args: Record<string, unknown>) {
  return dispatch("yq_wall_chgthk", args);
}

// ── yq_trim_fix_wall: Trim/fix wall intersections ──
export const yqTrimFixWallSchema = {};
export async function handleYqTrimFixWall(args: Record<string, unknown>) {
  return dispatch("yq_trim_fix_wall", args);
}

// ── yq_erase_wall: Delete wall/column/door ──
export const yqEraseWallSchema = {};
export async function handleYqEraseWall(args: Record<string, unknown>) {
  return dispatch("yq_erase_wall", args);
}

// ── yq_partitionwall: Partition wall ──
export const yqPartitionwallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqPartitionwall(args: Record<string, unknown>) {
  return dispatch("yq_partitionwall", args);
}

// ── yq_curtainwall: Curtain wall ──
export const yqCurtainwallSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqCurtainwall(args: Record<string, unknown>) {
  return dispatch("yq_curtainwall", args);
}

// ── yq_doubleline: Double line ──
export const yqDoublelineSchema = {
  layer: z.string().optional().describe("Target layer (optional)"),
};
export async function handleYqDoubleline(args: Record<string, unknown>) {
  return dispatch("yq_doubleline", args);
}

// ── yq_trimdoubleline: Trim double line ──
export const yqTrimDoublelineSchema = {};
export async function handleYqTrimDoubleline(args: Record<string, unknown>) {
  return dispatch("yq_trimdoubleline", args);
}
