/**
 * TCP reachability (não prova app saudável — só que a porta aceita conexão).
 */
import net from "node:net";

export function tcpReachable(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.on("connect", () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

export function parseUrlHostPort(urlString, defaultPort) {
  try {
    const u = new URL(urlString);
    return {
      host: u.hostname || "127.0.0.1",
      port: u.port ? Number(u.port) : defaultPort,
    };
  } catch {
    return null;
  }
}

export async function httpProbe(url, { timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.status >= 200 && res.status < 400, status: res.status, url };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: 0, url, error: String(err.message || err) };
  }
}
