# DIANZI Landing

DIANZI 官网落地页原型。首屏以“纸张背面视角”为起点，按 8 个阶段完成从毛笔触纸、信息爆发、视角穿透、碎片回流到 Logo 成形的品牌开场动画。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS v3
- lucide-react

## 启动方式

在仓库根目录执行：

```bash
$env:CI="true"; pnpm install
pnpm --filter @dianzi/landing dev
```

默认预览地址：

```text
http://localhost:3003/
```

构建检查：

```bash
pnpm --filter @dianzi/landing build
```

## 文件结构

```text
packages/dianzi-landing/
├── public/materials/          # 视觉素材
├── src/components/            # 品牌 Logo 与开场动画组件
├── src/lib/                   # 时间轴与碎片数据
├── src/App.tsx                # 页面结构
├── src/main.tsx               # 入口
├── src/styles.css             # Tailwind 与核心动画样式
├── MATERIALS.md               # 素材清单
├── VERSION.md                 # 版本记录
└── README.md
```

## 素材放置位置

所有项目内引用素材统一放在：

```text
packages/dianzi-landing/public/materials/
```

当前页面会读取 `paper-texture.png`、`dianzi-icon.jpg`、`dianzi-logo.png` 和 `dianzi-opening-storyboard.png`。
