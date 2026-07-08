export type StageId =
  | 'paper'
  | 'approach'
  | 'pressure'
  | 'impact'
  | 'burst'
  | 'through'
  | 'return'
  | 'logo';

export interface StageDefinition {
  id: StageId;
  label: string;
  startsAt: number;
  duration: number;
}

export const timeline: StageDefinition[] = [
  { id: 'paper', label: '纸背视角建立', startsAt: 0, duration: 2000 },
  { id: 'approach', label: '毛笔靠近', startsAt: 2000, duration: 2000 },
  { id: 'pressure', label: '笔尖下落', startsAt: 4000, duration: 1500 },
  { id: 'impact', label: '触碰瞬间', startsAt: 5500, duration: 200 },
  { id: 'burst', label: '信息爆发', startsAt: 5700, duration: 800 },
  { id: 'through', label: '视角穿透', startsAt: 6500, duration: 1200 },
  { id: 'return', label: '信息回流', startsAt: 7700, duration: 1500 },
  { id: 'logo', label: 'Logo 成形', startsAt: 9200, duration: 800 }
];

export const totalDuration = 10000;

export function getStage(elapsed: number): StageDefinition {
  const normalized = Math.min(Math.max(elapsed, 0), totalDuration);
  return (
    timeline
      .slice()
      .reverse()
      .find((stage) => normalized >= stage.startsAt) ?? timeline[0]
  );
}
