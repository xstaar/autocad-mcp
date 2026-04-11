import { dispatch } from "../ipc.js";

export const emptySchema = {};

export async function handleYqStaircasePlan(a: Record<string, unknown>) { return dispatch("yq_staircase_plan", a); }
export async function handleYqStaircaseSection(a: Record<string, unknown>) { return dispatch("yq_staircase_section", a); }
export async function handleYqArcstairPlan(a: Record<string, unknown>) { return dispatch("yq_arcstair_plan", a); }
export async function handleYqEscalator(a: Record<string, unknown>) { return dispatch("yq_escalator", a); }
export async function handleYqLiftPlan(a: Record<string, unknown>) { return dispatch("yq_lift_plan", a); }
export async function handleYqBanister(a: Record<string, unknown>) { return dispatch("yq_banister", a); }
export async function handleYqStepsSection(a: Record<string, unknown>) { return dispatch("yq_steps_section", a); }
export async function handleYqWaterproofSection(a: Record<string, unknown>) { return dispatch("yq_waterproof_section", a); }
export async function handleYqStuccoSection(a: Record<string, unknown>) { return dispatch("yq_stucco_section", a); }
