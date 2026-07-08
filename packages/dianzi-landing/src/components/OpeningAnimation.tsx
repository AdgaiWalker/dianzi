import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { buildFragments } from '../lib/fragments';
import { getStage, timeline, totalDuration, type StageId } from '../lib/timeline';

const stageClass: Record<StageId, string> = {
  paper: 'stage-paper',
  approach: 'stage-approach',
  pressure: 'stage-pressure',
  impact: 'stage-impact',
  burst: 'stage-burst',
  through: 'stage-through',
  return: 'stage-return',
  logo: 'stage-logo'
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

const PauseIcon = Pause as unknown as IconComponent;
const PlayIcon = Play as unknown as IconComponent;
const RotateCcwIcon = RotateCcw as unknown as IconComponent;

export function OpeningAnimation() {
  const fragments = useMemo(() => buildFragments(), []);
  const [runId, setRunId] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [impactDot, setImpactDot] = useState(false);

  useEffect(() => {
    if (paused) return undefined;

    const syncElapsed = () => {
      setElapsed(Math.min(Date.now() - startedAt, totalDuration));
    };

    syncElapsed();
    const timer = window.setInterval(syncElapsed, 80);
    return () => window.clearInterval(timer);
  }, [paused, startedAt]);

  useEffect(() => {
    setImpactDot(false);
    const impactTimer = window.setTimeout(() => {
      setImpactDot(true);
      window.setTimeout(() => setImpactDot(false), 200);
    }, 5500);

    return () => window.clearTimeout(impactTimer);
  }, [runId]);

  const activeStage = getStage(elapsed);
  const progress = Math.min(elapsed / totalDuration, 1);

  const replay = () => {
    setStartedAt(Date.now());
    setElapsed(0);
    setPaused(false);
    setImpactDot(false);
    setRunId((value) => value + 1);
  };

  const togglePaused = () => {
    if (paused) {
      setStartedAt(Date.now() - elapsed);
      setPaused(false);
      return;
    }

    setPaused(true);
  };

  return (
    <section
      key={runId}
      className={`opening ${stageClass[activeStage.id]}`}
      style={{ '--progress': progress } as React.CSSProperties}
    >
      <div className="opening__paper" aria-hidden="true" />
      <div className="opening__backlight" aria-hidden="true" />
      <div className="opening__paper-shadow" aria-hidden="true" />

      <div className="brush" aria-hidden="true">
        <div className="brush__handle" />
        <div className="brush__bristle" />
      </div>

      <div className="pressure-field" aria-hidden="true">
        <div className="pressure-field__well" />
        <div className="pressure-field__point" />
      </div>

      {impactDot && <div className="impact-dot" aria-hidden="true" />}

      <div className="burst-cloud" aria-hidden="true">
        {fragments.map((fragment) => (
          <span
            key={fragment.id}
            className={`fragment fragment--${fragment.kind}`}
            style={
              {
                '--x': `${fragment.x}px`,
                '--y': `${fragment.y}px`,
                '--x-mid': `${fragment.x * 0.68}px`,
                '--y-mid': `${fragment.y * 0.68}px`,
                '--x-home': `${fragment.x * 0.18}px`,
                '--y-home': `${fragment.y * 0.18}px`,
                '--r': `${fragment.rotate}deg`,
                '--d': `${fragment.delay}ms`,
                '--s': `${fragment.size}px`,
                '--o': fragment.opacity
              } as React.CSSProperties
            }
          >
            {fragment.kind === 'dot' ? '' : fragment.text}
          </span>
        ))}
      </div>

      <div className="through-field" aria-hidden="true">
        <div className="through-field__core" />
        <div className="through-field__veil" />
      </div>

      <div className="return-system" aria-hidden="true">
        <div className="orbit orbit--wide" />
        <div className="orbit orbit--tight" />
        <div className="orbit orbit--ghost" />
        {fragments.slice(0, 48).map((fragment) => (
          <span
            key={`return-${fragment.id}`}
            className="return-fragment"
            style={
              {
                '--orbit': `${fragment.orbit}px`,
                '--orbit-far': `${fragment.orbit * 1.7}px`,
                '--orbit-near': `${fragment.orbit * 0.42}px`,
                '--angle': `${fragment.startAngle}deg`,
                '--angle-mid': `${fragment.startAngle + 96}deg`,
                '--angle-near': `${fragment.startAngle + 196}deg`,
                '--angle-end': `${fragment.startAngle + 256}deg`,
                '--angle-neg': `${-fragment.startAngle}deg`,
                '--angle-mid-neg': `${-(fragment.startAngle + 96)}deg`,
                '--angle-near-neg': `${-(fragment.startAngle + 196)}deg`,
                '--angle-end-neg': `${-(fragment.startAngle + 256)}deg`,
                '--d': `${fragment.delay}ms`,
                '--s': `${Math.max(3, fragment.size * 0.45)}px`
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="opening__logo">
        <BrandLogo />
      </div>

      <div className="opening__chrome">
        <BrandLogo compact />
        <nav aria-label="DIANZI 官网导航">
          <a href="#mission">使命</a>
          <a href="#method">方法</a>
          <a href="#preview">预览</a>
        </nav>
      </div>

      <div className="opening__statement">
        <p>创意，从一个点子开始。</p>
        <h1>把模糊想法，推进到真实下一步。</h1>
        <span>AI 整理问题、需求和风险，人给出试用、协作与资源回应。</span>
      </div>

      <div className="opening__controls">
        <button type="button" onClick={replay} aria-label="重新播放开场动画">
          <RotateCcwIcon size={17} strokeWidth={1.6} />
          重播
        </button>
        <button type="button" onClick={togglePaused} aria-label="暂停或继续开场动画">
          {paused ? <PlayIcon size={17} strokeWidth={1.6} /> : <PauseIcon size={17} strokeWidth={1.6} />}
          {paused ? '继续' : '暂停'}
        </button>
      </div>

      <div className="stage-meter" aria-label={`当前阶段：${activeStage.label}`}>
        {timeline.map((stage) => (
          <span
            key={stage.id}
            className={stage.id === activeStage.id ? 'stage-meter__item is-active' : 'stage-meter__item'}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </section>
  );
}
