import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Text } from "@cloudflare/kumo/components/text";
import { Trans } from "@lingui/react/macro";
import { useNavigate } from "react-router";

export default function ChoicePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="mb-2">
        <Text variant="heading2" as="h2">
          <Trans>How do you want to start?</Trans>
        </Text>
      </div>
      <p className="text-sm text-muted-foreground mb-10 max-w-sm">
        <Trans>
          Take a quick test to surface gaps and personalize the material, or dive straight in from the beginning.
        </Trans>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <LayerCard
          render={
            <button
              onClick={() => void navigate("../assess", { relative: "path" })}
              className="text-left cursor-pointer"
            />
          }
          className="flex flex-col items-start gap-2 rounded-xl p-5 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold text-foreground">
            <Trans>Quick assessment first</Trans>
          </span>
          <span className="text-xs text-muted-foreground">
            <Trans>Answer 4 questions so the AI can focus on your gaps</Trans>
          </span>
        </LayerCard>
        <LayerCard
          render={
            <button
              onClick={() => void navigate("../study", { relative: "path" })}
              className="text-left cursor-pointer"
            />
          }
          className="flex flex-col items-start gap-2 rounded-xl p-5 hover:bg-muted/50 transition-colors"
        >
          <span className="font-semibold text-foreground">
            <Trans>Start from scratch</Trans>
          </span>
          <span className="text-xs text-muted-foreground">
            <Trans>Full comprehensive material from the beginning</Trans>
          </span>
        </LayerCard>
      </div>
    </div>
  );
}
