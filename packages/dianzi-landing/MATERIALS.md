# MATERIALS

## 已放置素材

| 文件 | 来源 | 用途 |
| --- | --- | --- |
| `public/materials/dianzi-opening-storyboard.png` | `C:/Users/26296/Desktop/点子素材/ChatGPT Image 2026年7月5日 15_04_43.png` | 8 阶段开场动画视觉参考，页面下方作为分镜预览 |
| `public/materials/dianzi-icon.jpg` | `C:/Users/26296/Desktop/点子素材/点子icon.jpg` | Logo 成形阶段的品牌标志 |
| `public/materials/dianzi-logo.png` | `C:/Users/26296/Desktop/点子素材/点子logo.png` | 备用品牌图形素材 |
| `public/materials/spiral-search-reference.html` | `C:/Users/26296/Desktop/点子素材/spiral-search.html` | 信息回流阶段的螺旋轨迹参考 |
| `public/materials/paper-texture.png` | Codex Image Gen 生成 | 暖白纸面纹理背景 |

## React Bits 使用说明

React Bits MCP 中命中的可参考组件为 `Particles`。该组件动势适合“粒子爆发”和“空间漂移”，但源码依赖 `ogl`，不属于本项目限定技术栈。因此本版本没有直接安装或复用 `ogl`，而是借鉴其“随机粒子场、透明粒子、缓慢旋转”的运动思路，用 React 数据 + CSS keyframes + div 粒子重新实现。

## 缺失项与替代方案

| 缺失项 | 当前替代方案 |
| --- | --- |
| 真实毛笔视频或透明 PNG | 使用 CSS transform、渐变和轻微 blur 生成抽象笔尖靠近效果 |
| 纸张背面真实透光手影 | 使用纸纹理、径向光场和暗部压痕模拟背面视角 |
| 真实文字残影素材 | 使用大量 `div` 文本碎片、面片和粒点从中心扩散 |
| 可逐帧控制的视频素材 | 使用 10 秒 CSS/React 时间轴替代，便于浏览器直接预览 |

## 色彩

- 暖白纸面：`#F5F0E8`
- 深墨黑：`#1A1816`
- 淡紫轨迹：`#A78BFA`
