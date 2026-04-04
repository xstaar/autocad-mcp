import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqHatchQuickSchema = {
  pattern: z.string().describe("Nom du motif de hachure (ex: ANSI31, AR-CONC, SOLID)"),
  scale: z.number().optional().describe("Échelle du motif (défaut: 1)"),
  angle: z.number().optional().describe("Angle du motif en degrés (défaut: 0)"),
  pick_point: pointSchema.optional().describe("Point intérieur pour détection auto de contour"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqInsulationSchema = {
  points: z.array(pointSchema).describe("Points définissant la zone d'isolation"),
  thickness: z.number().optional().describe("Épaisseur de l'isolation en mm"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqStonetileSchema = {
  area_point: pointSchema.describe("Point intérieur de la zone à carreler"),
  tile_width: z.number().describe("Largeur du carreau en mm"),
  tile_height: z.number().describe("Hauteur du carreau en mm"),
  angle: z.number().optional().describe("Angle de pose en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqWoodflooringSchema = {
  area_point: pointSchema.describe("Point intérieur de la zone"),
  plank_width: z.number().describe("Largeur de lame en mm"),
  plank_length: z.number().describe("Longueur de lame en mm"),
  angle: z.number().optional().describe("Angle de pose en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqHatchQuick(args: Record<string, unknown>) {
  return dispatch("YQ_HATCH_QUICK", { ...args, scale: args.scale ?? 1, angle: args.angle ?? 0 });
}
export async function handleYqInsulation(args: Record<string, unknown>) {
  return dispatch("YQ_INSULATION", args);
}
export async function handleYqStonetile(args: Record<string, unknown>) {
  return dispatch("YQ_STONETILE", args);
}
export async function handleYqWoodflooring(args: Record<string, unknown>) {
  return dispatch("YQ_WOODFLOORING", args);
}
