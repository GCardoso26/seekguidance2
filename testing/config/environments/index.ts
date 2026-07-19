import { betaEnvironment } from "./beta.ts";
import { ciEnvironment } from "./ci.ts";
import { localEnvironment } from "./local.ts";
import { productionEnvironment } from "./production.ts";
import { stagingEnvironment } from "./staging.ts";
import {
  resolveTestEnvironment,
  type EnvironmentConfig,
  type TestEnvironmentId,
} from "./types.ts";

const REGISTRY: Record<TestEnvironmentId, EnvironmentConfig> = {
  local: localEnvironment,
  ci: ciEnvironment,
  staging: stagingEnvironment,
  beta: betaEnvironment,
  production: productionEnvironment,
};

export function getEnvironmentConfig(
  env: NodeJS.ProcessEnv = process.env,
): EnvironmentConfig {
  return REGISTRY[resolveTestEnvironment(env)];
}

export {
  resolveTestEnvironment,
  type EnvironmentConfig,
  type TestEnvironmentId,
};
export {
  localEnvironment,
  ciEnvironment,
  stagingEnvironment,
  betaEnvironment,
  productionEnvironment,
};
