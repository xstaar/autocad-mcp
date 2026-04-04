import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqDimAutoSchema = {
  selection_area: z.object({
    min: pointSchema.describe("Point minimum [x, y]"),
    max: pointSchema.describe("Point maximum [x, y]"),
  }).optional().describe("Zone de sélection pour cotation auto"),
  side: z.enum(["top", "bottom", "left", "right", "all"]).optional()
    .describe("Côté à coter (défaut: all)"),
  include_openings: z.boolean().optional()
    .describe("Inclure portes/fenêtres (défaut: true)"),
  offset: z.number().optional()
    .describe("Décalage de la ligne de cote en mm (défaut: 800)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqGridaxisSchema = {
  origin: pointSchema.describe("Point d'origine de la grille [x, y]"),
  x_spacings: z.array(z.number())
    .describe("Espacements horizontaux en mm (ex: [6000, 3600, 6000])"),
  y_spacings: z.array(z.number())
    .describe("Espacements verticaux en mm (ex: [6000, 6000])"),
  x_labels: z.array(z.string()).optional()
    .describe('Labels axes X (défaut: "1","2","3"...)'),
  y_labels: z.array(z.string()).optional()
    .describe('Labels axes Y (défaut: "A","B","C"...)'),
  bubble_size: z.number().optional()
    .describe("Diamètre des bulles en mm (défaut: 800)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDimLinearSchema = {
  point1: pointSchema.describe("Premier point [x, y]"),
  point2: pointSchema.describe("Deuxième point [x, y]"),
  dim_line_point: pointSchema.describe("Position de la ligne de cote [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDimAlignedSchema = {
  point1: pointSchema.describe("Premier point [x, y]"),
  point2: pointSchema.describe("Deuxième point [x, y]"),
  dim_line_point: pointSchema.describe("Position de la ligne de cote [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDimContinueSchema = {
  points: z.array(pointSchema).describe("Points successifs à coter"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqDimBaselineSchema = {
  points: z.array(pointSchema).describe("Points à coter depuis la base"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqAutoAxisDimSchema = {
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqAxislinesSchema = {
  points: z.array(pointSchema).describe("Points pour la ligne d'axe"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqDimAuto(args: Record<string, unknown>) {
  return dispatch("YQ_DIM_AUTO", {
    ...args,
    side: args.side ?? "all",
    include_openings: args.include_openings ?? true,
    offset: args.offset ?? 800,
  });
}
export async function handleYqGridaxis(args: Record<string, unknown>) {
  return dispatch("YQ_GRIDAXIS", {
    ...args,
    bubble_size: args.bubble_size ?? 800,
  });
}
export async function handleYqDimLinear(args: Record<string, unknown>) {
  return dispatch("YQ_DIM_LINEAR", args);
}
export async function handleYqDimAligned(args: Record<string, unknown>) {
  return dispatch("YQ_DIM_ALIGNED", args);
}
export async function handleYqDimContinue(args: Record<string, unknown>) {
  return dispatch("YQ_DIM_CONTINUE", args);
}
export async function handleYqDimBaseline(args: Record<string, unknown>) {
  return dispatch("YQ_DIM_BASELINE", args);
}
export async function handleYqAutoAxisDim(args: Record<string, unknown>) {
  return dispatch("YQ_AUTO_AXIS_DIM", args);
}
export async function handleYqAxisline(args: Record<string, unknown>) {
  return dispatch("YQ_AXISLINE", args);
}
