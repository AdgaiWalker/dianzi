import { useEffect, RefObject } from 'react';
import gsap from 'gsap';

interface DraggableOptions {
  onDragStart?: () => void;
  onDragEnd?: (finalX: number, finalY: number) => void;
  initialX?: number;
  initialY?: number;
}

export function useDraggableCard(
  ref: RefObject<HTMLElement | null>,
  options: DraggableOptions = {}
) {
  const { onDragStart, onDragEnd, initialX = 0, initialY = 0 } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let active = false;
    let currentX = initialX;
    let currentY = initialY;
    let startX = 0;
    let startY = 0;

    // Velocity tracking
    let lastTime = 0;
    let lastX = 0;
    let lastY = 0;
    let vx = 0;
    let vy = 0;

    let dragFrame = 0;

    // Initial position setup
    gsap.set(element, { x: currentX, y: currentY });
    element.dataset.x = currentX.toString();
    element.dataset.y = currentY.toString();

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Exclude interactive child elements
      if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('textarea')) {
        return;
      }

      active = true;
      element.classList.remove('cursor-grab');
      element.classList.add('cursor-grabbing');
      element.style.zIndex = '100';

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      startX = clientX - currentX;
      startY = clientY - currentY;

      lastTime = performance.now();
      lastX = clientX;
      lastY = clientY;
      vx = 0;
      vy = 0;

      gsap.killTweensOf(element);

      gsap.to(element, {
        scale: 1.045,
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 10px 22px -8px rgba(0, 0, 0, 0.2), 0 0 20px rgba(16, 185, 129, 0.3)',
        duration: 0.3,
        ease: 'power2.out',
      });

      if (onDragStart) onDragStart();
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!active) return;

      const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
      const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

      const pendingX = clientX - startX;
      const pendingY = clientY - startY;

      // Track instantaneous velocity
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      vx = (clientX - lastX) / dt;
      vy = (clientY - lastY) / dt;

      lastTime = now;
      lastX = clientX;
      lastY = clientY;

      currentX = pendingX;
      currentY = pendingY;

      if (dragFrame) return;
      dragFrame = requestAnimationFrame(() => {
        dragFrame = 0;
        if (!active) return;

        element.dataset.x = currentX.toString();
        element.dataset.y = currentY.toString();

        const skewVal = Math.max(-12, Math.min(12, vx * 12));
        const rotVal = Math.max(-6, Math.min(6, vx * 6));

        gsap.set(element, {
          x: currentX,
          y: currentY,
          skewX: skewVal,
          rotate: rotVal,
        });
      });
    };

    const handleEnd = () => {
      if (!active) return;
      cancelAnimationFrame(dragFrame);
      dragFrame = 0;

      active = false;
      element.classList.remove('cursor-grabbing');
      element.classList.add('cursor-grab');
      element.style.zIndex = '10';

      const inertiaFactor = 160;
      const finalX = currentX + vx * inertiaFactor;
      const finalY = currentY + vy * inertiaFactor;

      // Restrict boundary limits based on viewport size
      const maxW = Math.max(200, window.innerWidth / 2 - 120);
      const maxH = Math.max(150, window.innerHeight / 2 - 180);

      const clampedX = Math.max(-maxW, Math.min(maxW, finalX));
      const clampedY = Math.max(-maxH, Math.min(maxH, finalY));

      gsap.killTweensOf(element);
      gsap.to(element, {
        x: clampedX,
        y: clampedY,
        skewX: 0,
        rotate: 0,
        scale: 1.0,
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), 0 2px 12px rgba(0, 0, 0, 0.04)',
        duration: 0.85,
        ease: 'power3.out',
        onComplete: () => {
          gsap.set(element, { clearProps: 'boxShadow,scale' });
        },
        onUpdate: () => {
          currentX = gsap.getProperty(element, 'x') as number;
          currentY = gsap.getProperty(element, 'y') as number;
          element.dataset.x = currentX.toString();
          element.dataset.y = currentY.toString();
        },
      });

      if (onDragEnd) onDragEnd(clampedX, clampedY);
    };

    element.addEventListener('mousedown', handleStart);
    element.addEventListener('touchstart', handleStart, { passive: true });

    const mouseMoveHandler = (e: MouseEvent) => handleMove(e);
    const touchMoveHandler = (e: TouchEvent) => handleMove(e);
    const endHandler = () => handleEnd();

    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('touchmove', touchMoveHandler, { passive: true });
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchend', endHandler);

    return () => {
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('mouseup', endHandler);
      window.removeEventListener('touchend', endHandler);
      cancelAnimationFrame(dragFrame);
    };
  }, [ref, options.initialX, options.initialY]);
}
