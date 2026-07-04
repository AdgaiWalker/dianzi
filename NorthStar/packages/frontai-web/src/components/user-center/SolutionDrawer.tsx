import React, { useState } from 'react';
import { BookOpen, Calendar, CheckSquare, Copy, Download, Layout, Share2, Sparkles, Trash2, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { UserSolution, Tool } from '@/types';

interface SolutionDrawerProps {
  solution: UserSolution;
  tools: Tool[];
  isEyeCare: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onExport: (sol: UserSolution, format: 'md' | 'txt' | 'csv') => void;
  onNavigate: (path: string) => void;
}

export const SolutionDrawer: React.FC<SolutionDrawerProps> = ({
  solution, tools, isEyeCare, onClose, onDelete, onExport, onNavigate,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const cardClass = isEyeCare ? 'bg-eye-care-card' : 'bg-white';

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col ${cardClass}`}>
        {/* 头部 */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold mb-1">{solution.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Calendar size={14} /> {solution.createdAt}</span>
              <span className="flex items-center gap-1"><Sparkles size={14} className="text-blue-500" /> AI 生成方案</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className={`p-2 rounded-full transition-colors ${showShareMenu ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`} title="分享方案">
                <Share2 size={24} />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">分享方案</div>
                  <button onClick={() => { navigator.clipboard.writeText(`https://pangen-ai.com/s/${solution.id}`); setLinkCopied(true); setTimeout(() => { setLinkCopied(false); setShowShareMenu(false); }, 1000); }} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${linkCopied ? 'bg-green-50 text-green-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}>
                    {linkCopied ? <CheckSquare size={16} className="text-green-500" /> : <Copy size={16} />}{linkCopied ? '已复制链接' : '复制链接'}
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors" title="关闭"><X size={24} /></button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1"><Layout size={12} /> 核心目标</h3>
            <p className="text-slate-700 font-medium">{solution.targetGoal}</p>
          </div>
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Zap size={16} /> 涉及工具</h3>
            <div className="flex flex-wrap gap-3">
              {solution.toolIds.map((tid) => {
                const tool = tools.find((t) => t.id === tid);
                return tool ? (
                  <div key={tid} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all bg-white cursor-pointer" onClick={() => onNavigate(`/tool/${tid}`)}>
                    <img src={tool.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" alt="" />
                    <div><div className="font-bold text-sm">{tool.name}</div><div className="text-xs text-slate-500">{tool.domain}</div></div>
                  </div>
                ) : null;
              })}
              {solution.toolIds.length === 0 && <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">该方案未绑定具体工具</div>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><BookOpen size={16} /> 方案建议</h3>
            <div className={`prose max-w-none ${isEyeCare ? 'prose-stone' : 'prose-slate'}`}><ReactMarkdown>{solution.aiAdvice}</ReactMarkdown></div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center relative">
          <div className="flex items-center gap-2 relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all shadow-sm flex items-center gap-2"><Download size={16} /> 导出方案</button>
            {showExportMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 origin-bottom-left z-50">
                {(['md', 'txt', 'csv'] as const).map((fmt) => (
                  <button key={fmt} onClick={() => { onExport(solution, fmt); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">{fmt === 'md' ? 'Markdown' : fmt === 'txt' ? 'TXT 文本' : 'CSV 表格'}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onDelete(solution.id)} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"><Trash2 size={16} /> 删除</button>
        </div>
      </div>
    </div>
  );
};
