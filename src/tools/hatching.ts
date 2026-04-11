import { dispatch } from "../ipc.js";

export const emptySchema = {};

// ── Decoration / Interior ──
export async function handleYqAutofurniture(a: Record<string, unknown>) { return dispatch("yq_autofurniture", a); }
export async function handleYqArrangewc(a: Record<string, unknown>) { return dispatch("yq_arrangewc", a); }
export async function handleYqStonetile(a: Record<string, unknown>) { return dispatch("yq_stonetile", a); }
export async function handleYqWoodflooring(a: Record<string, unknown>) { return dispatch("yq_woodflooring", a); }
export async function handleYqGypsumboard(a: Record<string, unknown>) { return dispatch("yq_gypsumboard", a); }
export async function handleYqInsulation(a: Record<string, unknown>) { return dispatch("yq_insulation", a); }
export async function handleYqAutolamps(a: Record<string, unknown>) { return dispatch("yq_autolamps", a); }
export async function handleYqChest(a: Record<string, unknown>) { return dispatch("yq_chest", a); }
export async function handleYqCupboard(a: Record<string, unknown>) { return dispatch("yq_cupboard", a); }
export async function handleYqCupboardElev(a: Record<string, unknown>) { return dispatch("yq_cupboard_elev", a); }
export async function handleYqBlockboard(a: Record<string, unknown>) { return dispatch("yq_blockboard", a); }
export async function handleYqPlywood(a: Record<string, unknown>) { return dispatch("yq_plywood", a); }
export async function handleYqLighttrough(a: Record<string, unknown>) { return dispatch("yq_lighttrough", a); }
export async function handleYqIndoorElevation(a: Record<string, unknown>) { return dispatch("yq_indoor_elevation", a); }

// ── Hatching ──
export async function handleYqQuickHatch(a: Record<string, unknown>) { return dispatch("yq_quick_hatch", a); }
export async function handleYqHatchTemplate(a: Record<string, unknown>) { return dispatch("yq_hatch_template", a); }
export async function handleYqParamHatch(a: Record<string, unknown>) { return dispatch("yq_param_hatch", a); }
export async function handleYqHatchScale(a: Record<string, unknown>) { return dispatch("yq_hatch_scale", a); }
export async function handleYqHatchClip(a: Record<string, unknown>) { return dispatch("yq_hatch_clip", a); }
export async function handleYqHatchSplit(a: Record<string, unknown>) { return dispatch("yq_hatch_split", a); }
export async function handleYqHatchUnion(a: Record<string, unknown>) { return dispatch("yq_hatch_union", a); }
export async function handleYqFillWallsColumns(a: Record<string, unknown>) { return dispatch("yq_fill_walls", a); }
