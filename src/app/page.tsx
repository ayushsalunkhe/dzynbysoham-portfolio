"use client";

import { useEffect } from "react";
import StudioSequence from "@/components/StudioSequence";
import ThumbnailsSection from "@/components/ThumbnailsSection";
import ContactSection from "@/components/ContactSection";
import { motion, useScroll, useTransform } from "framer-motion";

// Smooth transition bridge between hero canvas and next sections
function HeroTransition() {
  return (
    <div className="relative h-40 bg-[#0b1220] flex items-center justify-center overflow-hidden -mt-1">
      {/* Sweeping line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 h-px origin-left"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(96,165,250,0.6), rgba(167,139,250,0.6), transparent)",
        }}
      />

      {/* Animated down arrow */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="text-white/25 text-xs tracking-[0.3em] uppercase font-mono">
          The Work
        </span>
        <motion.svg
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          width="20"
          height="14"
          viewBox="0 0 20 14"
          fill="none"
        >
          <path
            d="M1 1L10 11L19 1"
            stroke="url(#arrowGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="arrowGrad" x1="1" y1="1" x2="19" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </motion.svg>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #0b1220)",
        }}
      />
    </div>
  );
}

export default function Home() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <main className="bg-[#0b1220] text-white">
      {/* Hero — scrollytelling canvas animation */}
      <StudioSequence />

      {/* Animated transition bridge */}
      <HeroTransition />

      {/* Thumbnail portfolio */}
      <ThumbnailsSection />

      {/* Contact section */}
      <ContactSection />
    </main>
  );
}
