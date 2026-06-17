"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LivingFragment } from "@/components/LivingFragment";

type LedgerEntry = {
  id: string;
  type: "friction" | "lightness";
  text: string;
};

export default function DailyLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([
    { id: "1", type: "friction", text: "The AC ran hard during the afternoon heat. That is an extra ₹200 burned and more heat pushed back out into Kalna." },
    { id: "2", type: "lightness", text: "Walked the 3km commute today. Bypassed the traffic exhaust and kept the air a little lighter." },
  ]);

  const [friction, setFriction] = useState(0.8);
  const [isLogging, setIsLogging] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [moneyBleeding, setMoneyBleeding] = useState(2450);

  const handleLogAction = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLogging) return;

    setIsLogging(true);
    
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionText: inputValue }),
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFriction((prev) => Math.min(1.0, Math.max(0, prev + data.frictionDelta)));
      setMoneyBleeding((prev) => Math.max(0, prev + data.moneyDelta));
      
      // Add new entry at the top of the timeline
      setEntries((prev) => [
        { id: Date.now().toString(), type: data.type, text: data.summary },
        ...prev
      ]);
      setInputValue("");
      
    } catch (error) {
      console.error("Failed to analyze action", error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans selection:bg-white/10 relative pb-32">
      
      {/* Fixed Central Fragment */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10 opacity-70 md:opacity-100">
        <div className="w-[150%] md:w-full max-w-2xl aspect-square mix-blend-screen opacity-50">
          <LivingFragment friction={friction} />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-20 w-full max-w-5xl mx-auto px-4 md:px-8 pt-24 md:pt-32 flex flex-col items-center">
        
        {/* Editorial Header & Input */}
        <div className="w-full max-w-2xl flex flex-col items-center text-center mb-24 md:mb-32">
          <h1 className="text-sm tracking-[0.2em] text-white/40 uppercase mb-8">The Ledger</h1>
          
          <div className="flex flex-col items-center gap-2 mb-12">
            <span className={`text-5xl md:text-6xl font-light tracking-tight transition-colors duration-1000 ${friction > 0.7 ? "text-[#E07A5F]" : "text-[#84A59D]"}`}>
              ₹{moneyBleeding.toLocaleString()}
            </span>
            <span className="text-sm tracking-wide text-white/50 font-light">
              Monthly Atmospheric Impact
            </span>
          </div>

          <form onSubmit={handleLogAction} className="w-full relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLogging}
              placeholder="What did you change today?"
              className="w-full bg-transparent border-b border-white/20 px-4 py-4 text-center text-lg md:text-xl text-white placeholder-white/30 focus:outline-none focus:border-white/60 transition-all font-light disabled:opacity-50"
            />
            
            <AnimatePresence>
              {isLogging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0F172A] flex items-center justify-center"
                >
                  <span className="text-sm tracking-[0.1em] text-white/60 uppercase animate-pulse">
                    Translating impact...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* The Vertical Timeline */}
        <div className="relative w-full pb-32">
          {/* The Central Line */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/20 via-white/10 to-transparent left-4 md:left-1/2 -translate-x-1/2 z-0" />

          <div className="flex flex-col gap-16 md:gap-32 w-full relative z-20 mt-12">
            <AnimatePresence>
              {entries.map((entry, index) => {
                const isLeft = entry.type === "friction";
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.1 }}
                    className={`relative flex items-center w-full group ${
                      isLeft ? "md:justify-start" : "md:justify-end"
                    }`}
                  >
                    {/* Node Dot (Mobile: left-4, Desktop: center) */}
                    <div className="absolute left-4 md:left-1/2 w-2 h-2 rounded-full bg-[#0F172A] border border-white/40 -translate-x-1/2 transition-transform duration-500 group-hover:scale-150 group-hover:bg-white/10" />

                    {/* Content Card */}
                    <div className={`w-[calc(100%-3rem)] md:w-[45%] ml-12 md:ml-0 flex ${
                      isLeft ? "md:justify-end md:pr-16" : "md:justify-start md:pl-16"
                    }`}>
                      <div className={`flex flex-col gap-3 w-full max-w-sm ${isLeft ? "md:text-right" : "md:text-left"}`}>
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${isLeft ? "text-[#E07A5F]" : "text-[#84A59D]"}`}>
                          {isLeft ? "Heavy Action" : "Light Action"}
                        </span>
                        <p className="text-base md:text-lg font-light text-white/80 leading-relaxed tracking-wide">
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  );
}
