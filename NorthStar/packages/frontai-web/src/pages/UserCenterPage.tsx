import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UserSolution, UserCenterTab } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { t } from '../i18n';

import { ProfileTab } from '@/components/user-center/ProfileTab';
import { SettingsTab } from '@/components/user-center/SettingsTab';
import { CreditsTab } from '@/components/user-center/CreditsTab';
import { SolutionsTab } from '@/components/user-center/SolutionsTab';
import { SolutionDrawer } from '@/components/user-center/SolutionDrawer';
import { DeleteConfirmModal } from '@/components/user-center/DeleteConfirmModal';
import { FavoritesTab } from '@/components/user-center/FavoritesTab';
import { NotificationsTab } from '@/components/user-center/NotificationsTab';
import { identityApi } from '@/services/api';
import { UserAvatar } from '@/components/UserAvatar';
import { useSolutionActions } from './user-center/useSolutionActions';
import { useUserCenterAssets } from './user-center/useUserCenterAssets';

/** 侧边栏 tab 配置 */
const TAB_CONFIG: { key: UserCenterTab; i18nKey: string }[] = [
  { key: 'profile', i18nKey: 'me.profile' },
  { key: 'solutions', i18nKey: 'me.solutions' },
  { key: 'favorites', i18nKey: 'me.favorites' },
  { key: 'credits', i18nKey: 'me.credits' },
  { key: 'notifications', i18nKey: '通知' },
  { key: 'settings', i18nKey: 'me.settings' },
];

export const UserCenterPage: React.FC = () => {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    favoriteToolIds,
    setFavoriteToolIds,
    toggleToolSelection,
    defaultExportFormat,
    setDefaultExportFormat,
    isLoggedIn,
    currentUser,
    setIdentityUser,
  } = useAppStore();

  const tab = (tabParam as UserCenterTab) || 'profile';
  const isEyeCare = themeMode === 'eye-care';

  const { solutionState, setSolutionState, favoriteArticleIds, setFavoriteArticleIds } = useUserCenterAssets(
    isLoggedIn,
    setFavoriteToolIds,
  );

  // 方案详情抽屉 & 删除确认
  const [viewSolution, setViewSolution] = useState<UserSolution | null>(null);
  const [solutionToDelete, setSolutionToDelete] = useState<string | null>(null);

  const {
    removeError,
    handleDeleteConfirm,
    handleExportSolution,
    handleRemoveFavorite,
    handleRemoveArticleFavorite,
  } = useSolutionActions({
    solutionToDelete,
    setSolutionToDelete,
    viewSolution,
    setViewSolution,
    setSolutionState,
    favoriteToolIds,
    setFavoriteToolIds,
    setFavoriteArticleIds,
  });

  const navigateTab = (target: UserCenterTab) => {
    navigate(target === 'profile' ? '/me' : `/me/${target}`);
  };

  const refreshProfile = async () => {
    const result = await identityApi.me();
    setIdentityUser(result.user);
  };

  const { solutions, tools, articles } = solutionState;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in">
      {removeError && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {removeError}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar — 配置驱动渲染 */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className={`p-4 rounded-2xl ${
            isEyeCare ? 'bg-eye-care-card border border-stone-100' : 'bg-white shadow-sm border border-slate-100'
          }`}>
            <div className="flex items-center gap-3 px-2 mb-6">
              <UserAvatar name={currentUser?.name} imageUrl={currentUser?.avatar} className="h-12 w-12 rounded-full" />
              <div>
                <div className="font-bold text-sm">{currentUser?.name || '未登录'}</div>
                <div className="text-xs text-slate-400">{currentUser?.isPro ? 'Pro 用户' : '普通用户'}</div>
              </div>
            </div>
            <nav className="space-y-1">
              {TAB_CONFIG.map(({ key, i18nKey }) => (
                <button
                  key={key}
                  onClick={() => navigateTab(key)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${
                    tab === key ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {i18nKey.startsWith('me.') ? t(i18nKey, language) : i18nKey}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1">
          {tab === 'profile' && (
            <ProfileTab currentUser={currentUser} isEyeCare={isEyeCare} onProfileUpdated={() => void refreshProfile()} />
          )}
          {tab === 'solutions' && (
            <SolutionsTab
              solutions={solutions}
              tools={tools}
              isLoggedIn={isLoggedIn}
              isEyeCare={isEyeCare}
              defaultExportFormat={defaultExportFormat}
              navigate={navigate}
              onViewSolution={(sol) => setViewSolution(sol)}
              onDeleteSolution={(id) => setSolutionToDelete(id)}
              onExportSolution={handleExportSolution}
            />
          )}
          {solutionState.error && tab === 'solutions' && (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
              {solutionState.error}
            </div>
          )}
          {tab === 'favorites' && (
            <FavoritesTab
              tools={tools}
              articles={articles}
              favoriteToolIds={favoriteToolIds}
              favoriteArticleIds={favoriteArticleIds}
              isEyeCare={isEyeCare}
              navigate={navigate}
              onRemoveFavoriteTool={handleRemoveFavorite}
              onRemoveFavoriteArticle={handleRemoveArticleFavorite}
              onToggleToolSelection={toggleToolSelection}
            />
          )}
          {tab === 'credits' && (
            <CreditsTab isLoggedIn={isLoggedIn} isEyeCare={isEyeCare} navigate={navigate} />
          )}
          {tab === 'notifications' && (
            <NotificationsTab isLoggedIn={isLoggedIn} isEyeCare={isEyeCare} />
          )}
          {tab === 'settings' && (
            <SettingsTab
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              language={language}
              setLanguage={setLanguage}
              defaultExportFormat={defaultExportFormat}
              setDefaultExportFormat={setDefaultExportFormat}
              isLoggedIn={isLoggedIn}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {/* 方案详情抽屉 */}
      {viewSolution && (
        <SolutionDrawer
          solution={viewSolution}
          tools={tools}
          isEyeCare={isEyeCare}
          onClose={() => setViewSolution(null)}
          onDelete={(id) => setSolutionToDelete(id)}
          onExport={handleExportSolution}
          onNavigate={(path) => navigate(path)}
        />
      )}

      {/* 删除确认弹窗 */}
      {solutionToDelete && (
        <DeleteConfirmModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setSolutionToDelete(null)}
          isEyeCare={isEyeCare}
        />
      )}
    </div>
  );
};
