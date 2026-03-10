"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  useScroll,
  useSpring,
  useTransform,
  motion,
} from "framer-motion";

// ─────────────────────────────────────────────
// Image Preloader Hook
// ─────────────────────────────────────────────
function useImagePreloader(sequences: { dir: string; count: number }[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef<Record<string, HTMLImageElement[]>>({});

  useEffect(() => {
    let loaded = 0;
    const total = sequences.reduce((acc, seq) => acc + seq.count, 0);
    setTotalCount(total);

    sequences.forEach((seq) => {
      imagesRef.current[seq.dir] = [];
      for (let i = 1; i <= seq.count; i++) {
        const img = new Image();
        img.src = `/${seq.dir}/ezgif-frame-${i.toString().padStart(3, "0")}.jpg`;
        const done = () => {
          loaded++;
          setLoadedCount(loaded);
          if (loaded === total) setIsLoaded(true);
        };
        img.onload = done;
        img.onerror = done;
        imagesRef.current[seq.dir].push(img);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isLoaded, loadedCount, totalCount, images: imagesRef.current };
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function StudioSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const glowRef      = useRef<HTMLDivElement>(null);

  // Prevent SSR/extension hydration mismatch by rendering nothing server-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // rawProgress is a MotionValue we control 100% — it starts at 0 and is ONLY
  // updated by our own scroll listener (after we've confirmed scroll is at 0).
  // This avoids all race conditions with Framer Motion's useScroll initializing
  // at a non-zero browser-restored scroll position.
  const { scrollYProgress } = useScroll();
  const rawProgress = useRef(scrollYProgress).current;

  // Buttery smooth spring — mass: 0.3 removes micro-stutter
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    mass: 0.3,
  });

  // Parallax transforms
  const bgParallaxY   = useTransform(smoothProgress, [0, 1], ["0px",  "20px"]);
  const textParallaxY = useTransform(smoothProgress, [0, 1], ["0px", "-40px"]);

  // Monitor glow intensity: peaks in middle of sequence 2 (60–80% scroll)
  const glowOpacity = useTransform(
    smoothProgress,
    [0.5, 0.6, 0.75, 0.9],
    [0,   0.55, 0.55, 0]
  );

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  const sequences = useMemo(() => [
    { dir: "s1", count: 240 },
    { dir: "s2", count: 240 },
  ], []);

  const { isLoaded, loadedCount, totalCount, images } = useImagePreloader(sequences);

  // When loading finishes: force scroll to 0 AND immediately jump the spring,
  // then wait one rAF to confirm everything is settled before allowing renderss
  const [canvasReady, setCanvasReady] = useState(false);
  useEffect(() => {
    if (!isLoaded) return;

    // Step 1: reset browser scroll immediately
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    // Step 2: force-snap the spring to 0 so it doesn't animate from previous value
    smoothProgress.jump(0);

    // Step 3: wait 1 render frame, then confirm we're at 0 and unlock canvas
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      smoothProgress.jump(0);
      setCanvasReady(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [isLoaded, smoothProgress]);

  // ── Canvas render loop — only starts after canvasReady (scroll confirmed at 0) ──
  useEffect(() => {
    if (!canvasReady || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use the canvas element's actual rendered CSS size (not window size)
    // to ensure the internal resolution matches the display exactly.
    const setSize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    let raf: number;

    const render = () => {
      const progress = smoothProgress.get();
      const targetSeq  = progress < 0.5 ? "s1" : "s2";
      const seqProgress = progress < 0.5 ? progress * 2 : (progress - 0.5) * 2;

      const seqImages = images[targetSeq];
      if (!seqImages?.length) { raf = requestAnimationFrame(render); return; }

      const frameIndex = Math.min(
        Math.floor(seqProgress * seqImages.length),
        seqImages.length - 1
      );
      const img = seqImages[frameIndex];

      if (img?.complete && img.naturalWidth > 0) {
        const cw = canvas.width;
        const ch = canvas.height;
        const imgAspect    = img.naturalWidth / img.naturalHeight;
        const canvasAspect = cw / ch;

        // COVER: video always fills the entire viewport (no black bars).
        // Some edges may be cropped on very tall/wide viewports — this is intentional.
        let dw: number, dh: number;
        if (canvasAspect > imgAspect) {
          // Canvas wider → fit width, crop top/bottom
          dw = cw;
          dh = cw / imgAspect;
        } else {
          // Canvas taller → fit height, crop sides
          dh = ch;
          dw = ch * imgAspect;
        }
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.fillStyle = "#0b1220";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
    };
  }, [canvasReady, smoothProgress, images]);

  // Nothing renders on server — avoids extension-injected attribute mismatches
  if (!mounted) return null;

  // ── Loading Screen: show while images loading OR while waiting for scroll-reset rAF ──
  if (!isLoaded || !canvasReady) {
    const pct = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0b1220] z-50">
        <div className="text-white text-center px-8">
          {/* Animated ring */}
          <div className="relative w-20 h-20 mx-auto mb-8">
            {/* Outer ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-mono text-[#60a5fa] tracking-widest">{pct}%</span>
            </div>
          </div>

          <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-mono mb-6">
            Entering the Studio
          </p>

          {/* Progress bar */}
          <div className="w-48 h-px bg-white/10 mx-auto overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#60a5fa] to-white/60 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Main Experience ──
  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "600vh" }}>
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-[#0b1220]">

        {/* ── Layer 1: Depth background glow (slowest parallax) ── */}
        <motion.div
          style={{ y: bgParallaxY }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.4) 70%)",
            }}
          />
        </motion.div>

        {/* ── Layer 2: Canvas (neutral, no parallax — preserves frame alignment) ── */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block z-10"
        />

        {/* ── Monitor glow effect: soft radial bloom from center-right ── */}
        <motion.div
          style={{ opacity: glowOpacity }}
          className="absolute inset-0 pointer-events-none z-20"
        >
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "30%",
              right: "0",
              bottom: "5%",
              background: "radial-gradient(ellipse at 60% 50%, rgba(96,165,250,0.18) 0%, rgba(96,165,250,0.07) 40%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        </motion.div>

        {/* ── Cinematic vignette (always on) ── */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)",
          }}
        />

        {/* ── Layer 3: Text overlays (fastest parallax, pushes up) ── */}
        <motion.div
          style={{ y: textParallaxY }}
          className="absolute inset-0 pointer-events-none z-30"
        >
          <Scrollytelling smoothProgress={smoothProgress} />
        </motion.div>

        {/* ── Scroll indicator ── */}
        <ScrollIndicator smoothProgress={smoothProgress} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Scrollytelling Text Beats
// ─────────────────────────────────────────────
function Scrollytelling({ smoothProgress }: { smoothProgress: ReturnType<typeof useSpring> }) {
  // Scene 1 — centered hero (0–15%)
  const s1Opacity = useTransform(smoothProgress, [0, 0.05, 0.12, 0.15], [0, 1, 1, 0]);
  const s1Y       = useTransform(smoothProgress, [0, 0.15], [28, -28]);

  // Beat A (15–35%)
  const aOpacity = useTransform(smoothProgress, [0.15, 0.22, 0.28, 0.35], [0, 1, 1, 0]);
  const aY       = useTransform(smoothProgress, [0.15, 0.35], [20, -20]);

  // Beat B (35–60%)
  const bOpacity = useTransform(smoothProgress, [0.35, 0.42, 0.53, 0.60], [0, 1, 1, 0]);
  const bY       = useTransform(smoothProgress, [0.35, 0.60], [20, -20]);

  // Beat C (60–85%)
  const cOpacity = useTransform(smoothProgress, [0.60, 0.67, 0.78, 0.85], [0, 1, 1, 0]);
  const cY       = useTransform(smoothProgress, [0.60, 0.85], [20, -20]);

  // Final beat (85–100%)
  const dOpacity = useTransform(smoothProgress, [0.85, 0.92, 0.97, 1.0], [0, 1, 1, 0]);
  const dY       = useTransform(smoothProgress, [0.85, 1.0], [20, -20]);

  const beats = [
    {
      opacity: aOpacity, y: aY,
      title: <>Every Thumbnail<br />Starts as an Idea</>,
      sub: "Late nights, experimentation, and creative instincts.",
    },
    {
      opacity: bOpacity, y: bY,
      title: "Crafted for Attention",
      sub: "Design that stops the scroll.",
    },
    {
      opacity: cOpacity, y: cY,
      title: <>Turning Concepts<br />Into Clicks</>,
      sub: "Ideas transforming into visuals that perform.",
    },
    {
      opacity: dOpacity, y: dY,
      title: "Visuals That Get Clicks",
      sub: "Explore the work below.",
    },
  ];

  return (
    <div className="absolute inset-0 select-none">

      {/* Scene 1 — centered, large */}
      <motion.div
        style={{ opacity: s1Opacity, y: s1Y }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
      >
        <h1
          className="text-white font-semibold tracking-tight leading-[1.02] mb-4"
          style={{ fontSize: "clamp(2.2rem, 9vw, 7.5rem)" }}
        >
          IDEAS START HERE
        </h1>
        <p
          className="text-white/60 font-light tracking-wide max-w-lg"
          style={{ fontSize: "clamp(0.9rem, 2vw, 1.25rem)" }}
        >
          Inside the mind of a thumbnail designer
        </p>
      </motion.div>

      {/* Scene 2+ — top-left narrative panels */}
      <div
        className="absolute"
        style={{
          top: "clamp(16px, 5vh, 80px)",
          left: "clamp(14px, 4vw, 80px)",
          maxWidth: "clamp(190px, 42vw, 420px)",
          width: "100%",
        }}
      >
        {beats.map((beat, i) => (
          <motion.div
            key={i}
            className="absolute top-0 left-0 w-full flex flex-col items-start"
            style={{
              opacity: beat.opacity,
              y: beat.y,
              padding: "clamp(10px, 2vw, 28px)",
              background: "linear-gradient(105deg, rgba(11,18,32,0.72) 0%, rgba(11,18,32,0) 100%)",
              borderRadius: "12px",
              gap: "clamp(6px, 1vw, 16px)",
            }}
          >
            <h2
              className="text-white font-semibold tracking-tight leading-[1.12]"
              style={{ fontSize: "clamp(1.2rem, 3.8vw, 3.5rem)" }}
            >
              {beat.title}
            </h2>
            <p
              className="text-white/65 leading-relaxed"
              style={{ fontSize: "clamp(0.78rem, 1.5vw, 1.1rem)" }}
            >
              {beat.sub}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Scroll Indicator
// ─────────────────────────────────────────────
function ScrollIndicator({ smoothProgress }: { smoothProgress: ReturnType<typeof useSpring> }) {
  const opacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-40"
    >
      <span className="text-white/40 text-xs tracking-[0.28em] uppercase font-mono">
        Scroll to enter the studio
      </span>
      <div className="w-px h-12 bg-white/15 relative overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full h-full bg-white"
          animate={{ y: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
      </div>
      {/* Animated chevron */}
      <motion.svg
        width="16" height="10" viewBox="0 0 16 10" fill="none"
        animate={{ y: [0, 4, 0] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      >
        <path d="M1 1L8 8L15 1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    </motion.div>
  );
}
