import { motion } from 'motion/react';
import { Wrench, Shield, Zap } from 'lucide-react';

export default function Header({ imageCount }: { imageCount: number }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#08080A]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-stone-100">
            img<span className="text-orange-400">tools</span>
          </span>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-5">
          {imageCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-stone-400"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
              {imageCount} image{imageCount !== 1 ? 's' : ''} loaded
            </motion.div>
          )}
          <div className="hidden items-center gap-4 text-[11px] font-medium tracking-wide text-stone-500 uppercase sm:flex">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> Private
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" /> Client-side
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
