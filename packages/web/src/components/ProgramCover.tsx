import { GradientBackground, GradientBackgroundProps } from "./GradientBg";

export type ProgramCoverProps = GradientBackgroundProps;

export function ProgramCover({ shape = "blob", ...restProps }: ProgramCoverProps) {
  return <GradientBackground shape={shape} speed={0} {...restProps} />;
}
