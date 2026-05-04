import { Loader } from "@cloudflare/kumo/components/loader";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans } from "@lingui/react/macro";
import { InputModePicker, PdfInput, UrlInput } from "./InputStep";
import { OutlineReviewStep } from "./OutlineReviewStep";
import { PhaseStep } from "./PhaseStep";
import { useCurriculumBuilder } from "./useCurriculumBuilder";

function OutlineSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-6 w-52 bg-muted rounded mb-2" />
          <div className="h-3 w-80 bg-muted rounded" />
        </div>
      </div>
      <div className="h-3 w-44 bg-muted rounded mb-3" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <div className="mt-0.5 h-4 w-4 bg-muted rounded shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className={`h-4 bg-muted rounded ${["w-2/3", "w-3/4", "w-1/2", "w-4/5", "w-3/5"][i]}`} />
              <div className={`h-3 bg-muted rounded ${["w-11/12", "w-4/5", "w-full", "w-3/4", "w-5/6"][i]}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CurriculumBuilder() {
  const {
    step,
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
    phaseFeedback,
    setPhaseFeedback,
    deselectedTaskIds,
    error,
    selectedPhases,
    start,
    handleStartGenerating,
    handleNavigateTo,
    handleRegenerate,
    togglePhase,
    toggleTask,
    save,
    startOver,
  } = useCurriculumBuilder();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Text variant="heading2" as="h1">
          <Trans>Create new program</Trans>
        </Text>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {step === "idle" && inputMode === null && <InputModePicker onPick={setInputMode} />}

      {step === "idle" && inputMode === "url" && (
        <UrlInput url={url} setUrl={setUrl} onGenerate={() => void start()} onBack={() => setInputMode(null)} />
      )}

      {step === "idle" && inputMode === "pdf" && (
        <PdfInput
          file={pdfFile}
          setFile={setPdfFile}
          onGenerate={() => void start()}
          onBack={() => setInputMode(null)}
        />
      )}

      {(step === "extracting" || step === "generating-outline") && <OutlineSkeleton />}

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
          phaseFeedback={phaseFeedback}
          deselectedTaskIds={deselectedTaskIds}
          onFeedbackChange={setPhaseFeedback}
          onToggleTask={toggleTask}
          onNavigateTo={handleNavigateTo}
          onRegenerate={handleRegenerate}
          onSave={() => void save()}
          onStartOver={startOver}
        />
      )}

      {step === "saving" && (
        <div className="mt-6 flex items-center gap-2">
          <Loader size="sm" />
          <span className="text-sm text-muted-foreground">
            <Trans>Saving...</Trans>
          </span>
        </div>
      )}
    </div>
  );
}
