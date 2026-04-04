import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqStaircasePlanSchema = {
  start_point: pointSchema.describe("Point de départ de l'escalier [x, y]"),
  width: z.number().describe("Largeur de l'escalier en mm (ex: 1200)"),
  num_risers: z.number().int().describe("Nombre de contremarches"),
  tread_depth: z.number().describe("Profondeur de marche (giron) en mm (ex: 280)"),
  direction: z.enum(["up", "down"]).optional().describe("Direction (défaut: up)"),
  rotation: z.number().optional().describe("Angle de rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqStaircaseSectionSchema = {
  start_point: pointSchema.describe("Point de départ [x, y]"),
  num_risers: z.number().int().describe("Nombre de contremarches"),
  riser_height: z.number().describe("Hauteur de contremarche en mm (ex: 166)"),
  tread_depth: z.number().describe("Profondeur de marche en mm (ex: 280)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqArcstairPlanSchema = {
  center: pointSchema.describe("Centre de l'escalier courbe [x, y]"),
  inner_radius: z.number().describe("Rayon intérieur en mm"),
  outer_radius: z.number().describe("Rayon extérieur en mm"),
  start_angle: z.number().describe("Angle de départ en degrés"),
  end_angle: z.number().describe("Angle de fin en degrés"),
  num_risers: z.number().int().describe("Nombre de contremarches"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqLiftPlanSchema = {
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  width: z.number().describe("Largeur de la cabine en mm (ex: 1600)"),
  depth: z.number().describe("Profondeur de la cabine en mm (ex: 1400)"),
  door_width: z.number().optional().describe("Largeur de porte en mm (défaut: 800)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqBanisterSchema = {
  points: z.array(pointSchema).describe("Points du garde-corps"),
  height: z.number().optional().describe("Hauteur en mm (défaut: 900)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqStaircasePlan(args: Record<string, unknown>) {
  return dispatch("YQ_STAIRCASE_PLAN", args);
}
export async function handleYqStaircaseSection(args: Record<string, unknown>) {
  return dispatch("YQ_STAIRCASE_SECTION", args);
}
export async function handleYqArcstairPlan(args: Record<string, unknown>) {
  return dispatch("YQ_ARCSTAIR_PLAN", args);
}
export async function handleYqLiftPlan(args: Record<string, unknown>) {
  return dispatch("YQ_LIFT_PLAN", args);
}
export async function handleYqBanister(args: Record<string, unknown>) {
  return dispatch("YQ_BANISTER", args);
}
export async function handleYqEscalator(args: Record<string, unknown>) {
  return dispatch("YQ_ESCALATOR", args);
}
