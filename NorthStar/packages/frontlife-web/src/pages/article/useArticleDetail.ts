import { useEffect, useRef, useState } from 'react';
import { api, type ArticleDetail, type ArticleSummary } from '@/services/api';

export function useArticleDetail(id: string | undefined, reloadKey: number) {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previousArticleId, setPreviousArticleId] = useState<string | null>(null);
  const [nextArticleId, setNextArticleId] = useState<string | null>(null);
  const [spaceArticles, setSpaceArticles] = useState<ArticleSummary[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    setLoading(true);
    setError('');

    api
      .getArticle(id)
      .then((result) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setArticle(result.article);
        setPreviousArticleId(result.previousArticleId);
        setNextArticleId(result.nextArticleId);
        api
          .getSpace(result.article.space.id)
          .then((spaceResult) => {
            if (!cancelled && requestIdRef.current === requestId) {
              setSpaceArticles(spaceResult.articles);
            }
          })
          .catch(() => undefined);
      })
      .catch((err) => {
        if (!cancelled && requestIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : '文章加载失败');
        }
      })
      .finally(() => {
        if (!cancelled && requestIdRef.current === requestId) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
    };
  }, [id, reloadKey]);

  return {
    article,
    setArticle,
    spaceArticles,
    previousArticleId,
    nextArticleId,
    loading,
    error,
  };
}
