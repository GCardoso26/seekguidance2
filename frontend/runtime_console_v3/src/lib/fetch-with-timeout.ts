export async function fetchWithTimeout<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  options: { timeout?: number; retries?: number } = {},
): Promise<T> {
  const { timeout = 8000, retries = 2 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const result = await fetchFn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt === retries) break;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Max retries exceeded");
}
