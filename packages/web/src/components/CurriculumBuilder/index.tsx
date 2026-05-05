import { Trans } from "@lingui/react/macro";
import { LoadingState } from "../LoadingState";
import { DotLoader } from "../Spinner";
import { InputModePicker, PdfInput, UrlInput } from "./InputStep";
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
    <div className="max-w-3xl mx-auto px-6 py-8 flex-1">
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        <Trans>Create new program</Trans>
      </h1>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {step === "idle" && inputMode === null && <InputModePicker onPick={setInputMode} />}

      {step === "idle" && inputMode === "url" && (
        <UrlInput
          url={url}
          setUrl={setUrl}
          complexity={complexity}
          onComplexityChange={setComplexity}
          onGenerate={() => void start()}
          onBack={() => setInputMode(null)}
        />
      )}

      {step === "idle" && inputMode === "pdf" && (
        <PdfInput
          file={pdfFile}
          setFile={setPdfFile}
          complexity={complexity}
          onComplexityChange={setComplexity}
          onGenerate={() => void start()}
          onBack={() => setInputMode(null)}
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

      {step === "saving" && (
        <div className="mt-6 flex items-center gap-2">
          <DotLoader />
          <span className="text-sm text-muted-foreground">
            <Trans>Saving...</Trans>
          </span>
        </div>
      )}
    </div>
  );
}
