import { useState } from 'react';
import { api, type ArticleDetail } from '@/services/api';

interface UseArticleActionsInput {
  article: ArticleDetail | null;
  setArticle: (article: ArticleDetail) => void;
  token: string | null;
  navigateToLogin: () => void;
}

export function useArticleActions({ article, setArticle, token, navigateToLogin }: UseArticleActionsInput) {
  const [helpfulDone, setHelpfulDone] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const requireLogin = () => {
    if (token) return false;
    navigateToLogin();
    return true;
  };

  const markHelpful = async () => {
    if (requireLogin()) return;
    if (!article || helpfulDone) return;
    setActionError('');
    try {
      const result = await api.markArticleHelpful(article.id);
      setArticle({ ...article, helpfulCount: result.helpfulCount, confirmedAt: result.confirmedAt });
      setHelpfulDone(true);
      setMessage('已确认有帮助');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '确认失败，请稍后重试。');
    }
  };

  const submitChange = async () => {
    if (requireLogin()) return;
    if (!article || !changeNote.trim()) return;
    setActionError('');
    try {
      const result = await api.markArticleChanged(article.id, changeNote.trim());
      setArticle({
        ...article,
        changedCount: result.changedCount,
        changeNotes: [result.feedback, ...article.changeNotes],
      });
      setChangeNote('');
      setChangeOpen(false);
      setMessage('变化反馈已提交');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '变化反馈提交失败，请稍后重试。');
    }
  };

  const submitReport = async () => {
    if (requireLogin()) return;
    if (!article || !reportReason.trim()) return;
    setActionError('');
    try {
      await api.reportContent({
        targetType: 'article',
        targetId: article.id,
        reason: reportReason.trim(),
      });
      setReportReason('');
      setReportOpen(false);
      setMessage('举报已提交');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '举报提交失败，请稍后重试。');
    }
  };

  const favoriteArticle = async () => {
    if (requireLogin()) return;
    if (!article) return;
    setActionError('');
    try {
      await api.favorite({ targetType: 'article', targetId: article.id });
      setMessage('已收藏');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '收藏失败，请稍后重试。');
    }
  };

  const resolveChanged = async () => {
    if (!token || !article) return;
    setActionError('');
    try {
      await api.resolveArticleChanged(article.id);
      setArticle({ ...article, changedCount: 0, changeNotes: [] });
      setMessage('已确认内容更新，变化标记已解除');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '解除变化标记失败');
    }
  };

  const startEdit = () => {
    if (!article) return;
    setIsEditing(true);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditSummary(article.summary || '');
    setEditError('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditContent('');
    setEditSummary('');
    setEditError('');
  };

  const submitEdit = async () => {
    if (!token || !article) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('标题和内容不能为空');
      return;
    }
    setEditError('');
    setEditSubmitting(true);
    try {
      const result = await api.updateArticle(article.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        summary: editSummary.trim() || undefined,
      });
      setArticle(result.article);
      cancelEdit();
      setMessage('文章已更新');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '更新失败，请稍后重试');
    } finally {
      setEditSubmitting(false);
    }
  };

  const toggleReportOpen = () => {
    if (requireLogin()) return;
    setReportOpen((value) => !value);
  };

  const toggleChangeOpen = () => {
    if (requireLogin()) return;
    setChangeOpen((value) => !value);
  };

  return {
    helpfulDone,
    changeOpen,
    changeNote,
    setChangeNote,
    reportOpen,
    reportReason,
    setReportReason,
    message,
    actionError,
    isEditing,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editSummary,
    setEditSummary,
    editSubmitting,
    editError,
    markHelpful,
    submitChange,
    submitReport,
    favoriteArticle,
    resolveChanged,
    startEdit,
    cancelEdit,
    submitEdit,
    toggleReportOpen,
    toggleChangeOpen,
  };
}
