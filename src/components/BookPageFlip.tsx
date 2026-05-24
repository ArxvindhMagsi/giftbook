import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * BookPageFlip
 *
 * Renders an open book with a true CSS 3D page-turn effect.
 *
 * The illusion works like a real book:
 *  - The current LEFT page stays fixed (it is behind the spine).
 *  - The current RIGHT page lifts up, rotates -180° around its LEFT edge (the spine).
 *  - While rotating you see the BACK of that page which has the next LEFT page content.
 *  - Once flat (at -180°) it snaps and the next spread is revealed.
 *
 * Going backward is the mirror image.
 *
 * Props
 *  currentLeft  – JSX for the current spread's left page
 *  currentRight – JSX for the current spread's right page
 *  nextLeft     – JSX for the next  spread's left page
 *  nextRight    – JSX for the next  spread's right page
 *  onFlipDone   – callback called when the animation finishes
 *  direction    – 1 (next) | -1 (prev) | 0 (idle)
 */

interface BookPageFlipProps {
  /** The two pages of the CURRENT spread */
  currentLeft: React.ReactNode;
  currentRight: React.ReactNode;
  /** The two pages of the INCOMING spread (only needed while animating) */
  nextLeft: React.ReactNode;
  nextRight: React.ReactNode;
  /** direction = 1 → flip forward, -1 → flip backward, 0 → idle */
  direction: 0 | 1 | -1;
  /** fired when animation finishes so parent can commit the new spread */
  onFlipDone: () => void;
}

export function BookPageFlip({
  currentLeft,
  currentRight,
  nextLeft,
  nextRight,
  direction,
  onFlipDone,
}: BookPageFlipProps) {
  const [flipping, setFlipping] = useState(false);
  // angle: 0° = start, -180° (fwd) or 180° (bwd) = end
  const [angle, setAngle] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION = 800; // ms

  const easeInOut = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const startFlip = useCallback(() => {
    if (flipping || direction === 0) return;
    setFlipping(true);
    setAngle(0);
    startTimeRef.current = null;

    const target = direction === 1 ? -180 : 180;

    const animate = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = easeInOut(progress);
      setAngle(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setAngle(target);
        setFlipping(false);
        onFlipDone();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [direction, flipping, onFlipDone]);

  // Kick off when direction changes to non-zero
  useEffect(() => {
    if (direction !== 0 && !flipping) {
      startFlip();
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  // How far through the flip are we? (0 → 1)
  const progress = direction !== 0 ? Math.abs(angle) / 180 : 0;
  // Opacity of the fold shadow overlay: peaks at 0.5 progress
  const shadowOpacity = Math.sin(progress * Math.PI) * 0.45;

  // Origin of the flip hinge
  // Forward (1): the flipping page is the RIGHT page, hinged at its LEFT edge
  // Backward (-1): the flipping page is the LEFT page, hinged at its RIGHT edge
  const originX = direction >= 0 ? "left" : "right";

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: 2200, transformStyle: "preserve-3d" }}
    >
      {/* ─── LAYER 1 — static NEXT spread (sits underneath the flip) ─── */}
      <div
        className="absolute inset-0 w-full h-full flex"
        style={{ zIndex: 1 }}
      >
        <div className="w-1/2 h-full overflow-hidden">{nextLeft}</div>
        <div className="w-1/2 h-full overflow-hidden">{nextRight}</div>
      </div>

      {/* ─── LAYER 2 — static half of CURRENT spread (the non-flipping side) ─── */}
      {flipping && (
        <div
          className="absolute inset-0 w-full h-full flex pointer-events-none"
          style={{ zIndex: 2 }}
        >
          {direction === 1 ? (
            // Forward flip → left page of current spread stays visible
            <div className="w-1/2 h-full overflow-hidden">{currentLeft}</div>
          ) : (
            // Backward flip → right page of current spread stays visible
            <div className="w-1/2 h-full overflow-hidden ml-auto">{currentRight}</div>
          )}
        </div>
      )}

      {/* ─── LAYER 3 — the flipping page card ─── */}
      {flipping && (
        <div
          className="absolute h-full pointer-events-none"
          style={{
            width: "50%",
            left: direction === 1 ? "50%" : "0%",
            top: 0,
            zIndex: 10,
            transformStyle: "preserve-3d",
            transformOrigin: `${originX} center`,
            transform: `rotateY(${angle}deg)`,
            willChange: "transform",
          }}
        >
          {/* Front face: shows the CURRENT spread's flipping half */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {direction === 1 ? currentRight : currentLeft}

            {/* Dynamic shadow that appears on the flipping page surface */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  direction === 1
                    ? `linear-gradient(to left, rgba(0,0,0,${shadowOpacity * 0.6}) 0%, rgba(0,0,0,${shadowOpacity}) 100%)`
                    : `linear-gradient(to right, rgba(0,0,0,${shadowOpacity * 0.6}) 0%, rgba(0,0,0,${shadowOpacity}) 100%)`,
              }}
            />
            {/* Page-edge sheen */}
            <div
              className="absolute inset-y-0 pointer-events-none"
              style={{
                [direction === 1 ? "left" : "right"]: 0,
                width: "8px",
                background: "linear-gradient(to right, rgba(255,255,255,0.18), rgba(220,190,140,0.12))",
              }}
            />
          </div>

          {/* Back face: shows the INCOMING spread's opposite half */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {direction === 1 ? nextLeft : nextRight}

            {/* Shadow on back face (mirror direction) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  direction === 1
                    ? `linear-gradient(to right, rgba(0,0,0,${shadowOpacity * 0.6}) 0%, rgba(0,0,0,${shadowOpacity}) 100%)`
                    : `linear-gradient(to left, rgba(0,0,0,${shadowOpacity * 0.6}) 0%, rgba(0,0,0,${shadowOpacity}) 100%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* ─── LAYER 4 — idle state: simply show the current spread ─── */}
      {!flipping && (
        <div
          className="absolute inset-0 w-full h-full flex"
          style={{ zIndex: 5 }}
        >
          <div className="w-1/2 h-full overflow-hidden">{currentLeft}</div>
          <div className="w-1/2 h-full overflow-hidden">{currentRight}</div>
        </div>
      )}

      {/* ─── Shadow cast on the underlying page from the flipping leaf ─── */}
      {flipping && (
        <div
          className="absolute top-0 h-full pointer-events-none"
          style={{
            width: "15%",
            left:
              direction === 1
                ? `${50 - 15 * progress}%`
                : `${35 + 15 * progress}%`,
            zIndex: 3,
            background:
              direction === 1
                ? `linear-gradient(to left, rgba(0,0,0,${shadowOpacity * 0.7}), transparent)`
                : `linear-gradient(to right, rgba(0,0,0,${shadowOpacity * 0.7}), transparent)`,
          }}
        />
      )}
    </div>
  );
}
