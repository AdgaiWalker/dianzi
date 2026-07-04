import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('frontai static html shell', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');

  it('renders core public content before JavaScript executes', () => {
    const rootContent = html.match(/<div id="root">([\s\S]*?)<\/div>/)?.[1] ?? '';

    expect(rootContent).toContain('盘根 AI 指南针');
    expect(rootContent).toContain('Cursor');
    expect(rootContent).toContain('Midjourney');
    expect(rootContent).toContain('Gamma');
  });

  it('keeps the static shell free of blocked external resources', () => {
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.loli|picsum|fastly\.picsum/);
  });
});
