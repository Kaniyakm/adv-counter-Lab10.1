import React, { useState } from "react";

export default function AdvancedCounter() {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const updateCount = (newCount: number) => {
    setCount(newCount);
    setHistory((prev) => [...prev, newCount]);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Step 1: Core Counter</h2>

      <div>
        <button onClick={() => updateCount(count - 1)}>Decrement</button>
        <span style={{ margin: "0 1rem" }}>{count}</span>
        <button onClick={() => updateCount(count + 1)}>Increment</button>
      </div>

      <h3>History</h3>
      <p>{history.join(", ")}</p>
    </div>
  );
}
