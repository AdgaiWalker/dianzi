import type { PostTag } from '@/types';

export const POST_TAGS: { value: PostTag; label: string }[] = [
  { value: 'share', label: '#分享' },
  { value: 'help', label: '#求助' },
  { value: 'secondhand', label: '#二手' },
  { value: 'event', label: '#活动' },
  { value: 'discussion', label: '#讨论' },
];

export function tagLabel(tag: string): string {
  return POST_TAGS.find((t) => t.value === tag)?.label ?? `#${tag}`;
}
