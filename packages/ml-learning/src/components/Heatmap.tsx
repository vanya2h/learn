import { format, getDay, subDays } from "date-fns";
import { useStore } from "../store";

const CELL = 11;
const GAP = 2;
const COLS = 53;
const ROWS = 7;
const LABEL_W = 28;
const LABEL_H = 18;

function intensity(minutes: number, taskCount: number) {
  const effective = minutes === 0 && taskCount > 0 ? 1 : minutes;
  if (effective === 0) return 0;
  if (effective < 30) return 1;
  if (effective < 60) return 2;
  if (effective < 120) return 3;
  return 4;
}

const COLORS_LIGHT = ["#e5e7eb", "#bbf7d0", "#4ade80", "#16a34a", "#15803d"];
const COLORS_DARK = ["#262626", "#14532d", "#15803d", "#22c55e", "#4ade80"];

function useColorScheme() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function Heatmap() {
  const activity = useStore((s) => s.activity);
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? COLORS_DARK : COLORS_LIGHT;

  const today = new Date();
  const todayDow = getDay(today);
  const totalDays = COLS * ROWS;
  const startDay = subDays(today, totalDays - 1 - (ROWS - 1 - todayDow));

  const grid: Array<{ date: string; col: number; row: number }> = [];
  for (let i = 0; i < totalDays; i++) {
    const d = subDays(today, totalDays - 1 - i);
    const dow = getDay(d);
    const weekIndex = Math.floor(i / ROWS);
    grid.push({ date: format(d, "yyyy-MM-dd"), col: weekIndex, row: dow });
  }

  const monthLabels: Array<{ label: string; x: number }> = [];
  let prevMonth = -1;
  for (let col = 0; col < COLS; col++) {
    const dayIndex = col * ROWS;
    const d = subDays(today, totalDays - 1 - dayIndex);
    const m = d.getMonth();
    if (m !== prevMonth) {
      monthLabels.push({ label: format(d, "MMM"), x: col * (CELL + GAP) });
      prevMonth = m;
    }
  }

  const weekdayLabels = [
    { label: "Mon", row: 1 },
    { label: "Wed", row: 3 },
    { label: "Fri", row: 5 },
  ];

  const svgW = LABEL_W + COLS * (CELL + GAP) - GAP;
  const svgH = LABEL_H + ROWS * (CELL + GAP) - GAP;

  void startDay;

  return (
    <div className="px-6 py-4 overflow-x-auto">
      <svg width={svgW} height={svgH} aria-label="Activity heatmap">
        {monthLabels.map(({ label, x }) => (
          <text key={label + x} x={LABEL_W + x} y={12} fontSize={10} fill={scheme === "dark" ? "#a3a3a3" : "#737373"}>
            {label}
          </text>
        ))}
        {weekdayLabels.map(({ label, row }) => (
          <text
            key={label}
            x={0}
            y={LABEL_H + row * (CELL + GAP) + CELL - 2}
            fontSize={9}
            fill={scheme === "dark" ? "#a3a3a3" : "#737373"}
          >
            {label}
          </text>
        ))}
        {grid.map(({ date, col, row }) => {
          const entry = activity[date];
          const mins = entry?.minutes ?? 0;
          const tasks = entry?.taskIds?.length ?? 0;
          const level = intensity(mins, tasks);
          const x = LABEL_W + col * (CELL + GAP);
          const y = LABEL_H + row * (CELL + GAP);
          return (
            <rect
              key={date}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              rx={2}
              ry={2}
              fill={colors[level]}
              aria-label={`${date}: ${mins} min, ${tasks} tasks`}
            >
              <title>{`${date}: ${mins} min, ${tasks} tasks`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
