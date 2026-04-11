/**
 * Generic tool to execute ANY YQArch command by name.
 * Fallback for commands that don't have a dedicated typed tool.
 */

import { z } from "zod";
import { dispatch } from "../ipc.js";
import { categories, allCommandNames } from "../commands.js";

// ─── yq_execute: run any command ───

export const yqExecuteSchema = {
  command: z.string().describe(
    "YQArch function name (e.g. yq_wall, yq_hole_door, yq_r_column). " +
    "Use yq_list_commands to discover available commands."
  ),
  params: z.record(z.string(), z.unknown()).optional().describe(
    "Optional parameters as JSON object (e.g. {\"layer\": \"Walls\"})"
  ),
};

export async function handleYqExecute(args: {
  command: string;
  params?: Record<string, unknown>;
}) {
  const cmd = args.command.toLowerCase();

  if (!allCommandNames.has(cmd)) {
    return {
      ok: false,
      request_id: "",
      payload: {},
      error: `Unknown command: ${args.command}. Use yq_list_commands to see available commands.`,
    };
  }

  return dispatch(cmd, args.params ?? {});
}

// ─── yq_list_commands: discover available commands ───

export const yqListCommandsSchema = {
  category: z.string().optional().describe(
    "Filter by category: walls, columns, doors, windows, stairs, decoration, " +
    "grid_axes, dimensions, symbols, text, tools, layers"
  ),
  search: z.string().optional().describe(
    "Search commands by keyword in name or description"
  ),
};

export function handleYqListCommands(args: {
  category?: string;
  search?: string;
}) {
  let results = categories;

  if (args.category) {
    results = results.filter((c) => c.id === args.category);
    if (results.length === 0) {
      return {
        ok: false,
        request_id: "",
        payload: {
          error: `Unknown category: ${args.category}`,
          available_categories: categories.map((c) => ({
            id: c.id,
            label: c.label,
            count: c.commands.length,
          })),
        },
      };
    }
  }

  if (args.search) {
    const q = args.search.toLowerCase();
    results = results
      .map((cat) => ({
        ...cat,
        commands: cat.commands.filter(
          (cmd) =>
            cmd.name.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.shortcut.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.commands.length > 0);
  }

  const output = results.map((cat) => ({
    category: cat.id,
    label: cat.label,
    command_count: cat.commands.length,
    commands: cat.commands.map((c) => ({
      name: c.name,
      shortcut: c.shortcut || "-",
      description: c.description,
      importance: c.importance,
    })),
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
