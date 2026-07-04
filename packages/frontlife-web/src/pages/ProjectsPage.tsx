import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, MessageSquare, Plus, ArrowRight, User, HelpCircle, CheckCircle, Flame, ArrowLeft } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { getErrorMessage } from '@dianzi/shared';

interface Idea {
  id: number;
  title: string;
  summary: string;
  sourceType: string;
  status: 'thinking' | 'validating' | 'building' | 'verified';
  gravityScore: number;
  tags: string[];
  aiStructure?: {
    problem: string;
    targetUsers: string;
    possibleSolutions: string[];
    validationSteps: string[];
    risks: string[];
  };
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedIdeaId, setExpandedIdeaId] = useState<number | null>(null);

  const fetchIdeas = async () => {
    try {
      setErrorMsg('');
      const data = await api.listIdeas();
      setIdeas(data.items || []);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, '获取共创项目板失败，请稍后重试。'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleReaction = async (ideaId: number, type: string) => {
    if (!token) {
      setErrorMsg('共创互动反应需要登录，请先登录。');
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      await api.reactToIdea(ideaId, type);
      // Optimistic update local count
      const scoreInc = type === 'can_help' ? 10 : 3;
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === ideaId
            ? { ...idea, gravityScore: idea.gravityScore + scoreInc }
            : idea
        )
      );
    } catch (err) {
      setErrorMsg(getErrorMessage(err, '互动操作失败，请重试。'));
    }
  };

  // Group ideas by status
  const columns = {
    thinking: { title: '🌱 有灵感 (Thinking)', items: ideas.filter((i) => i.status === 'thinking' || !i.status) },
    validating: { title: '🔬 在验证 (Validating)', items: ideas.filter((i) => i.status === 'validating') },
    building: { title: '🛠️ 在构建 (Building)', items: ideas.filter((i) => i.status === 'building') },
    verified: { title: '🏆 已落地 (Verified)', items: ideas.filter((i) => i.status === 'verified') },
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'life_observation':
        return '生活观察';
      case 'work_efficiency':
        return '效率提升';
      case 'random_spark':
        return '闪光灵感';
      case 'future_draft':
        return '未来雏形';
      default:
        return '想法';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="text-emerald-500 fill-emerald-500 animate-pulse" size={28} />
            <span>校园共创进度看板</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            聚焦有价值的瞬间灵感，汇聚同频协作，自动通过引力模型推进项目成长。
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.open('http://localhost:3000/new', '_blank')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>捕捉新点子</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} className="text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-mono">[CONSTELLATING PROJECTS BOARD...]</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {Object.entries(columns).map(([colKey, col]) => (
            <div key={colKey} className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 min-h-[500px] flex flex-col">
              <h3 className="font-bold text-slate-700 text-sm border-b border-slate-200 pb-3 mb-4 flex justify-between items-center">
                <span>{col.title}</span>
                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </h3>

              <div className="space-y-4 flex-grow">
                {col.items.length === 0 ? (
                  <div className="border border-dashed border-slate-350 rounded-xl py-12 px-4 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                    <span>暂无此类点子</span>
                    <span className="text-[10px] text-slate-350 mt-1">发布新灵感以启动</span>
                  </div>
                ) : (
                  col.items.map((idea) => {
                    const isExpanded = expandedIdeaId === idea.id;
                    return (
                      <div
                        key={idea.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all space-y-3"
                      >
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/10">
                            {getSourceTypeLabel(idea.sourceType)}
                          </span>
                          <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            🔥 {idea.gravityScore}
                          </span>
                        </div>

                        {/* Title & Summary */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-snug">
                            {idea.title || '模糊的想法'}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {idea.summary || idea.title}
                          </p>
                        </div>

                        {/* Tags */}
                        {idea.tags && idea.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {idea.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Expanded details */}
                        {isExpanded && idea.aiStructure && (
                          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2 leading-relaxed animate-fade-in">
                            <div>
                              <span className="font-bold text-slate-700 block">🎯 痛点分析:</span>
                              <p>{idea.aiStructure.problem}</p>
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block">👥 目标受众:</span>
                              <p>{idea.aiStructure.targetUsers}</p>
                            </div>
                            {idea.aiStructure.possibleSolutions && (
                              <div>
                                <span className="font-bold text-slate-700 block">💡 解决方案:</span>
                                <ul className="list-disc pl-3">
                                  {idea.aiStructure.possibleSolutions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Card Actions Footer */}
                        <div className="pt-3 border-t border-slate-150 flex flex-col gap-2">
                          {/* Toggle Expand */}
                          {idea.aiStructure && (
                            <button
                              onClick={() => setExpandedIdeaId(isExpanded ? null : idea.id)}
                              className="text-[10px] text-emerald-600 font-bold hover:underline text-left"
                            >
                              {isExpanded ? '收起详情' : '查看 AI 结构化详情...'}
                            </button>
                          )}

                          {/* Quick Reactions */}
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              onClick={() => handleReaction(idea.id, 'thought_before')}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded text-[9px] text-slate-500 font-medium transition-colors text-center border border-slate-200/50 cursor-pointer"
                              title="我也曾有过类似想法"
                            >
                              💡 想过
                            </button>
                            <button
                              onClick={() => handleReaction(idea.id, 'need')}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded text-[9px] text-slate-500 font-medium transition-colors text-center border border-slate-200/50 cursor-pointer"
                              title="我确实面临此痛点，我非常需要它"
                            >
                              🎯 需要
                            </button>
                            <button
                              onClick={() => handleReaction(idea.id, 'can_help')}
                              className="py-1 px-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 rounded text-[9px] text-slate-500 font-semibold transition-colors text-center border border-slate-200/50 cursor-pointer"
                              title="我能帮上忙，乐意协同共创"
                            >
                              🤝 帮手
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
