"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  useMotionValue,
  useSpring,
  useTransform,
  motion,
} from "framer-motion";

// ─────────────────────────────────────────────
// Image Preloader Hook
// ─────────────────────────────────────────────
function useImagePreloader(sequences: { dir: string; count: number }[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount]   = useState(0);
  const [isLoaded, setIsLoaded]       = useState(false);
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
        const done = () => { loaded++; setLoadedCount(loaded); if (loaded === total) setIsLoaded(true); };
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Prevent SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 90, damping: 30, mass: 0.3 });

  const bgParallaxY   = useTransform(smoothProgress, [0, 1], ["0px", "20px"]);
  const textParallaxY = useTransform(smoothProgress, [0, 1], ["0px", "-40px"]);
  const glowOpacity   = useTransform(smoothProgress, [0.5, 0.6, 0.75, 0.9], [0, 0.55, 0.55, 0]);

  const [isLoading,    setIsLoading]    = useState(true);
  const [heroExiting,  setHeroExiting]  = useState(false);
  const [heroGone,     setHeroGone]     = useState(false);

  const TOTAL_DELTA = 5000;
  const EXIT_THRESHOLD = 800; // Extra "push" needed to slide away
  const MAX_CAP = TOTAL_DELTA + EXIT_THRESHOLD;

  const sequences = useMemo(() => [
    { dir: "s1", count: 240 },
    { dir: "s2", count: 240 },
  ], []);

  const { isLoaded, loadedCount, totalCount, images } = useImagePreloader(sequences);

  useEffect(() => {
    if (!isLoaded) return;
    rawProgress.set(0);
    smoothProgress.jump(0);
    setTimeout(() => setIsLoading(false), 80);
  }, [isLoaded, rawProgress, smoothProgress]);

  const accDelta  = useRef(0);
  const touchRefY = useRef(0);

  // ── Wheel / touch → drive rawProgress ──
  useEffect(() => {
    if (isLoading || heroExiting || heroGone) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      accDelta.current = Math.max(0, Math.min(MAX_CAP, accDelta.current + e.deltaY));
      const p = Math.min(1, accDelta.current / TOTAL_DELTA);
      rawProgress.set(p);
      
      // Trigger exit only if we "push" past the animation end by more than half the threshold
      if (accDelta.current >= TOTAL_DELTA + EXIT_THRESHOLD * 0.4) {
        setHeroExiting(true);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchRefY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = touchRefY.current - e.touches[0].clientY;
      touchRefY.current = e.touches[0].clientY;
      accDelta.current = Math.max(0, Math.min(MAX_CAP, accDelta.current + dy * 3));
      const p = Math.min(1, accDelta.current / TOTAL_DELTA);
      rawProgress.set(p);
      
      if (accDelta.current >= TOTAL_DELTA + EXIT_THRESHOLD * 0.4) {
        setHeroExiting(true);
      }
    };

    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true  });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });

    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
    };
  }, [isLoading, heroExiting, heroGone, rawProgress, MAX_CAP]);

  // ── Re-enter hero when user scrolls back to top ──
  useEffect(() => {
    if (!heroGone) return;

    const onScroll = () => {
      // Use 15px buffer to handle varied scroll acceleration/elasticity
      if (window.scrollY < 15) {
        // Reset to EXACTLY the animation end, so they have to "push" to exit again
        accDelta.current = TOTAL_DELTA;
        rawProgress.set(1);
        smoothProgress.jump(1);
        setHeroExiting(false);
        setHeroGone(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroGone, rawProgress, smoothProgress, TOTAL_DELTA]);

  // ── Overflow management ──
  useEffect(() => {
    if (heroGone || heroExiting) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    } else {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [heroGone, heroExiting]);

  // ── Canvas render loop ──
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    let raf: number;

    const render = () => {
      const progress    = smoothProgress.get();
      const targetSeq   = progress < 0.5 ? "s1" : "s2";
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

        let dw: number, dh: number;
        if (canvasAspect > imgAspect) { dw = cw;          dh = cw / imgAspect;  }
        else                           { dh = ch;          dw = ch * imgAspect;  }
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
  }, [isLoading, smoothProgress, images, heroGone]);

  if (!mounted) return null;
  if (heroGone) return null;

  if (!isLoaded) {
    const pct = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b1220]">
        <div className="text-white text-center px-8">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3"/>
              <circle
                cx="40" cy="40" r="34" fill="none" stroke="#60a5fa" strokeWidth="3"
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
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase font-mono mb-6">Entering the Studio</p>
          <div className="w-48 h-px bg-white/10 mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#60a5fa] to-white/60 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[#0b1220] overflow-hidden"
      initial={{ y: "-100%" }}
      animate={heroExiting ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => { if (heroExiting) setHeroGone(true); }}
    >
      <motion.div style={{ y: bgParallaxY }} className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.4) 70%)" }} />
      </motion.div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-10" />

      <motion.div style={{ opacity: glowOpacity }} className="absolute inset-0 pointer-events-none z-20">
        <div style={{ position: "absolute", top: "10%", left: "30%", right: 0, bottom: "5%", background: "radial-gradient(ellipse at 60% 50%, rgba(96,165,250,0.18) 0%, rgba(96,165,250,0.07) 40%, transparent 70%)", filter: "blur(20px)" }} />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-20" style={{ background: "radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.38) 100%)" }} />

      <motion.div style={{ y: textParallaxY }} className="absolute inset-0 pointer-events-none z-30">
        <Scrollytelling smoothProgress={smoothProgress} />
      </motion.div>

      <ScrollIndicator smoothProgress={smoothProgress} />
    </motion.div>
  );
}

function Scrollytelling({ smoothProgress }: { smoothProgress: ReturnType<typeof useSpring> }) {
  const s1Opacity = useTransform(smoothProgress, [0, 0.05, 0.12, 0.15], [0, 1, 1, 0]);
  const s1Y       = useTransform(smoothProgress, [0, 0.15], [28, -28]);

  const beats = [
    { o: useTransform(smoothProgress, [0.15, 0.22, 0.28, 0.35], [0, 1, 1, 0]), y: useTransform(smoothProgress, [0.15, 0.35], [20, -20]), title: <>Every Thumbnail<br/>Starts as an Idea</>,   sub: "Late nights, experimentation, and creative instincts." },
    { o: useTransform(smoothProgress, [0.35, 0.42, 0.53, 0.60], [0, 1, 1, 0]), y: useTransform(smoothProgress, [0.35, 0.60], [20, -20]), title: "Crafted for Attention",                      sub: "Design that stops the scroll." },
    { o: useTransform(smoothProgress, [0.60, 0.67, 0.78, 0.85], [0, 1, 1, 0]), y: useTransform(smoothProgress, [0.60, 0.85], [20, -20]), title: <>Turning Concepts<br/>Into Clicks</>,        sub: "Ideas transforming into visuals that perform." },
    { o: useTransform(smoothProgress, [0.85, 0.92, 0.97, 1.00], [0, 1, 1, 0]), y: useTransform(smoothProgress, [0.85, 1.00], [20, -20]), title: "Visuals That Get Clicks",                    sub: "Scroll down to explore the work." },
  ];

  const panelStyle = { background: "linear-gradient(105deg, rgba(11,18,32,0.72) 0%, rgba(11,18,32,0) 100%)", borderRadius: "12px" };

  return (
    <div className="absolute inset-0 select-none">
      <motion.div style={{ opacity: s1Opacity, y: s1Y }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white font-semibold tracking-tight leading-[1.02] mb-4" style={{ fontSize: "clamp(2.2rem, 9vw, 7.5rem)" }}>IDEAS START HERE</h1>
        <p className="text-white/60 font-light tracking-wide max-w-lg" style={{ fontSize: "clamp(0.9rem, 2vw, 1.25rem)" }}>Inside the mind of a thumbnail designer</p>
      </motion.div>

      <div className="absolute" style={{ top: "clamp(16px, 5vh, 80px)", left: "clamp(14px, 4vw, 80px)", maxWidth: "clamp(190px, 42vw, 420px)", width: "100%" }}>
        {beats.map((b, i) => (
          <motion.div key={i} className="absolute top-0 left-0 w-full flex flex-col items-start" style={{ opacity: b.o, y: b.y, padding: "clamp(10px, 2vw, 28px)", gap: "clamp(6px, 1vw, 16px)", ...panelStyle }}>
            <h2 className="text-white font-semibold tracking-tight leading-[1.12]" style={{ fontSize: "clamp(1.2rem, 3.8vw, 3.5rem)" }}>{b.title}</h2>
            <p className="text-white/65 leading-relaxed" style={{ fontSize: "clamp(0.78rem, 1.5vw, 1.1rem)" }}>{b.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ScrollIndicator({ smoothProgress }: { smoothProgress: ReturnType<typeof useSpring> }) {
  const opacity = useTransform(smoothProgress, [0, 0.08], [1, 0]);
  return (
    <motion.div style={{ opacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none z-40">
      <span className="text-white/40 text-xs tracking-[0.28em] uppercase font-mono">Scroll to enter the studio</span>
      <div className="w-px h-12 bg-white/15 relative overflow-hidden">
        <motion.div className="absolute top-0 left-0 w-full h-full bg-white" animate={{ y: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} />
      </div>
      <motion.svg width="16" height="10" viewBox="0 0 16 10" fill="none" animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}>
        <path d="M1 1L8 8L15 1" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    </motion.div>
  );
}
