/**
 * Generic tool to execute ANY of the 684 YQArch commands.
 * This is the catch-all for commands that don't have a dedicated typed tool.
 */

import { z } from "zod";
import { dispatch } from "../ipc.js";
import { categories, allCommandNames, commandIndex } from "../commands.js";

// ─── yq_execute: run any YQ command ───

export const yqExecuteSchema = {
  command: z.string().describe(
    "Nom de la commande YQArch (ex: YQ_WALL, YQ_DOOR, YQ_DIM_AUTO). " +
    "Utilisez yq_list_commands pour découvrir les commandes disponibles."
  ),
  params: z.record(z.string(), z.unknown()).optional().describe(
    "Paramètres de la commande sous forme d'objet JSON. " +
    "Les clés/valeurs dépendent de la commande."
  ),
};

export async function handleYqExecute(args: {
  command: string;
  params?: Record<string, unknown>;
}) {
  const cmd = args.command.toUpperCase();

  if (!allCommandNames.has(cmd)) {
    return {
      ok: false,
      request_id: "",
      payload: {},
      error: `Commande inconnue: ${args.command}. Utilisez yq_list_commands pour voir les commandes disponibles.`,
    };
  }

  return dispatch(cmd, args.params ?? {});
}

// ─── yq_list_commands: discover available commands ───

export const yqListCommandsSchema = {
  category: z.string().optional().describe(
    "Filtrer par catégorie (ex: walls, doors_windows, columns, stairs, dimensions, " +
    "grid_axes, hatching, layers, blocks, text, text_edit, area_calc, editing, " +
    "curves, viewports, interior, drawing_export, match_properties, construction, " +
    "groups, system, misc). Sans filtre = toutes les catégories."
  ),
  search: z.string().optional().describe(
    "Rechercher une commande par mot-clé dans le nom ou la description"
  ),
};

export function handleYqListCommands(args: {
  category?: string;
  search?: string;
}) {
  let results = categories;

  // Filter by category
  if (args.category) {
    results = results.filter((c) => c.id === args.category);
    if (results.length === 0) {
      return {
        ok: false,
        request_id: "",
        payload: {
          error: `Catégorie inconnue: ${args.category}`,
          available_categories: categories.map((c) => ({
            id: c.id,
            label: c.label,
            count: c.commands.length,
          })),
        },
      };
    }
  }

  // Search by keyword
  if (args.search) {
    const q = args.search.toLowerCase();
    results = results
      .map((cat) => ({
        ...cat,
        commands: cat.commands.filter(
          (cmd) =>
            cmd.name.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.commands.length > 0);
  }

  const output = results.map((cat) => ({
    category: cat.id,
    label: cat.label,
    description: cat.description,
    command_count: cat.commands.length,
    commands: cat.commands,
  }));

  const totalCommands = output.reduce((s, c) => s + c.command_count, 0);

  return {
    ok: true,
    request_id: "local",
    payload: {
      total_commands: totalCommands,
      total_categories: output.length,
      categories: output,
    },
  };
}
