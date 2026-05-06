import { z } from "zod";

export const GRADIENT_SHAPES = ["wave", "dots", "truchet", "corners", "ripple", "blob", "sphere"] as const;

export const GradientCoverSchema = z.object({
  shape: z.enum(GRADIENT_SHAPES),
  rotation: z.number().min(0).max(360),
  colorBack: z.string(),
  colors: z.array(z.string()).min(2).max(4),
});

export type GradientCover = z.infer<typeof GradientCoverSchema>;

const SCHEMES = {
  analogous: [0, 30, -30, 60],
  complementary: [0, 180, 30, 210],
  triadic: [0, 120, 240, 60],
  splitComplementary: [0, 150, 210, 30],
  tetradic: [0, 90, 180, 270],
} as const satisfies Record<string, readonly number[]>;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)] as T;
const round = (n: number) => Math.round(n);
const hsl = (h: number, s: number, l: number) => `hsl(${round(((h % 360) + 360) % 360)}, ${round(s)}%, ${round(l)}%)`;

function generatePalette(count: number): string[] {
  const baseHue = rand(0, 360);
  const scheme = pick(Object.keys(SCHEMES) as (keyof typeof SCHEMES)[]);
  const offsets = SCHEMES[scheme].slice(0, count);
  const saturation = rand(72, 92);
  const lightness = rand(50, 62);

  return offsets.map((offset) => hsl(baseHue + offset, saturation + rand(-8, 8), lightness + rand(-6, 6)));
}

function generateBackground(firstColor: string): string {
  const hue = Number(firstColor.match(/hsl\((\d+)/)?.[1] ?? 0);
  const dark = Math.random() < 0.5;
  return dark ? hsl(hue, rand(18, 38), rand(4, 10)) : hsl(hue, rand(14, 28), rand(93, 98));
}

export function generateGradient(): GradientCover {
  const colorCount = randInt(2, 4);
  const colors = generatePalette(colorCount);
  return {
    shape: pick(GRADIENT_SHAPES),
    rotation: randInt(0, 360),
    colorBack: generateBackground(colors[0]!),
    colors,
  };
}
