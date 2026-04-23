import { useEffect, useRef, useState } from "react";
import "./PinchZoom.css";

function dist(t1, t2) {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}
function mid(t1, t2) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}

/**
 * Smartphone-gallery style pinch-zoom.
 * - Pinch with two fingers to zoom, centered on the pinch midpoint.
 * - Simultaneous pinch + pan (move both fingers).
 * - Single-finger pan when zoomed in.
 * - Double-tap toggles 1x <-> 2.5x centered on the tap.
 * - Horizontal swipe at 1x triggers onNext / onPrev.
 * - Clamps pan so you can't drag the image way out of view.
 */
const MIN_SCALE = 1;
const MAX_SCALE = 5;

function PinchZoom({ children, onNext, onPrev }) {
  const wrapRef = useRef(null);
  const [t, setT] = useState({ s: 1, x: 0, y: 0 });
  const g = useRef(null); // gesture state
  const lastTap = useRef(0);
  const animating = useRef(false);

  const reset = () => setT({ s: 1, x: 0, y: 0 });

  useEffect(() => {
    reset();
  }, [children]);

  // Clamp translation so the image doesn't drift too far off
  const clampXY = (x, y, s) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };
    const overX = Math.max(0, (rect.width * s - rect.width) / 2);
    const overY = Math.max(0, (rect.height * s - rect.height) / 2);
    return {
      x: Math.max(-overX, Math.min(overX, x)),
      y: Math.max(-overY, Math.min(overY, y)),
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const m = mid(a, b);
      const rect = wrapRef.current.getBoundingClientRect();
      // Midpoint relative to the wrapper, centered at wrapper center
      const relX = m.x - rect.left - rect.width / 2;
      const relY = m.y - rect.top - rect.height / 2;
      g.current = {
        mode: "pinch",
        startDist: dist(a, b),
        startScale: t.s,
        startTx: t.x,
        startTy: t.y,
        startMidX: relX,
        startMidY: relY,
      };
      animating.current = true;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      if (now - lastTap.current < 280 && e.touches.length === 1) {
        // double tap
        const rect = wrapRef.current.getBoundingClientRect();
        if (t.s > 1.2) {
          setT({ s: 1, x: 0, y: 0 });
        } else {
          const targetScale = 2.5;
          const relX = touch.clientX - rect.left - rect.width / 2;
          const relY = touch.clientY - rect.top - rect.height / 2;
          // Point in image coords
          const pxi = (relX - t.x) / t.s;
          const pyi = (relY - t.y) / t.s;
          const newX = relX - pxi * targetScale;
          const newY = relY - pyi * targetScale;
          const clamped = clampXY(newX, newY, targetScale);
          setT({ s: targetScale, x: clamped.x, y: clamped.y });
        }
        lastTap.current = 0;
        g.current = null;
        return;
      }
      lastTap.current = now;
      g.current = {
        mode: t.s > 1.02 ? "pan" : "swipe",
        startX: touch.clientX,
        startY: touch.clientY,
        startTx: t.x,
        startTy: t.y,
        moved: false,
      };
      animating.current = true;
    }
  };

  const handleTouchMove = (e) => {
    const cur = g.current;
    if (!cur) return;
    if (cur.mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const m = mid(a, b);
      const rect = wrapRef.current.getBoundingClientRect();
      const relX = m.x - rect.left - rect.width / 2;
      const relY = m.y - rect.top - rect.height / 2;
      const d = dist(a, b);
      const newScale = Math.max(
        MIN_SCALE * 0.7,
        Math.min(MAX_SCALE, cur.startScale * (d / cur.startDist))
      );
      // Adjust translation so the pinch midpoint stays anchored in image coords,
      // plus add pan from midpoint movement.
      const pxi = (cur.startMidX - cur.startTx) / cur.startScale;
      const pyi = (cur.startMidY - cur.startTy) / cur.startScale;
      const newX = relX - pxi * newScale;
      const newY = relY - pyi * newScale;
      setT({ s: newScale, x: newX, y: newY });
    } else if (cur.mode === "pan" && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - cur.startX;
      const dy = touch.clientY - cur.startY;
      const clamped = clampXY(cur.startTx + dx, cur.startTy + dy, t.s);
      setT((prev) => ({ ...prev, x: clamped.x, y: clamped.y }));
    } else if (cur.mode === "swipe" && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - cur.startX;
      const dy = touch.clientY - cur.startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cur.moved = true;
    }
  };

  const handleTouchEnd = (e) => {
    const cur = g.current;
    if (!cur) {
      animating.current = false;
      return;
    }
    if (cur.mode === "pinch") {
      // settle: clamp scale between MIN and MAX, recenter if zoomed out fully
      setT((prev) => {
        let s = prev.s;
        if (s < 1) {
          return { s: 1, x: 0, y: 0 };
        }
        const clamped = clampXY(prev.x, prev.y, s);
        return { s, x: clamped.x, y: clamped.y };
      });
    } else if (cur.mode === "swipe") {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - cur.startX;
      const dy = touch.clientY - cur.startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (dx > 0) onPrev?.();
        else onNext?.();
      }
    }
    g.current = null;
    animating.current = false;
  };

  const pct = Math.round(t.s * 100);

  return (
    <div className="pz-wrap" ref={wrapRef}>
      <div
        className="pz-inner"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
          transition: animating.current ? "none" : "transform 0.25s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
      <div className="pz-controls">
        <button onClick={() => setT((p) => {
          const s = Math.max(MIN_SCALE, p.s - 0.5);
          const c = clampXY(p.x, p.y, s);
          return s === 1 ? { s: 1, x: 0, y: 0 } : { s, x: c.x, y: c.y };
        })}>−</button>
        <button onClick={reset}>{pct}%</button>
        <button onClick={() => setT((p) => {
          const s = Math.min(MAX_SCALE, p.s + 0.5);
          const c = clampXY(p.x, p.y, s);
          return { s, x: c.x, y: c.y };
        })}>+</button>
      </div>
    </div>
  );
}

export default PinchZoom;
