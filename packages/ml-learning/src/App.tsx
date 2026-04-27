import { Curriculum } from "./components/Curriculum";
import { Header } from "./components/Header";
import { Heatmap } from "./components/Heatmap";
import { SessionLogger } from "./components/SessionLogger";

export function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header />
      <Heatmap />
      <Curriculum />
      <SessionLogger />
    </div>
  );
}
