import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('frontlife static html shell', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');

  it('renders core public content before JavaScript executes', () => {
    const rootContent = html.match(/<div id="root">([\s\S]*?)<\/div>/)?.[1] ?? '';

    expect(rootContent).toContain('盘根校园');
    expect(rootContent).toContain('校园美食');
    expect(rootContent).toContain('新生报到');
    expect(rootContent).toContain('二食堂三楼麻辣烫实测');
  });

  it('keeps the static shell free of blocked external resources', () => {
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.loli|picsum|fastly\.picsum/);
  });
});
