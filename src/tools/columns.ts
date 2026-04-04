import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqRColumnSchema = {
  width: z.number().describe("Largeur du poteau en mm (ex: 400)"),
  height: z.number().describe("Profondeur du poteau en mm (ex: 600)"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  rotation: z.number().optional().describe("Angle de rotation en degrés (défaut: 0)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqCColumnSchema = {
  diameter: z.number().describe("Diamètre du poteau en mm (ex: 500)"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqLColumnSchema = {
  width1: z.number().describe("Largeur branche 1 en mm"),
  width2: z.number().describe("Largeur branche 2 en mm"),
  thickness: z.number().describe("Épaisseur en mm"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  rotation: z.number().optional().describe("Rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqTColumnSchema = {
  width: z.number().describe("Largeur totale en mm"),
  depth: z.number().describe("Profondeur en mm"),
  flange: z.number().describe("Épaisseur de l'aile en mm"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  rotation: z.number().optional().describe("Rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqOColumnSchema = {
  outer_width: z.number().describe("Largeur extérieure en mm"),
  outer_height: z.number().describe("Hauteur extérieure en mm"),
  wall_thickness: z.number().describe("Épaisseur de paroi en mm"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  rotation: z.number().optional().describe("Rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqAxisColumnSchema = {
  width: z.number().describe("Largeur du poteau en mm"),
  height: z.number().describe("Profondeur du poteau en mm"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqRColumn(args: Record<string, unknown>) {
  return dispatch("YQ_R_COLUMN", args);
}
export async function handleYqCColumn(args: Record<string, unknown>) {
  return dispatch("YQ_C_COLUMN", args);
}
export async function handleYqLColumn(args: Record<string, unknown>) {
  return dispatch("YQ_L_COLUMN", args);
}
export async function handleYqTColumn(args: Record<string, unknown>) {
  return dispatch("YQ_T_COLUMN", args);
}
export async function handleYqOColumn(args: Record<string, unknown>) {
  return dispatch("YQ_O_COLUMN", args);
}
export async function handleYqAxisColumn(args: Record<string, unknown>) {
  return dispatch("YQ_AXIS_COLUMN", args);
}
