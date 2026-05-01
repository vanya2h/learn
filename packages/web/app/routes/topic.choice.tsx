import { LayerCard } from "@cloudflare/kumo/components/layer-card";
import { Text } from "@cloudflare/kumo/components/text";
import { useNavigate } from "react-router";

export default function ChoicePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="mb-2">
        <Text variant="heading2" as="h2">
          How do you want to start?
        </Text>
      </div>
      <p className="text-sm text-muted-foreground mb-10 max-w-sm">
        Take a quick test to surface gaps and personalize the material, or dive straight in from the beginning.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <LayerCard
          render={<button onClick={() => void navigate("../assess", { relative: "path" })} className="text-left" />}
          className="flex flex-col items-start gap-2 rounded-xl p-5"
        >
          <span className="font-semibold text-foreground">Quick assessment first</span>
          <span className="text-xs text-muted-foreground">Answer 4 questions so the AI can focus on your gaps</span>
        </LayerCard>
        <LayerCard
          render={<button onClick={() => void navigate("../study", { relative: "path" })} className="text-left" />}
          className="flex flex-col items-start gap-2 rounded-xl p-5"
        >
          <span className="font-semibold text-foreground">Start from scratch</span>
          <span className="text-xs text-muted-foreground">Full comprehensive material from the beginning</span>
        </LayerCard>
      </div>
    </div>
  );
}
