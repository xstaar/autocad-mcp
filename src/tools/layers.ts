import { z } from "zod";
import { dispatch } from "../ipc.js";

// ── layer_new: Create a new layer ──
export const yqLayerNewSchema = {
  name: z.string().describe("Layer name to create"),
};
export async function handleYqLayerNew(args: Record<string, unknown>) {
  return dispatch("layer_new", args);
}

// ── layer_current: Set current layer ──
export const yqLayerCurrentSchema = {
  name: z.string().describe("Layer name to set as current"),
};
export async function handleYqLayerCurrent(args: Record<string, unknown>) {
  return dispatch("layer_current", args);
}

// ── layer_off: Turn off a layer ──
export const yqLayerOnOffSchema = {
  name: z.string().describe("Layer name"),
};
export async function handleYqLayerOff(args: Record<string, unknown>) {
  return dispatch("layer_off", args);
}

// ── layer_on: Turn on a layer ──
export async function handleYqLayerOn(args: Record<string, unknown>) {
  return dispatch("layer_on", args);
}

// ── layer_freeze: Freeze a layer ──
export async function handleYqLayerFreeze(args: Record<string, unknown>) {
  return dispatch("layer_freeze", args);
}

// ── layer_thaw: Thaw a layer ──
export async function handleYqLayerThaw(args: Record<string, unknown>) {
  return dispatch("layer_thaw", args);
}

// ── layer_showall: Show all layers ──
export async function handleYqLayerShowall(args: Record<string, unknown>) {
  return dispatch("layer_showall", {});
}

// ── yq_layertools: YQArch layer management dialog ──
export async function handleYqLayertools(args: Record<string, unknown>) {
  return dispatch("yq_layertools", {});
}
