import { useState } from "react";
import { useStore } from "../store";

export function SessionLogger() {
  const [minutes, setMinutes] = useState("");
  const logMinutes = useStore((s) => s.logMinutes);

  function handleLog() {
    const val = parseInt(minutes, 10);
    if (!isNaN(val) && val > 0) {
      logMinutes(val);
      setMinutes("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleLog();
  }

  return (
    <section className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600 dark:text-neutral-400 shrink-0">Log today&apos;s study session:</span>
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="minutes"
          className="w-24 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleLog}
          className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          Log
        </button>
      </div>
    </section>
  );
}
