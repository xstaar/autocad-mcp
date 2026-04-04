import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqTextSchema = {
  text: z.string().describe("Contenu du texte"),
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  height: z.number().optional().describe("Hauteur du texte en mm"),
  rotation: z.number().optional().describe("Angle de rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqLeaderSchema = {
  points: z.array(pointSchema).describe("Points de la ligne de repère"),
  text: z.string().describe("Texte du repère"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDrawingtitleSchema = {
  insertion_point: pointSchema.describe("Point d'insertion du cartouche [x, y]"),
  project_name: z.string().optional().describe("Nom du projet"),
  drawing_name: z.string().optional().describe("Nom du plan"),
  scale: z.string().optional().describe("Échelle (ex: 1:100)"),
  date: z.string().optional().describe("Date"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqSymbolSectioncutterSchema = {
  point1: pointSchema.describe("Point de début de la coupe [x, y]"),
  point2: pointSchema.describe("Point de fin de la coupe [x, y]"),
  label: z.string().optional().describe("Label de la coupe (ex: A-A)"),
  direction: z.enum(["left", "right", "up", "down"]).optional()
    .describe("Direction de vue"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqElevindexerSchema = {
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  elevation: z.number().describe("Valeur de la cote de niveau en m (ex: +3.600)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqEntrancearrowSchema = {
  insertion_point: pointSchema.describe("Point d'insertion [x, y]"),
  rotation: z.number().optional().describe("Angle de rotation en degrés"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqText(args: Record<string, unknown>) {
  return dispatch("YQ_TEXT", args);
}
export async function handleYqLeader(args: Record<string, unknown>) {
  return dispatch("YQ_LEADER", args);
}
export async function handleYqDrawingtitle(args: Record<string, unknown>) {
  return dispatch("YQ_DRAWINGTITLE", args);
}
export async function handleYqSymbolSectioncutter(args: Record<string, unknown>) {
  return dispatch("YQ_SYMBOL_SECTIONCUTTER", args);
}
export async function handleYqElevindexer(args: Record<string, unknown>) {
  return dispatch("YQ_ELEVINDEXER1", args);
}
export async function handleYqEntrancearrow(args: Record<string, unknown>) {
  return dispatch("YQ_ENTRANCEARROW", args);
}
