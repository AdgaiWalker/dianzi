import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isEyeCare: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ onConfirm, onCancel, isEyeCare }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
    <div className={`relative w-full max-w-sm p-6 rounded-2xl shadow-2xl ${isEyeCare ? 'bg-eye-care-card' : 'bg-white'}`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>
        <h3 className="text-lg font-bold mb-2 text-slate-900">确认删除方案？</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">此操作无法撤销。该方案及其所有 AI 分析建议将被永久移除。</p>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30">删除</button>
        </div>
      </div>
    </div>
  </div>
);
