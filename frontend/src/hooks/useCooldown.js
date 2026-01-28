import { useState, useEffect, useCallback, useRef } from "react";
import { useContract } from "./useContract";

export function useCooldown() {
  const { fetchCooldown } = useContract();
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      const seconds = await fetchCooldown();

      if (seconds > 0) {
        let timeLeft = seconds;
        setRemaining(timeLeft);

        intervalRef.current = setInterval(() => {
          timeLeft -= 1;
          if (timeLeft <= 0) {
            setRemaining(0);
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          } else {
            setRemaining(timeLeft);
          }
        }, 1000);
      } else {
        setRemaining(0);
      }
    } catch {
      setRemaining(0);
    }
  }, [fetchCooldown]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatted = (() => {
    if (remaining <= 0) return null;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    return `${min}m ${sec < 10 ? "0" : ""}${sec}s`;
  })();

  return { remaining, formatted, refresh };
}
