import { useState, useEffect } from "react";

/**
 * Adia a atualização do valor por `delay` ms após o último keystroke.
 * Usado para evitar requisições excessivas (RN-02 Req.6).
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
