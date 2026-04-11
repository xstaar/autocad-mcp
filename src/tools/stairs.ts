import { dispatch } from "../ipc.js";

// ── yq_staircase_plan: Staircase plan view ──
export const yqStaircasePlanSchema = {};
export async function handleYqStaircasePlan(args: Record<string, unknown>) {
  return dispatch("yq_staircase_plan", args);
}

// ── yq_staircase_section: Staircase section view ──
export const yqStaircaseSectionSchema = {};
export async function handleYqStaircaseSection(args: Record<string, unknown>) {
  return dispatch("yq_staircase_section", args);
}

// ── yq_arcstair_plan: Arc/curved staircase plan ──
export const yqArcstairPlanSchema = {};
export async function handleYqArcstairPlan(args: Record<string, unknown>) {
  return dispatch("yq_arcstair_plan", args);
}

// ── yq_escalator: Escalator ──
export const yqEscalatorSchema = {};
export async function handleYqEscalator(args: Record<string, unknown>) {
  return dispatch("yq_escalator", args);
}

// ── yq_lift_plan: Elevator/lift plan ──
export const yqLiftPlanSchema = {};
export async function handleYqLiftPlan(args: Record<string, unknown>) {
  return dispatch("yq_lift_plan", args);
}

// ── yq_banister: Banister/railing ──
export const yqBanisterSchema = {};
export async function handleYqBanister(args: Record<string, unknown>) {
  return dispatch("yq_banister", args);
}
