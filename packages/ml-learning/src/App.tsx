import { CurriculumView } from "./components/CurriculumView";
import { Dashboard } from "./components/Dashboard";
import { Header } from "./components/Header";
import { TopicView } from "./components/TopicView";
import { useStore } from "./store";

export function App() {
  const currentView = useStore((s) => s.currentView);

  if (currentView === "topic") {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <TopicView />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header />
      {currentView === "dashboard" ? <Dashboard /> : <CurriculumView />}
    </div>
  );
}
