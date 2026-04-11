import { z } from "zod";
import { dispatch } from "../ipc.js";

export const emptySchema = {};

export const layerNameSchema = {
  name: z.string().describe("Layer name"),
};

// ── YQArch Layer Tools (real shortcuts from PDF) ──
export async function handleYqLayerNew(a: Record<string, unknown>) { return dispatch("yq_layer_new", a); }
export async function handleYqLayerCurrent(a: Record<string, unknown>) { return dispatch("yq_layer_current", a); }
export async function handleYqLayerToCurrent(a: Record<string, unknown>) { return dispatch("yq_layer_to_current", a); }
export async function handleYqLayerOff(a: Record<string, unknown>) { return dispatch("yq_layer_off", a); }
export async function handleYqLayerOffAll(a: Record<string, unknown>) { return dispatch("yq_layer_off_all", a); }
export async function handleYqLayerOn(a: Record<string, unknown>) { return dispatch("yq_layer_on", a); }
export async function handleYqLayerOnAll(a: Record<string, unknown>) { return dispatch("yq_layer_on_all", a); }
export async function handleYqLayerFreeze(a: Record<string, unknown>) { return dispatch("yq_layer_freeze", a); }
export async function handleYqLayerThaw(a: Record<string, unknown>) { return dispatch("yq_layer_thaw", a); }
export async function handleYqLayerThawAll(a: Record<string, unknown>) { return dispatch("yq_layer_thaw_all", a); }
export async function handleYqLayerIsolate(a: Record<string, unknown>) { return dispatch("yq_layer_isolate", a); }
export async function handleYqLayerLock(a: Record<string, unknown>) { return dispatch("yq_layer_lock", a); }
export async function handleYqLayerUnlock(a: Record<string, unknown>) { return dispatch("yq_layer_unlock", a); }
export async function handleYqLayerToggle(a: Record<string, unknown>) { return dispatch("yq_layer_toggle", a); }
export async function handleYqLayerMerge(a: Record<string, unknown>) { return dispatch("yq_layer_merge", a); }
export async function handleYqLayerBatchReplace(a: Record<string, unknown>) { return dispatch("yq_layer_batch_replace", a); }
export async function handleYqLayerBatchRename(a: Record<string, unknown>) { return dispatch("yq_layer_batch_rename", a); }
export async function handleYqLayerSaveRestore(a: Record<string, unknown>) { return dispatch("yq_layer_save_restore", a); }
