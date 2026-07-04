import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@ns/shared";

export function useApiResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const refresh = useCallback(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    void load()
      .then((nextData) => {
        if (!mountedRef.current || requestIdRef.current !== requestId) return;
        setData(nextData);
      })
      .catch((err) => {
        if (!mountedRef.current || requestIdRef.current !== requestId) return;
        setError(getErrorMessage(err, "请求失败，请稍后重试"));
        setData(null);
      })
      .finally(() => {
        if (!mountedRef.current || requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resource hook: initial load triggers refresh which calls setState
    refresh();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [refresh]);

  return { data, error, loading, refresh };
}
