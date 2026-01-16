import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * AdvancedCounter
 *
 * Features:
 * - current count with initial value from localStorage
 * - increment / decrement by step (configurable)
 * - history tracking (in-memory)
 * - auto-save current count to localStorage with debounce + cleanup
 * - keyboard handlers for ArrowUp / ArrowDown (cleaned up on unmount)
 * - reset clears count, history and saved value
 */


const STORAGE_KEY = "advanced-counter-count";

const AdvancedCounter: React.FC = () => {
  // Initialize count from localStorage if present
  const [count, setCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw !== null ? Number(raw) : 0;
    } catch {
      return 0;
    }
  });

  // History of counts (each change appends a new entry)
  const [history, setHistory] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const initial = raw !== null ? Number(raw) : 0;
      return [initial];
    } catch {
      return [0];
    }
  });

  // Step controls how much +/- changes the count
  const [step, setStep] = useState<number>(1);

  // Saving indicator (shows when a debounced save is pending)
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Refs
  const stepRef = useRef<number>(step);
  const saveTimerRef = useRef<number | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  // keep stepRef in sync with step state (so keyboard handler uses the latest step)
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Update history whenever count changes
  useEffect(() => {
    setHistory((prev) => {
      // Optionally avoid consecutive duplicate entries
      if (prev.length > 0 && prev[prev.length - 1] === count) return prev;
      return [...prev, count];
    });
  }, [count]);

  // Auto-save current count to localStorage with debounce and cleanup
  useEffect(() => {
    // Mark component mount/unmount status for safety
    isUnmountedRef.current = false;

    // If a previous save timer exists, clear it (debounce)
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setIsSaving(true);

    // Start a debounced save
    const delay = 400; // ms
    const timerId = window.setTimeout(() => {
      // If component unmounted before timer fired, do nothing
      if (isUnmountedRef.current) return;

      try {
        localStorage.setItem(STORAGE_KEY, String(count));
      } catch {
        // ignore localStorage errors (private mode / quotas)
      } finally {
        if (!isUnmountedRef.current) {
          setIsSaving(false);
        }
      }

      saveTimerRef.current = null;
    }, delay);

    saveTimerRef.current = timerId as unknown as number;

    // Cleanup: cancel pending save if count changes again or component unmounts
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      // If effect is cleaned up because component unmounted, prevent later setState
      // and clear saving indicator
      if (!isUnmountedRef.current) {
        setIsSaving(false);
      }
    };
  }, [count]);

  // Track unmount to avoid setting state after unmount in any async callbacks
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      // ensure any pending timer is cleared on unmount
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  // Keyboard listeners for ArrowUp / ArrowDown
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        // functional update uses latest count safely
        setCount((c) => c + stepRef.current);
      } else if (e.key === "ArrowDown") {
        setCount((c) => c - stepRef.current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
    // empty dependency array: attach once, rely on refs for latest step
  }, []);

  // Handlers
  const increment = useCallback(() => {
    setCount((c) => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount((c) => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(0);
    setHistory([]); // clear tracked history as required
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleStepChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      setStep(1);
    } else {
      // disallow step 0 — fallback to 1
      const normalized = parsed === 0 ? 1 : parsed;
      setStep(normalized);
    }
  };

  return (
    <div className="container">
      <div className="card" role="region" aria-label="Advanced Counter">
        <h3 className="card-title">Counter</h3>

        <div className="current-count" style={{ textAlign: "center" }}>
          <div style={{ color: "#374151" }}>Current Count:</div>
          <div style={{ fontSize: 36, fontWeight: 700 }} aria-live="polite">
            {count}
          </div>
        </div>

        <div className="controls" style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 16 }}>
          <button className="btn plain" onClick={decrement} aria-label={`Decrement by ${step}`}>
            Decrement
          </button>

          <button className="btn plain" onClick={increment} aria-label={`Increment by ${step}`}>
            Increment
          </button>

          <button className="btn danger" onClick={reset} aria-label="Reset count">
            Reset
          </button>
        </div>

        <div className="step-row" style={{ textAlign: "center", marginTop: 16 }}>
          <label style={{ color: "#6b7280" }}>Step Value:&nbsp;</label>
          <input
            type="number"
            value={step}
            onChange={(e) => handleStepChange(e.target.value)}
            min={1}
            style={{ width: 80, padding: "6px 8px", borderRadius: 4, border: "1px solid #e6e6e6" }}
            aria-label="Step value"
          />
        </div>

        <div className="saving" style={{ textAlign: "center", marginTop: 12, color: "#6b7280" }}>
          <em>{isSaving ? "Saving..." : "Changes saved."}</em>
        </div>

        <hr style={{ marginTop: 18 }} />

        <div className="history" style={{ color: "#374151" }}>
          <strong>Count History:</strong>
          {history.length === 0 ? (
            <div style={{ color: "#6b7280", marginTop: 8 }}>No history yet.</div>
          ) : (
            <ol style={{ marginTop: 8 }}>
              {history.map((h, idx) => (
                <li key={`${h}-${idx}`}>{h}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="hint" style={{ textAlign: "center", marginTop: 12, color: "#6b7280" }}>
          Use ArrowUp to increment and ArrowDown to decrement.
        </div>
      </div>
    </div>
  );
};

export default AdvancedCounter;