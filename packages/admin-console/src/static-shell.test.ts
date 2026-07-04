import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('admin static html shell', () => {
  const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');

  it('renders the admin entry before JavaScript executes', () => {
    const rootContent = html.match(/<div id="root">([\s\S]*?)<script type="module"/)?.[1] ?? '';

    expect(rootContent).toContain('盘根统一后台');
    expect(rootContent).toContain('登录后台');
    expect(rootContent).toContain('admin');
  });

  it('keeps the static shell free of blocked external resources', () => {
    expect(html).not.toMatch(/fonts\.googleapis|fonts\.loli|picsum|fastly\.picsum|northstar-api/);
  });
});
