import { Trans } from "@lingui/react/macro";
import { LoadingState } from "../LoadingState";
import { BuilderSidebar } from "./BuilderSidebar";
import { InputStep } from "./InputStep";
import { OutlineReviewStep } from "./OutlineReviewStep";
import { PhaseStep } from "./PhaseStep";
import { useCurriculumBuilder } from "./useCurriculumBuilder";

export function CurriculumBuilder() {
  const {
    step,
    complexity,
    setComplexity,
    inputMode,
    url,
    setUrl,
    pdfFile,
    setPdfFile,
    setInputMode,
    outline,
    selectedPhaseIds,
    currentPageIndex,
    generatedPhases,
    generatingPhaseId,
    streamedTasks,
    deselectedTaskIds,
    error,
    selectedPhases,
    start,
    handleStartGenerating,
    handleNavigateTo,
    togglePhase,
    toggleTask,
    save,
    startOver,
  } = useCurriculumBuilder();

  return (
    <div className="flex flex-1">
      <BuilderSidebar step={step} />
      <div className="flex-1 min-w-0 border-l border-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {step === "idle" && (
            <InputStep
              method={inputMode}
              setMethod={setInputMode}
              url={url}
              setUrl={setUrl}
              file={pdfFile}
              setFile={setPdfFile}
              complexity={complexity}
              setComplexity={setComplexity}
              onGenerate={() => void start()}
            />
          )}

          {step === "extracting" && (
            <LoadingState>
              <Trans>Reading job posting…</Trans>
            </LoadingState>
          )}

          {step === "generating-outline" && (
            <LoadingState>
              <Trans>Generating outline…</Trans>
            </LoadingState>
          )}

          {step === "outline-review" && outline && (
            <OutlineReviewStep
              outline={outline}
              selectedPhaseIds={selectedPhaseIds}
              onTogglePhase={togglePhase}
              onStart={handleStartGenerating}
              onStartOver={startOver}
            />
          )}

          {step === "phase-view" && outline && (
            <PhaseStep
              selectedPhases={selectedPhases}
              currentPageIndex={currentPageIndex}
              generatedPhases={generatedPhases}
              generatingPhaseId={generatingPhaseId}
              streamedTasks={streamedTasks}
              deselectedTaskIds={deselectedTaskIds}
              onToggleTask={toggleTask}
              onNavigateTo={handleNavigateTo}
              onSave={() => void save()}
              onStartOver={startOver}
            />
          )}

          {step === "saving" && <LoadingState>Saving..</LoadingState>}
        </div>
      </div>
    </div>
  );
}
