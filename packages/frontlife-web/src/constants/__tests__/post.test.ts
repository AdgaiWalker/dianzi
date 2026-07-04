import { describe, it, expect } from 'vitest';
import { tagLabel, POST_TAGS } from '../post';

describe('tagLabel', () => {
  it('返回已知标签的中文标签名', () => {
    expect(tagLabel('share')).toBe('#分享');
    expect(tagLabel('help')).toBe('#求助');
    expect(tagLabel('secondhand')).toBe('#二手');
    expect(tagLabel('event')).toBe('#活动');
    expect(tagLabel('discussion')).toBe('#讨论');
  });

  it('未知标签返回 #tag 格式', () => {
    expect(tagLabel('unknown')).toBe('#unknown');
    expect(tagLabel('custom')).toBe('#custom');
  });
});

describe('POST_TAGS', () => {
  it('包含 5 种标签', () => {
    expect(POST_TAGS).toHaveLength(5);
  });

  it('每个标签有 value 和 label', () => {
    for (const tag of POST_TAGS) {
      expect(tag.value).toBeTruthy();
      expect(tag.label).toBeTruthy();
      expect(tag.label).toMatch(/^#/);
    }
  });
});
