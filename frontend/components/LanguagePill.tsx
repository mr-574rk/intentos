"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function LanguagePill({ inline = false }: { inline?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentSettings = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <div
      ref={ref}
      className={
        inline ? "relative flex" : "absolute top-4 right-4 md:top-6 md:right-8 z-50 hidden md:flex"
      }
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 transition-all duration-200 ${
          inline
            ? "bg-white/5 border border-white/10 rounded-full px-3 py-1.5 cursor-pointer hover:bg-white/10 text-white"
            : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[rgba(255,255,255,0.06)] text-white"
        }`}
      >
        <span className="text-sm">{currentSettings.flag}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{currentSettings.code}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full right-0 mt-2 w-36 bg-[#13161D]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${
              inline ? "z-[60]" : "z-[60]"
            }`}
          >
            <div className="py-1">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLocale(l.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                    locale === l.code ? "bg-white/10 text-white font-semibold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
