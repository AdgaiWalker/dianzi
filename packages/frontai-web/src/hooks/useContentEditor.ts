import { useEffect, useState, useRef, useCallback, type RefObject } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentApi, platformApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { MarkdownEditorRef } from '@/components/MarkdownEditor';
import type { CompassContentRecord, CompassContentType, Domain } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';

/** 内容类型选项 */
export const CONTENT_TYPE_OPTIONS: { value: CompassContentType; label: string }[] = [
  { value: 'article', label: '文章' },
  { value: 'tool', label: '工具' },
  { value: 'topic', label: '专题' },
  { value: 'news', label: '资讯' },
];

/** 领域选项 */
export const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: 'creative', label: '创意' },
  { value: 'dev', label: '开发' },
  { value: 'work', label: '工作' },
];

/** 编辑器表单数据 */
interface EditorFormData {
  title: string;
  summary: string;
  domain: Domain;
  contentType: CompassContentType;
  slug: string;
  body: string;
}

/** 校验输入，返回空字符串表示通过 */
export function validateEditorInput(input: {
  contentType: CompassContentType;
  slug: string;
  title: string;
  summary: string;
  body: string;
}): string {
  if (!CONTENT_TYPE_OPTIONS.some((item) => item.value === input.contentType)) return '请选择内容类型';
  if (!input.slug.trim()) return '请输入 Slug';
  if (!/^[a-z0-9-]{2,120}$/.test(input.slug.trim())) return 'Slug 只能包含小写字母、数字和短横线，长度 2-120';
  if (!input.title.trim()) return '请输入标题';
  if (!input.summary.trim()) return '请输入摘要';
  if (!input.body.trim()) return '请输入内容';
  return '';
}

/** 内容类型显示标签 */
export function contentTypeLabel(value: CompassContentType): string {
  return CONTENT_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

/** 状态显示标签 */
export function statusLabel(value: CompassContentRecord['status']): string {
  const labels: Record<CompassContentRecord['status'], string> = {
    draft: '草稿',
    pending: '待审核',
    published: '已发布',
    rejected: '已驳回',
    archived: '已归档',
  };
  return labels[value];
}

/** hook 返回值 */
export interface UseContentEditorReturn {
  // 路由信息
  isNew: boolean;
  navigate: ReturnType<typeof useNavigate>;

  // 表单数据
  form: EditorFormData;
  setTitle: (v: string) => void;
  setSummary: (v: string) => void;
  setDomain: (v: Domain) => void;
  setContentType: (v: CompassContentType) => void;
  setSlug: (v: string) => void;
  setBody: (v: string) => void;
  markDirty: () => void;

  // 异步状态
  loading: boolean;
  saving: boolean;
  submitting: boolean;
  error: string;
  success: string;

  // 功能标志
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
  canSubmit: boolean;
  existingData: CompassContentRecord | null;

  // ref
  editorRef: RefObject<MarkdownEditorRef | null>;

  // 操作
  handleSave: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

export function useContentEditor(): UseContentEditorReturn {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAppStore();
  const isNew = id === 'new';

  // 表单状态
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [domain, setDomain] = useState<Domain>('creative');
  const [contentType, setContentType] = useState<CompassContentType>('article');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');

  // 异步状态
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 功能标志
  const [previewMode, setPreviewMode] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [existingData, setExistingData] = useState<CompassContentRecord | null>(null);

  // ref
  const editorRef = useRef<MarkdownEditorRef>(null);
  const hasUnsavedChanges = useRef(false);

  const markDirty = useCallback(() => {
    hasUnsavedChanges.current = true;
  }, []);

  // 组装提交数据
  const buildPayload = useCallback(() => ({
    contentType,
    slug: slug.trim(),
    title: title.trim(),
    summary: summary.trim(),
    domain,
    body: body.trim(),
  }), [contentType, slug, title, summary, domain, body]);

  // 数据加载与权限检查
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const loadContent = async () => {
      if (isNew || !id) return;

      try {
        const result = await contentApi.getContent(id);
        setExistingData(result);
        setTitle(result.title);
        setSummary(result.summary);
        setDomain((result.domain as Domain) || 'creative');
        setContentType(result.contentType);
        setSlug(result.slug);
        setBody(result.body);
      } catch (err) {
        setError(getErrorMessage(err, '加载内容失败'));
      } finally {
        setLoading(false);
      }
    };

    const checkPermission = async () => {
      try {
        const caps = await platformApi.getCompassCapabilities();
        setCanSubmit(caps.canSubmitContent || false);
      } catch {
        setCanSubmit(false);
      }
    };

    loadContent();
    checkPermission();
  }, [id, isNew, isLoggedIn, navigate]);

  // 保存处理
  const handleSave = useCallback(async () => {
    if (!id && !isNew) {
      setError('无效的内容 ID');
      return;
    }

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const validation = validateEditorInput({ contentType, slug, title, summary, body });
      if (validation) {
        setError(validation);
        setSaving(false);
        return;
      }

      const data = buildPayload();

      if (isNew) {
        const result = await contentApi.createContent(data);
        setSuccess('内容已保存');
        hasUnsavedChanges.current = false;
        setTimeout(() => {
          navigate(`/studio/${result.id}/edit`);
        }, 500);
      } else {
        await contentApi.updateContent(id!, data);
        setSuccess('内容已更新');
        hasUnsavedChanges.current = false;
      }
    } catch (err) {
      setError(getErrorMessage(err, '保存失败'));
    } finally {
      setSaving(false);
    }
  }, [id, isNew, contentType, slug, title, summary, body, buildPayload, navigate]);

  // 提交审核处理
  const handleSubmit = useCallback(async () => {
    if (!id && !isNew) {
      setError('无效的内容 ID');
      return;
    }

    if (!canSubmit) {
      setError('您暂无内容提交权限');
      return;
    }

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const validation = validateEditorInput({ contentType, slug, title, summary, body });
      if (validation) {
        setError(validation);
        setSubmitting(false);
        return;
      }

      // 先保存
      const data = buildPayload();
      let contentId = id!;

      if (isNew) {
        const result = await contentApi.createContent(data);
        contentId = result.id;
      } else {
        await contentApi.updateContent(id!, data);
      }

      // 提交审核
      await contentApi.submitContentForReview(contentId);
      setSuccess('内容已提交审核');
      hasUnsavedChanges.current = false;
      setTimeout(() => {
        navigate('/studio');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, '提交失败'));
    } finally {
      setSubmitting(false);
    }
  }, [id, isNew, canSubmit, contentType, slug, title, summary, body, buildPayload, navigate]);

  return {
    isNew,
    navigate,
    form: { title, summary, domain, contentType, slug, body },
    setTitle,
    setSummary,
    setDomain,
    setContentType,
    setSlug,
    setBody,
    markDirty,
    loading,
    saving,
    submitting,
    error,
    success,
    previewMode,
    setPreviewMode,
    canSubmit,
    existingData,
    editorRef,
    handleSave,
    handleSubmit,
  };
}
