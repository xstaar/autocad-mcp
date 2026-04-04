import { z } from "zod";
import { dispatch } from "../ipc.js";

export const yqWallSchema = {
  thickness: z.number().describe("Épaisseur du mur en mm (ex: 200 pour 20cm)"),
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .describe("Points de tracé [[x1,y1],[x2,y2],...]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
  close: z.boolean().optional().describe("Fermer le tracé du mur (défaut: false)"),
};

export const yqSimpleWallSchema = {
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .describe("Points de tracé [[x1,y1],[x2,y2],...]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqAreawallSchema = {
  boundary_point: z
    .tuple([z.number(), z.number()])
    .describe("Point intérieur de la zone fermée [x, y]"),
  thickness: z.number().describe("Épaisseur du mur en mm"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqLine2wallSchema = {
  thickness: z.number().describe("Épaisseur du mur en mm"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqWallChgthkSchema = {
  new_thickness: z.number().describe("Nouvelle épaisseur en mm"),
};

export const yqPartitionwallSchema = {
  thickness: z.number().describe("Épaisseur de la cloison en mm (ex: 100)"),
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .describe("Points de tracé [[x1,y1],[x2,y2],...]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqCurtainwallSchema = {
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .describe("Points de tracé du mur-rideau"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDoublelineSchema = {
  thickness: z.number().describe("Épaisseur de la double ligne en mm"),
  points: z
    .array(z.tuple([z.number(), z.number()]))
    .describe("Points de tracé"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqWall(args: Record<string, unknown>) {
  return dispatch("YQ_WALL", args);
}
export async function handleYqSimpleWall(args: Record<string, unknown>) {
  return dispatch("YQ_SIMPLE_WALL", args);
}
export async function handleYqAreawall(args: Record<string, unknown>) {
  return dispatch("YQ_AREAWALL", args);
}
export async function handleYqLine2wall(args: Record<string, unknown>) {
  return dispatch("YQ_LINE2WALL", args);
}
export async function handleYqWallChgthk(args: Record<string, unknown>) {
  return dispatch("YQ_WALL_CHGTHK", args);
}
export async function handleYqPartitionwall(args: Record<string, unknown>) {
  return dispatch("YQ_PARTITIONWALL", args);
}
export async function handleYqCurtainwall(args: Record<string, unknown>) {
  return dispatch("YQ_CURTAINWALL", args);
}
export async function handleYqDoubleline(args: Record<string, unknown>) {
  return dispatch("YQ_DOUBLELINE", args);
}
