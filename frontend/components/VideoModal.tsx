"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Reset loading state if modal is toggled
  if (!isOpen && !isVideoLoading) {
    setIsVideoLoading(true);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D0F14]/90 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,245,212,0.15)] mx-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute z-[101] top-4 right-4 md:-right-12 md:top-0 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Spinner Loader */}
            {isVideoLoading && (
              <div className="absolute inset-0 z-[98] flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-[#00F5D4] animate-spin" />
              </div>
            )}
            
            {/* YouTube Iframe */}
            <iframe
              src={`${process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/embed/urCzIw0fHck"}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              className={`w-full h-full relative z-[99] transition-opacity duration-500 ${isVideoLoading ? 'opacity-0' : 'opacity-100'}`}
              frameBorder="0"
              allowFullScreen
              onLoad={() => setIsVideoLoading(false)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
