import Redis from "ioredis";

async function tryUrl(url: string): Promise<void> {
  const r = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true });
  try {
    await r.connect();
    console.log(JSON.stringify({ url, ok: true, ping: await r.ping() }));
    await r.quit();
  } catch (e) {
    console.log(JSON.stringify({ url, ok: false, error: (e as Error).message.slice(0, 120) }));
    try {
      r.disconnect();
    } catch {
      /* ignore */
    }
  }
}

async function main(): Promise<void> {
  const urls = [
    process.env.REDIS_URL,
    "redis://127.0.0.1:6379",
    "redis://127.0.0.1:6380",
    "redis://localhost:6379/0",
    "redis://localhost:6380/0",
  ].filter((u, i, a): u is string => Boolean(u) && a.indexOf(u) === i);
  for (const url of urls) await tryUrl(url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
