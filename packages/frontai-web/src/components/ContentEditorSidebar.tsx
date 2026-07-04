import React from 'react';
import { FileText, AlertTriangle, Zap } from 'lucide-react';
import type { CompassContentRecord } from '@dianzi/shared';
import { contentTypeLabel, statusLabel } from '@/hooks/useContentEditor';

interface ContentEditorSidebarProps {
  isEyeCare: boolean;
  canSubmit: boolean;
  existingData: CompassContentRecord | null;
}

/** 内容编辑器侧边栏：快捷提示 + 权限提示 + 内容信息 */
export const ContentEditorSidebar: React.FC<ContentEditorSidebarProps> = ({
  isEyeCare,
  canSubmit,
  existingData,
}) => (
  <div className="space-y-6">
    {/* 快捷提示 */}
    <div className={`${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Zap size={18} className="text-amber-500" />
        快捷提示
      </h3>
      <ul className="space-y-3 text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>支持 Markdown 语法，可添加标题、列表、代码块等</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>可直接粘贴图片，系统会自动处理</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">•</span>
          <span>Ctrl/Cmd + S 快速保存</span>
        </li>
      </ul>
    </div>

    {/* 权限提示 */}
    {!canSubmit && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} />
          <span className="font-medium">权限提示</span>
        </div>
        <p>您暂无内容提交权限，请联系管理员申请。</p>
      </div>
    )}

    {/* 内容信息 */}
    {existingData && (
      <div className={`${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FileText size={18} className="text-slate-400" />
          内容信息
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">状态</span>
            <span className="font-medium">{statusLabel(existingData.status)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">类型</span>
            <span className="font-medium">{contentTypeLabel(existingData.contentType)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Slug</span>
            <span className="truncate font-medium">{existingData.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">创建时间</span>
            <span className="font-medium">{new Date(existingData.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">更新时间</span>
            <span className="font-medium">{new Date(existingData.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);
