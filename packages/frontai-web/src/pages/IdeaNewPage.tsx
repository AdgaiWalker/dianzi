import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ideasApi } from '@/services/api';
import { getErrorMessage } from '@dianzi/shared';
import gsap from 'gsap';

interface RefinedStructure {
  title: string;
  summary: string;
  sourceScene: string;
  problem: string;
  targetUsers: string;
  possibleSolutions: string[];
  validationSteps: string[];
  risks: string[];
  tags: string[];
}

export const IdeaNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { authToken } = useAppStore();
  
  // Form states
  const [rawInput, setRawInput] = useState('');
  const [sourceType, setSourceType] = useState('life_observation');
  const [inviteCode, setInviteCode] = useState('');
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Execution states
  const [isRefining, setIsRefining] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Result states
  const [refinedResult, setRefinedResult] = useState<RefinedStructure | null>(null);
  const [createdIdeaId, setCreatedIdeaId] = useState<number | null>(null);

  // Refs for animation
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const formPaneRef = useRef<HTMLDivElement>(null);

  // Animate in on mount
  useEffect(() => {
    gsap.fromTo(
      formPaneRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (rawInput.trim().length < 5) {
      setErrorMsg('点子描述内容太短啦，多写几句吧（最少 5 个字）。');
      return;
    }

    // Light invite-code check (mock)
    const validCodes = ['DIANZI2026', 'CO-CREATE', 'HELLOWORLD', 'ADMIN'];
    const cleanedCode = inviteCode.trim().toUpperCase();
    if (!validCodes.includes(cleanedCode)) {
      setErrorMsg('请输入有效的共创邀请码（例如：DIANZI2026 或 CO-CREATE）。');
      return;
    }

    if (!agreedToContract) {
      setErrorMsg('请阅读并勾选价值观契约承诺。');
      return;
    }

    setIsRefining(true);
    try {
      // 1. Submit raw idea
      const ideaRes = await ideasApi.submitRawIdea({
        rawInput: rawInput.trim(),
        sourceType,
        visibility: 'public',
        allowCollaboration: true,
      });

      const ideaId = ideaRes.id;
      setCreatedIdeaId(ideaId);

      // 2. Trigger AI refinement
      const refinedRes = await ideasApi.refineIdea(ideaId);
      
      setRefinedResult({
        title: refinedRes.title,
        summary: refinedRes.summary,
        sourceScene: refinedRes.aiStructure.problem ? refinedRes.tags[0] || '生活场景' : '未知',
        problem: refinedRes.aiStructure.problem,
        targetUsers: refinedRes.aiStructure.targetUsers,
        possibleSolutions: refinedRes.aiStructure.possibleSolutions,
        validationSteps: refinedRes.aiStructure.validationSteps,
        risks: refinedRes.aiStructure.risks,
        tags: refinedRes.tags,
      });

      // Animate card appearing
      setTimeout(() => {
        if (cardPreviewRef.current) {
          gsap.fromTo(
            cardPreviewRef.current,
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }
          );
        }
      }, 50);

    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'AI 整理失败，请稍后重试。'));
    } finally {
      setIsRefining(false);
    }
  };

  const handlePublish = async () => {
    if (!createdIdeaId) return;
    setIsPublishing(true);

    // Animate flight before navigating
    if (cardPreviewRef.current) {
      const bounds = cardPreviewRef.current.getBoundingClientRect();
      gsap.to(cardPreviewRef.current, {
        x: -bounds.left + window.innerWidth / 2 - bounds.width / 2,
        y: -bounds.top + window.innerHeight / 2 - bounds.height / 2,
        scale: 0.2,
        opacity: 0,
        rotation: 720,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete: () => {
          navigate('/');
        },
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>返回大厅</span>
      </button>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-stone-800 dark:text-stone-100 flex items-center gap-2">
          <Sparkles className="text-emerald-500 animate-pulse" size={28} />
          <span>捕捉闪现灵感</span>
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          一半生活，一半理想。在这里记录你的模糊灵感，让 AI 帮我们整理结构化，并在大厅匹配志同道合的同频者。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Form Panel */}
        <div ref={formPaneRef} className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-2xl p-6 border border-stone-200/50 dark:border-stone-800/50 shadow-xl">
          <h2 className="text-lg font-semibold mb-4 text-stone-700 dark:text-stone-300">点子录入表单</h2>

          <form onSubmit={handleRefine} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                想法类别
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="life_observation">生活观察 (Life Observation)</option>
                <option value="work_efficiency">效率提升 (Efficiency Spark)</option>
                <option value="random_spark">偶然灵感 (Random Spark)</option>
                <option value="future_draft">未来雏形 (Future Draft)</option>
              </select>
            </div>

            {/* Raw Input Textarea */}
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                想法描述 (1句话/碎碎念都可以)
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder="那一刻，你脑子里闪过了什么想法？例如：我想做一个可以在寝室顺便代拿快递并收取低代金券的工具，解决下楼取快递太懒的问题..."
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-stone-400 dark:placeholder-stone-600 text-sm"
              />
              <span className="block text-right text-xs text-stone-400 mt-1">
                {rawInput.length}/500 字
              </span>
            </div>

            {/* Invite code */}
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5 flex items-center justify-between">
                <span>共创邀请码</span>
                <span className="text-xs text-emerald-500 font-normal">测试可用: DIANZI2026</span>
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="请输入你的专属邀请码"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-stone-400 dark:placeholder-stone-600 text-sm"
              />
            </div>

            {/* Contract agreed Checkbox */}
            <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-stone-950 p-3 rounded-lg border border-stone-150 dark:border-stone-900">
              <input
                type="checkbox"
                id="contract"
                checked={agreedToContract}
                onChange={(e) => setAgreedToContract(e.target.checked)}
                className="mt-1 accent-emerald-500"
              />
              <label htmlFor="contract" className="text-xs leading-relaxed text-stone-500 dark:text-stone-400 select-none">
                我已阅读并承诺遵守**《点子 DIANZI 价值观共创契约》**：保证我所录入的内容纯良真实、心怀善意，并不带有政治、色情或人身攻击内容，且我在此承诺乐于同频伙伴共创。
              </label>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900 rounded-lg text-rose-600 dark:text-rose-400 text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRefining}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {isRefining ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>AI 提纯结构化中...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>AI 提纯并核验</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Preview Card Panel */}
        <div className="h-full">
          {!refinedResult && !isRefining ? (
            <div className="border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[380px] bg-stone-50/50 dark:bg-stone-900/25">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                <Sparkles size={24} />
              </div>
              <h3 className="font-semibold text-stone-700 dark:text-stone-300 mb-1">等待 AI 结构化整理</h3>
              <p className="text-stone-400 dark:text-stone-500 text-xs max-w-xs mx-auto">
                请在左侧表单中输入你的灵感并确认契约，AI 将会在此处生成一张精美的共创卡牌。
              </p>
            </div>
          ) : isRefining ? (
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-6 bg-white dark:bg-stone-900 shadow-xl min-h-[380px] flex flex-col justify-between animate-pulse">
              <div className="space-y-4">
                <div className="h-6 w-1/3 bg-stone-200 dark:bg-stone-800 rounded-full" />
                <div className="h-4 w-3/4 bg-stone-200 dark:bg-stone-800 rounded-full" />
                <div className="space-y-2 pt-4">
                  <div className="h-3 w-full bg-stone-200 dark:bg-stone-800 rounded" />
                  <div className="h-3 w-5/6 bg-stone-200 dark:bg-stone-800 rounded" />
                  <div className="h-3 w-4/5 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-stone-100 dark:border-stone-800">
                <div className="h-8 w-24 bg-stone-200 dark:bg-stone-800 rounded-full" />
                <div className="h-8 w-24 bg-stone-200 dark:bg-stone-800 rounded-full" />
              </div>
            </div>
          ) : (
            <div
              ref={cardPreviewRef}
              className="border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-6 bg-white dark:bg-stone-950 shadow-2xl relative overflow-hidden"
            >
              {/* Emerald glow top right */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/10 dark:bg-emerald-500/5 blur-2xl rounded-full" />

              {/* Card header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {sourceType === 'life_observation' && '生活观察'}
                  {sourceType === 'work_efficiency' && '效率提升'}
                  {sourceType === 'random_spark' && '偶然灵感'}
                  {sourceType === 'future_draft' && '未来雏形'}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">AI 提纯卡牌预览</span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                {refinedResult?.title}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 italic">
                “ {refinedResult?.summary} ”
              </p>

              {/* Content items */}
              <div className="space-y-4 text-xs text-stone-600 dark:text-stone-400 mb-6">
                <div>
                  <h4 className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide text-[10px] mb-1">
                    🎯 想解决的问题 (Problem)
                  </h4>
                  <p className="leading-relaxed bg-stone-50 dark:bg-stone-900/40 p-2.5 rounded-lg border border-stone-150/40 dark:border-stone-800/30">
                    {refinedResult?.problem}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide text-[10px] mb-1">
                    👥 目标群体 (Target Users)
                  </h4>
                  <p className="leading-relaxed bg-stone-50 dark:bg-stone-900/40 p-2.5 rounded-lg border border-stone-150/40 dark:border-stone-800/30">
                    {refinedResult?.targetUsers}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide text-[10px] mb-1">
                      💡 解决方案方向 (Solutions)
                    </h4>
                    <ul className="list-disc list-inside space-y-0.5 leading-relaxed bg-stone-50 dark:bg-stone-900/40 p-2.5 rounded-lg border border-stone-150/40 dark:border-stone-800/30 h-full">
                      {refinedResult?.possibleSolutions.map((sol, index) => (
                        <li key={index}>{sol}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide text-[10px] mb-1">
                      🔬 下一步验证 (Validation)
                    </h4>
                    <ul className="list-disc list-inside space-y-0.5 leading-relaxed bg-stone-50 dark:bg-stone-900/40 p-2.5 rounded-lg border border-stone-150/40 dark:border-stone-800/30 h-full">
                      {refinedResult?.validationSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-rose-500/80 dark:text-rose-400/80 uppercase tracking-wide text-[10px] mb-1">
                    ⚠️ 潜在风险点 (Risks)
                  </h4>
                  <ul className="list-disc list-inside space-y-0.5 leading-relaxed bg-rose-50/30 dark:bg-rose-950/10 p-2.5 rounded-lg border border-rose-100/50 dark:border-rose-900/20 text-rose-600/90 dark:text-rose-450/90">
                    {refinedResult?.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {refinedResult?.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-850 text-stone-500 dark:text-stone-400 text-[10px] font-medium rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Publish button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-900">
                <button
                  type="button"
                  onClick={() => setRefinedResult(null)}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  放弃重写
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>正在放飞...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>放飞到点子广场</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default IdeaNewPage;
