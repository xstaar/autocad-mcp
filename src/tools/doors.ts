import { z } from "zod";
import { dispatch } from "../ipc.js";

const pointSchema = z.tuple([z.number(), z.number()]);

export const yqDoorSchema = {
  width: z.number().describe("Largeur de la porte en mm (ex: 900)"),
  height: z.number().optional().describe("Hauteur en mm (défaut: 2100)"),
  insertion_point: pointSchema.describe("Point d'insertion sur le mur [x, y]"),
  door_type: z.enum(["single", "double", "sliding", "pocket"]).optional()
    .describe("Type: single, double, sliding (coulissante), pocket (galandage). Défaut: single"),
  opening_side: z.enum(["left", "right"]).optional().describe("Côté d'ouverture (défaut: left)"),
  opening_angle: z.number().optional().describe("Angle d'ouverture en degrés (défaut: 90)"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqWindowSchema = {
  width: z.number().describe("Largeur de la fenêtre en mm (ex: 1500)"),
  height: z.number().optional().describe("Hauteur en mm (défaut: 1500)"),
  sill_height: z.number().optional().describe("Hauteur d'allège en mm (défaut: 900)"),
  insertion_point: pointSchema.describe("Point d'insertion sur le mur [x, y]"),
  window_type: z.enum(["fixed", "casement", "sliding", "awning"]).optional()
    .describe("Type: fixed, casement (battante), sliding, awning (soufflet). Défaut: casement"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqWindowdoorSchema = {
  width: z.number().describe("Largeur de la porte-fenêtre en mm"),
  insertion_point: pointSchema.describe("Point d'insertion sur le mur [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqHoleDoorSchema = {
  width: z.number().describe("Largeur du percement en mm"),
  insertion_point: pointSchema.describe("Point sur le mur [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqHoleWindowSchema = {
  width: z.number().describe("Largeur du percement en mm"),
  insertion_point: pointSchema.describe("Point sur le mur [x, y]"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export const yqGlassPartitionSchema = {
  points: z.array(pointSchema).describe("Points de tracé de la cloison vitrée"),
  layer: z.string().optional().describe("Calque cible (optionnel)"),
};

export async function handleYqDoor(args: Record<string, unknown>) {
  return dispatch("YQ_DOOR", {
    ...args,
    height: args.height ?? 2100,
    door_type: args.door_type ?? "single",
    opening_side: args.opening_side ?? "left",
    opening_angle: args.opening_angle ?? 90,
  });
}
export async function handleYqWindow(args: Record<string, unknown>) {
  return dispatch("YQ_WINDOW", {
    ...args,
    height: args.height ?? 1500,
    sill_height: args.sill_height ?? 900,
    window_type: args.window_type ?? "casement",
  });
}
export async function handleYqWindowdoor(args: Record<string, unknown>) {
  return dispatch("YQ_WINDOWDOOR", args);
}
export async function handleYqHoleDoor(args: Record<string, unknown>) {
  return dispatch("YQ_HOLE_DOOR", args);
}
export async function handleYqHoleWindow(args: Record<string, unknown>) {
  return dispatch("YQ_HOLE_WIN", args);
}
export async function handleYqGlassPartition(args: Record<string, unknown>) {
  return dispatch("YQ_GLASS_PARTITION", args);
}
