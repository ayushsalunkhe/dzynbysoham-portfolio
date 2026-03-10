"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const WHATSAPP_URL = "https://wa.me/919999999999"; // replace with real number
const INSTAGRAM_URL = "https://instagram.com/dzynbysoham"; // replace with real handle

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 40 },
    animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 },
    transition: { duration: 0.75, ease: EASE, delay },
  });

  return (
    <section
      ref={ref}
      id="contact"
      className="relative bg-[#0b1220] py-32 px-6 md:px-16 overflow-hidden"
    >
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(167,139,250,0.1) 0%, transparent 60%)",
        }}
      />

      {/* Top divider */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(167,139,250,0.25), transparent)",
        }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Label */}
        <motion.p {...anim(0)} className="text-[#a78bfa] text-xs tracking-[0.35em] uppercase font-mono mb-6">
          Let&apos;s Work Together
        </motion.p>

        {/* Headline */}
        <motion.h2
          {...anim(0.1)}
          className="text-white font-semibold tracking-tight leading-tight mb-6"
          style={{ fontSize: "clamp(2.2rem, 7vw, 5.5rem)" }}
        >
          Ready to Make
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Thumbnail?
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          {...anim(0.2)}
          className="text-white/50 text-lg leading-relaxed max-w-lg mx-auto mb-14"
        >
          Drop a message and let&apos;s design something that gets clicks.
          Fast turnaround. Premium quality.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...anim(0.3)}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* WhatsApp */}
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base tracking-wide w-full sm:w-auto justify-center"
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              boxShadow: "0 0 32px rgba(37,211,102,0.3)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat on WhatsApp
          </motion.a>

          {/* Instagram */}
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold text-base tracking-wide w-full sm:w-auto justify-center"
            style={{
              background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
              boxShadow: "0 0 32px rgba(253,29,29,0.25)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Follow on Instagram
          </motion.a>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          {...anim(0.45)}
          className="text-white/20 text-xs font-mono tracking-widest uppercase mt-16"
        >
          Designed with obsession — Soham
        </motion.p>
      </div>
    </section>
  );
}
