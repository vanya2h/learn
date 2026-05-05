import { Trans } from "@lingui/react/macro";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

type Props = {
  taskTitle: string;
  curriculumName: string;
  onStartOver: () => void;
};

export function TopicHeader({ taskTitle, curriculumName, onStartOver }: Props) {
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">{taskTitle}</h1>
        <p className="text-xs text-muted-foreground truncate">{curriculumName}</p>
      </div>
      <div className="ml-auto shrink-0">
        <Dialog.Root>
          <Dialog.Trigger
            render={(p) => (
              <Button {...p}>
                <Trans>Start over</Trans>
              </Button>
            )}
          />
          <Dialog.Popup>
            <Dialog.Title>
              <Trans>Start over?</Trans>
            </Dialog.Title>
            <Dialog.Description>
              <Trans>Your current progress on this topic will be reset.</Trans>
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close
                render={(p) => (
                  <Button {...p}>
                    <Trans>Cancel</Trans>
                  </Button>
                )}
              />
              <Dialog.Close
                render={(p) => (
                  <Button
                    variant="destructive"
                    {...p}
                    onClick={(e) => {
                      onStartOver();
                      p.onClick?.(e);
                    }}
                  >
                    <Trans>Start over</Trans>
                  </Button>
                )}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Root>
      </div>
    </header>
  );
}
