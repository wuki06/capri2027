import raw from './timeline.json';

export type Word = {w: string; s: number; e: number};
export type Line = {id: string; scene: string; show: string; start: number; end: number; words: Word[]};
export type Timeline = {
  fps: number;
  durationInFrames: number;
  total: number;
  lines: Line[];
  scenes: {id: string; start: number; end: number}[];
  events: Record<string, any>;
  fall: {x: number[]; v: number[]; vMax: number};
};
export const TL = raw as unknown as Timeline;
export const FPS = TL.fps;
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const line = (id: string) => TL.lines.find((l) => l.id === id)!;
export const wordAt = (id: string, match: string, nth = 0): number => {
  const ws = line(id).words.filter((w) => w.w.toLowerCase().includes(match.toLowerCase()));
  return (ws[nth] ?? ws[0]).s;
};
