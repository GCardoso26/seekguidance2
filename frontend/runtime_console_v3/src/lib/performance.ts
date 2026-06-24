export function withPerformanceTracking<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  label: string,
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      }
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[Performance] ${label} FAILED after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}
