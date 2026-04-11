import { dispatch } from "../ipc.js";

// ── yq_text: Insert text annotation ──
export const yqTextSchema = {};
export async function handleYqText(args: Record<string, unknown>) {
  return dispatch("yq_text", args);
}

// ── yq_text_replace: Find and replace text ──
export const yqTextReplaceSchema = {};
export async function handleYqTextReplace(args: Record<string, unknown>) {
  return dispatch("yq_text_replace", args);
}

// ── yq_changetext: Modify text properties ──
export const yqChangetextSchema = {};
export async function handleYqChangetext(args: Record<string, unknown>) {
  return dispatch("yq_changetext", args);
}

// ── yq_leader: Arrow leader with text ──
export const yqLeaderSchema = {};
export async function handleYqLeader(args: Record<string, unknown>) {
  return dispatch("yq_leader", args);
}

// ── yq_drawingtitle: Drawing title block ──
export const yqDrawingtitleSchema = {};
export async function handleYqDrawingtitle(args: Record<string, unknown>) {
  return dispatch("yq_drawingtitle", args);
}

// ── yq_designed_elevation: Elevation level marker ──
export const yqElevationSchema = {};
export async function handleYqElevation(args: Record<string, unknown>) {
  return dispatch("yq_designed_elevation", args);
}

// ── yq_symbol_sectioncutter: Section cut symbol ──
export const yqSectionSymbolSchema = {};
export async function handleYqSectionSymbol(args: Record<string, unknown>) {
  return dispatch("yq_symbol_sectioncutter", args);
}

// ── yq_entrancearrow: Entrance arrow ──
export const yqEntrancearrowSchema = {};
export async function handleYqEntrancearrow(args: Record<string, unknown>) {
  return dispatch("yq_entrancearrow", args);
}

// ── yq_alignment: Align elements ──
export const yqAlignmentSchema = {};
export async function handleYqAlignment(args: Record<string, unknown>) {
  return dispatch("yq_alignment", args);
}

// ── yq_transform: Transform/scale ──
export const yqTransformSchema = {};
export async function handleYqTransform(args: Record<string, unknown>) {
  return dispatch("yq_transform", args);
}
