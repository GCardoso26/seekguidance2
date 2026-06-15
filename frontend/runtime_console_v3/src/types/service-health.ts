export type ServiceHealthStatus = "online" | "degraded" | "offline";

export type ServiceHealth = {
  name: string;
  status: ServiceHealthStatus;
};
