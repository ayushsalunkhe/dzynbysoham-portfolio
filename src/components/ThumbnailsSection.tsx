"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const thumbnails = [
  {
    src: "/thumb_1.png",
    title: "Gaming Montage",
    views: "2.4M views",
    tag: "Gaming",
  },
  {
    src: "/thumb_2.png",
    title: "Tech Review",
    views: "1.1M views",
    tag: "Technology",
  },
  {
    src: "/thumb_3.png",
    title: "Life Documentary",
    views: "890K views",
    tag: "Lifestyle",
  },
  {
    src: "/thumb_4.png",
    title: "Finance Guide",
    views: "3.2M views",
    tag: "Finance",
  },
  {
    src: "/thumb_5.png",
    title: "Travel Vlog",
    views: "1.7M views",
    tag: "Travel",
  },
  {
    src: "/thumb_6.png",
    title: "Fitness Journey",
    views: "980K views",
    tag: "Fitness",
  },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
};

export default function ThumbnailsSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      ref={ref}
      id="work"
      className="relative bg-[#0b1220] py-28 px-6 md:px-16 overflow-hidden"
    >
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(96,165,250,0.08) 0%, transparent 65%)",
        }}
      />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-20"
      >
        <p className="text-[#60a5fa] text-xs tracking-[0.35em] uppercase font-mono mb-4">
          Portfolio
        </p>
        <h2
          className="text-white font-semibold tracking-tight leading-tight mb-4"
          style={{ fontSize: "clamp(2rem, 6vw, 5rem)" }}
        >
          Thumbnails That
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Drive Results
          </span>
        </h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
          Every design is engineered to stop the scroll and maximise click-through rate.
        </p>
      </motion.div>

      {/* Thumbnail Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
      >
        {thumbnails.map((thumb, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="group relative rounded-2xl overflow-hidden cursor-pointer"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
            }}
            whileHover={{ scale: 1.03, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Thumbnail Image */}
            <div className="aspect-video relative">
              <Image
                src={thumb.src}
                alt={thumb.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                style={{
                  background: "rgba(11,18,32,0.65)",
                  backdropFilter: "blur(2px)",
                }}
              >
                <div className="flex items-center gap-2 text-white text-sm font-mono tracking-widest">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" opacity={0.9}>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  View Design
                </div>
              </div>

              {/* Tag badge */}
              <div className="absolute top-3 left-3">
                <span
                  className="text-xs font-mono tracking-wider px-2 py-1 rounded-full text-white"
                  style={{ background: "rgba(96,165,250,0.25)", backdropFilter: "blur(6px)", border: "1px solid rgba(96,165,250,0.3)" }}
                >
                  {thumb.tag}
                </span>
              </div>
            </div>

            {/* Info bar */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-white/80 text-sm font-medium tracking-tight">{thumb.title}</span>
              <span className="text-white/35 text-xs font-mono">{thumb.views}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Subtle bottom divider glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(96,165,250,0.3), transparent)" }}
      />
    </section>
  );
}
