import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDraggableCard } from '../hooks/useDraggableCard';
import { Sparkles, Compass, AlertCircle, Plus, Eye, Share2, HelpCircle } from 'lucide-react';
import { ideasApi } from '../services/api';

gsap.registerPlugin(ScrollTrigger);

// Core value core definitions
const VALUE_CORES = [
  { id: 'lawful', label: '守法 Lawful', desc: '合规准入与边界约束', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  { id: 'independent', label: '独立 Independent', desc: '尊重观察与确权表达', color: 'from-blue-500/20 to-sky-500/20', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  { id: 'scientific', label: '科学 Scientific', desc: '理性整理与逻辑验证', color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  { id: 'harmonious', label: '和谐 Harmonious', desc: '善意回应与协作共创', color: 'from-fuchsia-500/20 to-pink-500/20', border: 'border-fuchsia-500/30', glow: 'shadow-fuchsia-500/20' }
];

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    summary: string;
    sourceType: string;
    gravityScore: number;
    tags: string[];
    aiStructure?: {
      problem: string;
      targetUsers: string;
      possibleSolutions: string[];
    };
  };
  initialX: number;
  initialY: number;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, initialX, initialY }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Hook up our velocity-based inertia dragging
  useDraggableCard(cardRef, {
    initialX,
    initialY,
  });

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const inner = innerRef.current;
    if (!inner) return;

    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);

    gsap.killTweensOf(inner);
    gsap.to(inner, {
      rotateY: nextFlipped ? 180 : 0,
      duration: 0.6,
      ease: 'back.out(1.1)',
    });
  };

  return (
    <div
      ref={cardRef}
      className="draggable-card card-container absolute w-72 h-44 cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    >
      <div ref={innerRef} className="card-inner w-full h-full">
        {/* Card Front */}
        <div className="card-front w-full h-full panel-glass p-5 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-mono uppercase bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/20">
                {idea.sourceType === 'life_observation' ? '🌱 生活观察' : 
                 idea.sourceType === 'work_efficiency' ? '🛠️ 效率痛点' : 
                 idea.sourceType === 'random_spark' ? '⚡ 闪光灵感' : '🔮 未来物种'}
              </span>
              <span className="text-[10px] text-parchment-dim font-mono">
                引力值 {idea.gravityScore}
              </span>
            </div>
            <h3 className="text-sm font-bold text-parchment line-clamp-1">{idea.title}</h3>
            <p className="text-[11px] text-parchment-dim line-clamp-2 leading-relaxed">{idea.summary}</p>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div className="flex gap-1">
              {(idea.tags || []).slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] text-parchment-dim bg-white/5 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
            <button
              onClick={handleFlip}
              className="text-[10px] text-brand font-bold hover:text-emerald-300 flex items-center gap-0.5"
            >
              AI 结构化 <Sparkles size={8} />
            </button>
          </div>
        </div>

        {/* Card Back */}
        <div className="card-back w-full h-full panel-glass p-5 rounded-2xl flex flex-col justify-between shadow-lg border border-brand/20">
          <div className="space-y-2 text-[10px] leading-relaxed text-parchment-dim scrollable-y max-h-[110px] pr-1">
            <div>
              <span className="font-bold text-brand block mb-0.5">🎯 想解决的问题:</span>
              <p>{idea.aiStructure?.problem || '暂无结构化痛点分析'}</p>
            </div>
            <div>
              <span className="font-bold text-brand block mt-1.5 mb-0.5">👥 目标群体:</span>
              <p>{idea.aiStructure?.targetUsers || '所有关注此想法者'}</p>
            </div>
            {idea.aiStructure?.possibleSolutions && idea.aiStructure.possibleSolutions.length > 0 && (
              <div>
                <span className="font-bold text-brand block mt-1.5 mb-0.5">🚀 实现方向建议:</span>
                <ul className="list-disc pl-3">
                  {idea.aiStructure.possibleSolutions.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span className="text-[9px] text-brand/80 font-mono">AI-Refined Structure</span>
            <button
              onClick={handleFlip}
              className="text-[10px] text-brand font-bold hover:text-emerald-300"
            >
              返回正面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock initial ideas for dev fallback
  const mockIdeas = [
    { id: '1', title: 'AI 跑腿拼单小助手', summary: '帮助宿舍楼大学生聚合配送订单的轻量拼单工具，减少配送等待。', sourceType: 'life_observation', gravityScore: 84, tags: ['校园', '协同配送', '效率工具'], aiStructure: { problem: '宿舍外卖小哥无法入楼，取件零散且高频耗时。', targetUsers: '在校寄宿大学生与跑腿人员', possibleSolutions: ['微信小程序聚合', '寝室拼单路由算法'] } },
    { id: '2', title: '独立开发者合规审查器', summary: '基于大模型的独立项目开源合规与国内上线法律底线自动筛查面板。', sourceType: 'work_efficiency', gravityScore: 102, tags: ['出海', '合规检测', '法律助手'], aiStructure: { problem: '独立项目上线法律条款冗杂，容易违规遭遇下架风险。', targetUsers: '独立创作者与初创团队', possibleSolutions: ['多维度法条数据库对比', '大模型合规安全系数评分'] } },
    { id: '3', title: '自适应天气情绪背景网', summary: '利用网络地理API与气象监测，自适应改变呼吸背景与音乐的治愈点子。', sourceType: 'random_spark', gravityScore: 56, tags: ['治愈', '创意艺术', '自适应色彩'], aiStructure: { problem: '传统网站色彩一成不变，缺乏环境沉浸感。', targetUsers: '个人主页创作者与艺术爱好者', possibleSolutions: ['CSS HSL变量渐变绑定', '天气数据API订阅'] } },
    { id: '4', title: '共享咖啡随手顺路带', summary: '点咖啡时顺便帮同楼层同事带一杯，获取能量币换取下次顺带的积分。', sourceType: 'life_observation', gravityScore: 72, tags: ['办公室', '共享模式', '咖啡顺路'], aiStructure: { problem: '工作期间点单成本高，下楼取咖啡频繁打断工作。', targetUsers: '写字楼办公白领', possibleSolutions: ['熟人顺路打卡模式', '积分回馈代币机制'] } }
  ];

  useEffect(() => {
    // 1. Fetch ideas from server
    ideasApi
      .listIdeas()
      .then(data => {
        setIdeas(data.items || mockIdeas);
      })
      .catch(() => {
        setIdeas(mockIdeas); // Fallback to mock data
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Setup Slogan scroll morphing using GSAP ScrollTrigger
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, 
          { scale: 1, y: 0, opacity: 1 },
          {
            scale: 0.65,
            y: -50,
            opacity: 0.9,
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              pin: true,
              pinSpacing: false
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[140vh] w-full text-parchment select-none pb-20">
      
      {/* 1. Scroll Morphing Hero Slogan Zone */}
      <div 
        ref={heroRef} 
        className="w-full h-[60vh] flex flex-col justify-center items-center text-center px-4 relative z-20 pointer-events-none"
      >
        <div ref={titleRef} className="space-y-4 max-w-3xl">
          <div className="text-xs font-mono text-brand uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Compass size={14} className="animate-spin-slow" /> IDEAS ARE CHUNKS OF CHAOS
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            让生活里的想法<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-emerald-400">
              遇见需要它的人
            </span>
          </h1>
          <p className="text-xs md:text-sm text-parchment-dim font-mono max-w-md mx-auto">
            点子平台 · 守法 独立 科学 和谐
          </p>
        </div>
      </div>

      {/* 2. Brutalist Grid Constellation Tabletop Canvas */}
      <div className="relative w-full h-[90vh] grid-bg border-t border-b border-white/5 overflow-hidden flex items-center justify-center">
        
        {/* Decorative background grid neon markers */}
        <div className="absolute inset-0 pointer-events-none flex justify-between items-between p-8 opacity-40">
          <span className="text-[10px] font-mono text-white/20">COORD_X: [DECAY]</span>
          <span className="text-[10px] font-mono text-white/20">DAMPING: 160</span>
        </div>

        {/* 4 Gravity Values Star Core Cores */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 p-10 md:p-16 gap-20">
          {VALUE_CORES.map(core => (
            <div 
              key={core.id}
              className={`panel-glass p-5 rounded-2xl border ${core.border} shadow-lg ${core.glow} flex flex-col justify-between max-w-[240px] transition-all`}
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-parchment">{core.label}</h4>
                <p className="text-[10px] text-parchment-dim leading-relaxed">{core.desc}</p>
              </div>
              <span className="text-[9px] font-mono text-brand/40 uppercase tracking-widest mt-4">
                Active Gravity Field
              </span>
            </div>
          ))}
        </div>

        {/* Scattered Idea Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {!loading && ideas.map((idea, index) => {
            // Distribute cards randomly around center
            const angles = [0, 90, 180, 270];
            const angle = (angles[index % 4] * Math.PI) / 180 + (Math.random() - 0.5) * 0.4;
            const distance = 160 + Math.random() * 80;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;

            return (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                initialX={x} 
                initialY={y} 
              />
            );
          })}

          {loading && (
            <div className="text-xs font-mono text-brand/60 animate-pulse">
              [CONSTELLATING IDEA NETWORK...]
            </div>
          )}
        </div>
      </div>

      {/* 3. Floating Action & Quick Access bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-full shadow-2xl">
        <button
          onClick={() => navigate('/ideas')}
          className="text-xs font-bold px-4 py-2 text-parchment-dim hover:text-white transition-colors"
        >
          点子广场
        </button>
        <div className="w-[1px] h-4 bg-white/10" />
        
        <button
          onClick={() => navigate('/new')}
          className="bg-brand hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shadow-lg hover:shadow-brand/20"
        >
          <Plus size={14} strokeWidth={3} /> 捕捉新点子
        </button>

        <div className="w-[1px] h-4 bg-white/10" />
        <button
          onClick={() => window.open('https://github.com/AdgaiWalker/dianzi', '_blank')}
          className="text-xs font-bold px-4 py-2 text-parchment-dim hover:text-white transition-colors"
        >
          GitHub
        </button>
      </div>

    </div>
  );
};
