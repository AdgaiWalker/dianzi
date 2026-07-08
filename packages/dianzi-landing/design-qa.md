# Design QA

final result: passed

## Source Visual

- Reference storyboard: `public/materials/dianzi-opening-storyboard.png`
- Brand icon: `public/materials/dianzi-icon.jpg`
- Paper texture: `public/materials/paper-texture.png`

## Render Evidence

- Local URL: `http://localhost:3003/`
- Desktop screenshot: `qa-desktop-final.png`
- Mobile viewport: Chrome DevTools window was locked maximized during final screenshot retry, but responsive DOM check reported `overflowX: false`.

## Checks

- Console: no runtime errors. Only Vite dev connection and React DevTools informational messages.
- Network: all page scripts and image assets returned 200 or 304. `favicon.ico` 404 was fixed by adding `/materials/dianzi-icon.jpg` as the page icon.
- Timeline: final stage reports `Logo 成形`, and `.opening__logo` opacity is `1`.
- Layout: desktop Logo and headline bounding boxes do not overlap after final positioning fix.
- Responsive: no horizontal overflow detected in mobile-width QA.
- Material direction: warm paper, deep ink black, and pale violet trajectory match the supplied palette.

## Intentional Deviations

- React Bits `Particles` was not copied directly because its implementation imports `ogl`, which is outside the requested stack. The particle movement was reimplemented with React data and CSS keyframes.
- A real brush image was not provided. The brush approach is represented by a blurred CSS silhouette and transform motion.
