import { useEffect, useState } from 'react';

/**
 * GET an /api path from the Worker (worker/index.ts), typed with shared/api.ts:
 *   const { data, error, loading, retry } = useApi<Stats>('/api/stats');
 * Small on purpose. If the app grows into caching, mutations and refetching, TanStack Query is the usual next step.
 */
export function useApi<T>(path: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: T; error?: string }>();
  const key = `${path}#${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(path, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${path} answered ${res.status}`);
        return (await res.json()) as T;
      })
      .then(
        (data) => setResult({ key, data }),
        (e: Error) => {
          if (!controller.signal.aborted) setResult({ key, error: e.message });
        }
      );
    return () => controller.abort();
  }, [path, key]);

  const current = result?.key === key ? result : undefined;
  return { data: current?.data, error: current?.error, loading: !current, retry: () => setAttempt((n) => n + 1) };
}
