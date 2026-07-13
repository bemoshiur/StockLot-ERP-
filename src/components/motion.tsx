'use client'

import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const // crisp "expo-out" feel
const spring = { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } as const

/** Fade + rise on mount. Wrap any block of content. */
export function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: easeOut, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Staggered children — pair with <StaggerItem>. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } } }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 10, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
      transition={spring}
    >
      {children}
    </motion.div>
  )
}
