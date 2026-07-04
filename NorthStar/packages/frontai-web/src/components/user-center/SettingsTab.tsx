import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Copy, Download, FileText, Github, Languages, Moon, Settings, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import type { ThemeMode, Language, ExportFormat } from '@/types';
import { useSettingsAccountActions } from './useSettingsAccountActions';

const THEME_STYLES: Record<ThemeMode, { active: string; icon: string; border: string; label: string }> = {
  light: { active: 'text-blue-600', icon: 'text-blue-600', border: 'border-blue-500 bg-blue-50', label: '标准模式' },
  'eye-care': { active: 'text-amber-600', icon: 'text-amber-600', border: 'border-amber-500 bg-amber-50', label: '护眼模式' },
};

interface SettingsTabProps {
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  defaultExportFormat: ExportFormat;
  setDefaultExportFormat: (f: ExportFormat) => void;
  isLoggedIn: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  themeMode, setThemeMode, language, setLanguage,
  defaultExportFormat, setDefaultExportFormat, isLoggedIn, navigate,
}) => {
  const {
    githubOAuthConfigured,
    githubOAuthLoading,
    githubOAuthError,
    invite,
    inviteError,
    copiedInvite,
    accountMessage,
    accountError,
    deleting,
    deletionConfirmOpen,
    setDeletionConfirmOpen,
    startGitHubBind,
    createInvite,
    copyInvite,
    exportData,
    requestDeletion,
  } = useSettingsAccountActions();

  return (
    <div className="p-8 rounded-2xl bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Settings size={24} /> 设置</h2>
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Sun size={16} /> 外观主题</h3>
          <div className="flex gap-3">
            {(['light', 'eye-care'] as const).map((mode) => (
              <button key={mode} onClick={() => setThemeMode(mode)} className={`flex-1 p-4 rounded-xl border-2 transition-all ${themeMode === mode ? (mode === 'light' ? 'border-blue-500 bg-blue-50' : 'border-amber-500 bg-amber-50') : 'border-slate-200 hover:border-slate-300'}`}>
                {mode === 'light' ? <Sun size={20} className={`mx-auto mb-2 ${themeMode === 'light' ? 'text-blue-600' : 'text-slate-400'}`} /> : <Moon size={20} className={`mx-auto mb-2 ${themeMode === 'eye-care' ? 'text-amber-600' : 'text-slate-400'}`} />}
                <div className={`text-sm font-bold ${themeMode === mode ? (mode === 'light' ? 'text-blue-600' : 'text-amber-600') : 'text-slate-600'}`}>{THEME_STYLES[mode].label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Languages size={16} /> 语言</h3>
          <div className="flex gap-3">
            {(['zh', 'en'] as Language[]).map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)} className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all ${language === lang ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                {lang === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={16} /> 默认导出格式</h3>
          <div className="flex gap-3">
            {(['md', 'txt', 'csv'] as ExportFormat[]).map((fmt) => (
              <button key={fmt} onClick={() => setDefaultExportFormat(fmt)} className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-bold uppercase transition-all ${defaultExportFormat === fmt ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>{fmt}</button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">&ldquo;我的方案&rdquo;快捷导出将使用此格式</p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Github size={16} /> GitHub 账号</h3>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">绑定 GitHub</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">使用已登录的全球站账号发起绑定，后续可直接通过 GitHub OAuth 登录。</div>
              </div>
              <button onClick={() => void startGitHubBind()} disabled={!isLoggedIn || githubOAuthLoading || !githubOAuthConfigured} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${!isLoggedIn || githubOAuthLoading || !githubOAuthConfigured ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                <Github size={16} />
                {githubOAuthLoading ? '检查中' : githubOAuthConfigured ? '绑定 GitHub' : '尚未配置'}
              </button>
            </div>
            {githubOAuthError && <div className="mt-3 text-xs text-rose-700">{githubOAuthError}</div>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Copy size={16} /> 邀请码</h3>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">{invite ? invite.code : '生成你的邀请链接'}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">用于邀请同事或朋友注册全球站，不会携带你的登录态。</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void createInvite()} disabled={!isLoggedIn} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  {invite ? '刷新' : '生成'}
                </button>
                <button onClick={() => void copyInvite()} disabled={!invite} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:bg-slate-300">
                  {copiedInvite ? <Check size={16} /> : <Copy size={16} />}
                  {copiedInvite ? '已复制' : '复制链接'}
                </button>
              </div>
            </div>
            {inviteError && <div className="mt-3 text-xs text-rose-700">{inviteError}</div>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><ShieldCheck size={16} /> 账号与数据</h3>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <button onClick={() => navigate('/legal/terms')} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors">
              <FileText size={18} className="text-slate-400" /><span className="flex-1 text-left text-slate-700">用户协议</span><ChevronRight size={16} className="text-slate-300" />
            </button>
            <button onClick={() => navigate('/legal/privacy')} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors">
              <ShieldCheck size={18} className="text-slate-400" /><span className="flex-1 text-left text-slate-700">隐私政策</span><ChevronRight size={16} className="text-slate-300" />
            </button>
            <button onClick={() => void exportData()} disabled={!isLoggedIn} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Download size={18} className="text-slate-400" /><span className="flex-1 text-left text-slate-700">导出我的数据</span><ChevronRight size={16} className="text-slate-300" />
            </button>
            <button onClick={() => setDeletionConfirmOpen(true)} disabled={!isLoggedIn || deleting} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 size={18} className="text-rose-500" /><span className="flex-1 text-left text-rose-700">申请注销账号</span><ChevronRight size={16} className="text-rose-300" />
            </button>
          </div>
          {accountMessage && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{accountMessage}</div>}
          {accountError && <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{accountError}</div>}
        </div>
      </div>
      {deletionConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeletionConfirmOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                <Trash2 size={24} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">确认提交注销申请？</h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-500">提交后管理员会进入合规流程处理。</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setDeletionConfirmOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200">取消</button>
                <button onClick={() => void requestDeletion()} disabled={deleting} className="flex-1 rounded-xl bg-rose-500 py-3 font-bold text-white shadow-lg shadow-rose-500/30 transition-colors hover:bg-rose-600 disabled:bg-slate-300">
                  {deleting ? '提交中' : '提交'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
