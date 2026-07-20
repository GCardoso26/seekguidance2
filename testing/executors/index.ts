/**
 * Executors — ponto de entrada para scenarios e simulation.
 * Não chama Beta/Prod; callers devem passar pelo guard.
 */

export { runDeterministicSimulation, DEFAULT_SIMULATION } from "./simulation.ts";
export type { SimulationPlan, SimulationResult } from "./simulation.ts";

export type ExecutorContext = {
  env: "local" | "ci" | "staging";
  dryRun?: boolean;
};

export function assertExecutorEnv(env: string): asserts env is ExecutorContext["env"] {
  if (env !== "local" && env !== "ci" && env !== "staging") {
    throw new Error(`Executor proibido em env=${env} (apenas local|ci|staging)`);
  }
}
