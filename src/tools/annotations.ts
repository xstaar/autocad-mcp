import { dispatch } from "../ipc.js";

export const emptySchema = {};

// ── Text ──
export async function handleYqText(a: Record<string, unknown>) { return dispatch("yq_text", a); }
export async function handleYqTextEdit(a: Record<string, unknown>) { return dispatch("yq_text_edit", a); }
export async function handleYqTextReplace(a: Record<string, unknown>) { return dispatch("yq_text_replace", a); }
export async function handleYqChangetext(a: Record<string, unknown>) { return dispatch("yq_changetext", a); }
export async function handleYqChangeHeight(a: Record<string, unknown>) { return dispatch("yq_change_height", a); }
export async function handleYqTextStyle(a: Record<string, unknown>) { return dispatch("yq_text_style", a); }
export async function handleYqSetTextStyle(a: Record<string, unknown>) { return dispatch("yq_set_text_style", a); }
export async function handleYqCreateTexts(a: Record<string, unknown>) { return dispatch("yq_create_texts", a); }

// ── Leaders ──
export async function handleYqLeader(a: Record<string, unknown>) { return dispatch("yq_leader", a); }
export async function handleYqMultiLeader(a: Record<string, unknown>) { return dispatch("yq_multi_leader", a); }
export async function handleYqVertLeader(a: Record<string, unknown>) { return dispatch("yq_vert_leader", a); }

// ── Architectural symbols ──
export async function handleYqDesignedElevation(a: Record<string, unknown>) { return dispatch("yq_designed_elevation", a); }
export async function handleYqContourElevation(a: Record<string, unknown>) { return dispatch("yq_contour_elevation", a); }
export async function handleYqSectionCutter(a: Record<string, unknown>) { return dispatch("yq_symbol_sectioncutter", a); }
export async function handleYqSectionPlane(a: Record<string, unknown>) { return dispatch("yq_section_plane", a); }
export async function handleYqSlope(a: Record<string, unknown>) { return dispatch("yq_slope", a); }
export async function handleYqDisconnection(a: Record<string, unknown>) { return dispatch("yq_disconnection", a); }
export async function handleYqEntrancearrow(a: Record<string, unknown>) { return dispatch("yq_entrancearrow", a); }
export async function handleYqBentArrow(a: Record<string, unknown>) { return dispatch("yq_bent_arrow", a); }
export async function handleYqDrawingtitle(a: Record<string, unknown>) { return dispatch("yq_drawingtitle", a); }
export async function handleYqSymmetryAxis(a: Record<string, unknown>) { return dispatch("yq_symmetry_axis", a); }
export async function handleYqGeodesic(a: Record<string, unknown>) { return dispatch("yq_geodesic", a); }
export async function handleYqDrawingFrame(a: Record<string, unknown>) { return dispatch("yq_drawingframe", a); }
export async function handleYqScale(a: Record<string, unknown>) { return dispatch("yq_scale", a); }

// ── Index symbols ──
export async function handleYqSectionSym1(a: Record<string, unknown>) { return dispatch("yq_section_sym1", a); }
export async function handleYqSectionSym2(a: Record<string, unknown>) { return dispatch("yq_section_sym2", a); }
export async function handleYqDetailSym1(a: Record<string, unknown>) { return dispatch("yq_detail_sym1", a); }
export async function handleYqDetailSym2(a: Record<string, unknown>) { return dispatch("yq_detail_sym2", a); }
export async function handleYqElevIndexer(a: Record<string, unknown>) { return dispatch("yq_elev_indexer_4in1", a); }

// ── Extra tools ──
export async function handleYqAlignment(a: Record<string, unknown>) { return dispatch("yq_alignment", a); }
export async function handleYqTransform(a: Record<string, unknown>) { return dispatch("yq_transform", a); }
export async function handleYqBoundingBox(a: Record<string, unknown>) { return dispatch("yq_bounding_box", a); }

// ── Statistics ──
export async function handleYqAutoSerial(a: Record<string, unknown>) { return dispatch("yq_auto_serial", a); }
export async function handleYqWindoorList(a: Record<string, unknown>) { return dispatch("yq_windoor_list", a); }
export async function handleYqAccumArea(a: Record<string, unknown>) { return dispatch("yq_accum_area", a); }
export async function handleYqBuildingArea(a: Record<string, unknown>) { return dispatch("yq_building_area", a); }
export async function handleYqFilteredSelect(a: Record<string, unknown>) { return dispatch("yq_filtered_select", a); }
