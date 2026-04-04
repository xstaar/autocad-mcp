import { z } from "zod";
import { dispatch } from "../ipc.js";

export const yqLayerNewSchema = {
  name: z.string().describe("Nom du nouveau calque"),
  color: z.number().optional().describe("Numéro de couleur ACI (1-255)"),
  linetype: z.string().optional().describe("Type de ligne (ex: DASHED)"),
  lineweight: z.number().optional().describe("Épaisseur de ligne en centièmes de mm"),
};

export const yqLayerCurrentSchema = {
  name: z.string().describe("Nom du calque à rendre courant"),
};

export const yqLayerOnOffSchema = {
  name: z.string().describe("Nom du calque"),
};

export const yqLayerRenameSchema = {
  old_name: z.string().describe("Ancien nom du calque"),
  new_name: z.string().describe("Nouveau nom du calque"),
};

export async function handleYqLayerNew(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_NEW", args);
}
export async function handleYqLayerCurrent(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_CURRENT", args);
}
export async function handleYqLayerOff(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_OFF", args);
}
export async function handleYqLayerOn(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_ON", args);
}
export async function handleYqLayerFreeze(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_FREEZE", args);
}
export async function handleYqLayerThaw(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_THAW", args);
}
export async function handleYqLayerIso(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_ISO", args);
}
export async function handleYqLayerShowall(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_SHOWALL", args);
}
export async function handleYqLayerRename(args: Record<string, unknown>) {
  return dispatch("YQ_LAYER_RENAME", args);
}
