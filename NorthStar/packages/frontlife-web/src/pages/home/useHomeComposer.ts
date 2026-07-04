import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type SpaceSummary } from '@/services/api';

const RECOMMENDED_SPACE_IDS = ['arrival', 'food', 'academic', 'print'];
const allowedTags = ['share', 'help', 'secondhand', 'event', 'discussion'];

interface UseHomeComposerInput {
  searchParams: URLSearchParams;
  canPost: boolean;
  userName: string | null;
  onPosted: (spaceId: string) => void;
}

export function useHomeComposer({ searchParams, canPost, userName, onPosted }: UseHomeComposerInput) {
  const [writeOpen, setWriteOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postSpaceId, setPostSpaceId] = useState('freeboard');
  const [postTag, setPostTag] = useState('share');
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [spacesError, setSpacesError] = useState('');
  const [postError, setPostError] = useState('');
  const prefillKeyRef = useRef<string | null>(null);

  const visibleSpaces = RECOMMENDED_SPACE_IDS
    .map((spaceId) => spaces.find((space) => space.id === spaceId))
    .filter((space): space is SpaceSummary => Boolean(space));
  const homeSpaces = visibleSpaces.length === RECOMMENDED_SPACE_IDS.length ? visibleSpaces : spaces.slice(0, 4);

  const loadSpaces = useCallback(() => {
    setSpacesError('');
    api
      .listSpaces()
      .then((result) => {
        setSpaces(result.spaces);
        if (result.spaces.some((space) => space.id === 'freeboard')) {
          setPostSpaceId('freeboard');
        } else if (result.spaces[0]) {
          setPostSpaceId(result.spaces[0].id);
        }
      })
      .catch((err) => {
        setSpaces([]);
        setSpacesError(err instanceof Error ? err.message : '空间列表加载失败，请稍后重试。');
      });
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  useEffect(() => {
    if (spaces.length > 0 && !spaces.some((space) => space.id === postSpaceId)) {
      setPostSpaceId(spaces[0].id);
    }
  }, [postSpaceId, spaces]);

  useEffect(() => {
    if (postContent.trim()) {
      setPostError('');
    }
  }, [postContent]);

  useEffect(() => {
    if (searchParams.get('write') !== '1' || !canPost) return;

    setWriteOpen(true);

    const requestedTag = searchParams.get('tag');
    if (requestedTag && allowedTags.includes(requestedTag)) {
      setPostTag(requestedTag);
    }

    const helpQuery = searchParams.get('q')?.trim();
    if (requestedTag === 'help' && helpQuery) {
      const prefillKey = `help:${helpQuery}`;
      if (prefillKeyRef.current !== prefillKey) {
        setPostContent(`我想问：${helpQuery}`);
        prefillKeyRef.current = prefillKey;
      }
    }
  }, [canPost, searchParams]);

  const publishPost = async () => {
    const content = postContent.trim();
    if (!content) return;
    if (!postSpaceId) {
      setPostError('空间列表尚未加载完成，请稍后重试。');
      return;
    }
    setPostError('');
    try {
      const result = await api.createPost({
        spaceId: postSpaceId,
        content,
        tags: [postTag],
        authorName: userName ?? '张同学',
      });
      setPostContent('');
      setWriteOpen(false);
      onPosted(result.post.spaceId);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : '发布失败，请稍后重试。');
    }
  };

  return {
    writeOpen,
    setWriteOpen,
    postContent,
    setPostContent,
    postSpaceId,
    setPostSpaceId,
    postTag,
    setPostTag,
    spaces,
    spacesError,
    postError,
    homeSpaces,
    loadSpaces,
    publishPost,
  };
}
