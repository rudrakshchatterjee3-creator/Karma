"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

interface LivingFragmentProps {
  friction: number; // 0.0 (smooth/light) to 1.0 (heavy/jagged/rusted)
}

export function LivingFragment({ friction }: LivingFragmentProps) {
  // Use a spring to make the friction value feel physical when it changes
  const smoothFriction = useSpring(friction, {
    stiffness: 40,
    damping: 15,
    mass: 2,
  });
  
  // Create a React state to drive the SVG filter attribute since motion components 
  // don't natively support animating feDisplacementMap scale out of the box easily
  const [currentNoise, setCurrentNoise] = useState(0);

  useEffect(() => {
    return smoothFriction.on("change", (v) => {
      setCurrentNoise(v * 40);
    });
  }, [smoothFriction]);

  return (
    <motion.div 
      className="relative flex items-center justify-center w-full max-w-md aspect-square mx-auto"
      animate={{
        rotate: friction * 15,
        scale: 1 + (friction * 0.05),
      }}
      transition={{ type: "spring", stiffness: 30, damping: 15 }}
    >
      {/* Ambient Glow (Visible when intent is high / friction is low) */}
      <motion.div 
        className="absolute inset-0 bg-[#84A59D] rounded-full blur-[80px]"
        animate={{
          scale: friction < 0.5 ? [0.8, 1.2, 0.8] : 0.5,
          opacity: Math.max(0, 0.4 - friction),
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Heavy Aura (Visible when friction is high) */}
      <motion.div 
        className="absolute inset-10 bg-[#3f2b26] rounded-full blur-[60px]"
        animate={{
          opacity: friction * 0.6,
        }}
      />

      <svg viewBox="0 0 200 200" className="w-full h-full z-10 overflow-visible drop-shadow-2xl">
        <defs>
          <linearGradient id="rustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A312A" />
            <stop offset="50%" stopColor="#7E4733" />
            <stop offset="100%" stopColor="#1E1614" />
          </linearGradient>
          <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#84A59D" />
            <stop offset="50%" stopColor="#B3CFC8" />
            <stop offset="100%" stopColor="#55756E" />
          </linearGradient>
          <filter id="noiseFilter" x="-10%" y="-10%" width="120%" height="120%">
             {/* Reduced baseFrequency and numOctaves for better performance */}
             <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise" />
             <feDisplacementMap in="SourceGraphic" in2="noise" scale={currentNoise} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        
        {/* Core Abstract Shape */}
        <motion.path
          filter="url(#noiseFilter)"
          initial={false}
          style={{
            willChange: "transform, d",
            fill: friction > 0.5 ? "url(#rustGradient)" : "url(#crystalGradient)",
            transition: "fill 1s ease-in-out"
          }}
          animate={{
            d: [
              "M 100 30 C 140 30 170 60 170 100 C 170 140 140 170 100 170 C 60 170 30 140 30 100 C 30 60 60 30 100 30 Z",
              "M 100 20 C 150 40 180 50 160 100 C 140 150 150 180 100 160 C 50 140 20 160 40 100 C 60 40 50 0 100 20 Z",
              "M 100 30 C 140 30 170 60 170 100 C 170 140 140 170 100 170 C 60 170 30 140 30 100 C 30 60 60 30 100 30 Z"
            ],
            rotate: [0, 180, 360],
          }}
          transition={{
            d: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 30, repeat: Infinity, ease: "linear" }
          }}
        />

        {/* Outer spikes/jagged edges that scale up with friction */}
        <motion.path
          d="M 100 5 L 115 35 L 160 20 L 140 60 L 190 85 L 150 115 L 180 165 L 130 150 L 100 195 L 70 150 L 20 165 L 50 115 L 10 85 L 60 60 L 40 20 L 85 35 Z"
          fill="url(#rustGradient)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: friction,
            scale: 0.8 + (friction * 0.3),
            rotate: -45 * friction
          }}
          transition={{ type: "spring", stiffness: 40, damping: 20 }}
          style={{ mixBlendMode: "overlay" }}
        />
      </svg>
    </motion.div>
  );
}
