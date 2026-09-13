import { useCallback, useEffect, useRef } from 'react';

export function useAbortController() {
  const controllerRef = useRef<AbortController | null>(null);

  const getSignal = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return controller.signal;
  }, []);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  return getSignal;
}