export type FragmentKind = 'word' | 'code' | 'panel' | 'dot';

export interface FragmentSpec {
  id: number;
  kind: FragmentKind;
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  delay: number;
  opacity: number;
  orbit: number;
  startAngle: number;
}

const fragmentWords = [
  'idea',
  'next',
  'need',
  'risk',
  'user',
  'test',
  'field',
  'signal',
  '反馈',
  '协作',
  '下一步',
  '真实需求'
];

export function buildFragments(count = 92): FragmentSpec[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const wave = Math.sin(index * 1.71) * 0.5 + 0.5;
    const radius = 120 + wave * 320 + (index % 7) * 18;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.72;
    const kind: FragmentKind =
      index % 11 === 0 ? 'panel' : index % 5 === 0 ? 'code' : index % 3 === 0 ? 'word' : 'dot';

    return {
      id: index,
      kind,
      text: fragmentWords[index % fragmentWords.length],
      size: kind === 'panel' ? 18 + (index % 4) * 8 : kind === 'dot' ? 4 + (index % 5) : 10 + (index % 6),
      x,
      y,
      rotate: -42 + ((index * 23) % 84),
      delay: (index % 19) * 18,
      opacity: 0.24 + ((index % 9) / 9) * 0.58,
      orbit: 126 + (index % 6) * 34,
      startAngle: (index * 31) % 360
    };
  });
}
