import { Trans } from "@lingui/react/macro";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type Props = {
  taskTitle: string;
  curriculumName: string;
  onStartOver: () => void;
};

export function TopicHeader({ taskTitle, curriculumName, onStartOver }: Props) {
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">{taskTitle}</h1>
        <p className="text-xs text-muted-foreground truncate">{curriculumName}</p>
      </div>
      <div className="ml-auto shrink-0">
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="secondary" />}>
            <Trans>Start over</Trans>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>
              <Trans>Start over?</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>Your current progress on this topic will be reset.</Trans>
            </DialogDescription>
            <div className="mt-6 flex justify-end gap-2">
              <DialogClose render={<Button variant="ghost" />}>
                <Trans>Cancel</Trans>
              </DialogClose>
              <DialogClose render={<Button variant="destructive" />} onClick={onStartOver}>
                <Trans>Start over</Trans>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
