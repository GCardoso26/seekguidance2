import { Redis } from "ioredis";
import { Queue } from "bullmq";
import {
  DEFAULT_JOB_OPTIONS,
  PRIORITY_WEIGHT,
  QUEUE_NAMES,
  dlqName,
  type JobPriority,
  type QueueName,
} from "./queues.js";

let sharedConnection: Redis | null = null;

export function redisConnectionFromEnv(): Redis {
  if (!sharedConnection) {
    const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    sharedConnection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return sharedConnection;
}

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName | string): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: redisConnectionFromEnv(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, q);
  }
  return q;
}

export async function enqueue(
  name: QueueName,
  jobName: string,
  data: Record<string, unknown>,
  priority: JobPriority = "NORMAL",
): Promise<string> {
  const queue = getQueue(name);
  const job = await queue.add(jobName, data, {
    ...DEFAULT_JOB_OPTIONS,
    priority: PRIORITY_WEIGHT[priority],
  });
  return String(job.id);
}

export function ensureDlq(name: QueueName): Queue {
  return getQueue(dlqName(name));
}

export function allPrimaryQueues(): QueueName[] {
  return Object.values(QUEUE_NAMES);
}
