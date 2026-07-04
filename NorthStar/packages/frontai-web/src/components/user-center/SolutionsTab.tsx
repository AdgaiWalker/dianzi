import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, Sparkles, Trash2 } from 'lucide-react';
import type { UserSolution, ExportFormat, Tool } from '@/types';

interface SolutionsTabProps {
  solutions: UserSolution[];
  tools: Tool[];
  isLoggedIn: boolean;
  isEyeCare: boolean;
  defaultExportFormat: ExportFormat;
  navigate: ReturnType<typeof useNavigate>;
  onViewSolution: (sol: UserSolution) => void;
  onDeleteSolution: (id: string) => void;
  onExportSolution: (sol: UserSolution, format: 'md' | 'txt' | 'csv') => void;
}

export const SolutionsTab: React.FC<SolutionsTabProps> = ({
  solutions, tools, isLoggedIn, isEyeCare, defaultExportFormat, navigate,
  onViewSolution, onDeleteSolution, onExportSolution,
}) => {
  const cardClass = isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100 shadow-sm';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">我的 AI 方案</h2>
      {!isLoggedIn ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
          <Lock className="mx-auto mb-2 opacity-50" size={32} /><p>登录后才能查看已保存方案</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">去登录</button>
        </div>
      ) : solutions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl">
          <Sparkles className="mx-auto mb-2 opacity-50" size={32} /><p>还没有生成过方案</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">去创建</button>
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((sol) => (
            <div key={sol.id} onClick={() => onViewSolution(sol)} className={`p-6 rounded-2xl cursor-pointer hover:border-blue-400 transition-all ${cardClass}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{sol.title}</h3>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onExportSolution(sol, defaultExportFormat); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={`快捷导出 ${defaultExportFormat.toUpperCase()}`}>
                    <Download size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSolution(sol.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{sol.targetGoal}</p>
              <div className="flex items-center gap-2">
                {sol.toolIds.map((tid) => {
                  const tool = tools.find((t) => t.id === tid);
                  if (!tool) return null;
                  return <img key={tid} src={tool.imageUrl} className="w-6 h-6 rounded-full border border-white shadow-sm" title={tool.name} alt={tool.name} />;
                })}
                <span className="text-xs text-slate-400 ml-2">{sol.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
