import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useRef, useEffect, type ReactNode, type CSSProperties } from 'react'

// ── Fade-in on scroll ─────────────────────────────────────
interface FadeInProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
  once?: boolean
}

const directionOffset = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 60, y: 0 },
  right: { x: -60, y: 0 },
  none: { x: 0, y: 0 },
}

export function FadeIn({
  children,
  className = '',
  style,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  once = true,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '-60px' })
  const offset = directionOffset[direction]

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: offset.x, y: offset.y }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

// ── Stagger children on scroll ────────────────────────────
interface StaggerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function Stagger({
  children,
  className = '',
  style,
  staggerDelay = 0.1,
  direction = 'up',
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const offset = directionOffset[direction]

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, x: offset.x, y: offset.y },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}

// ── Scale on scroll ───────────────────────────────────────
interface ScaleInProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
}

export function ScaleIn({ children, className = '', style, delay = 0 }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

// ── Animated counter ──────────────────────────────────────
interface CounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  style?: CSSProperties
  duration?: number
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style,
  duration = 2,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  )

  useEffect(() => {
    if (inView) {
      animate(motionValue, value, { duration, ease: 'easeOut' })
    }
  }, [inView, value, motionValue, duration])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

// ── Hover lift card ───────────────────────────────────────
interface HoverCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  as?: 'div' | 'a'
  href?: string
  onClick?: () => void
}

export function HoverCard({ children, className = '', style, onClick }: HoverCardProps) {
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: 'easeOut' } }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

// ── Parallax float (decorative elements) ──────────────────
interface FloatProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  range?: number
  duration?: number
}

export function Float({ children, className = '', style, range = 12, duration = 4 }: FloatProps) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{ y: [-range, range, -range] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── Text reveal (word by word) ────────────────────────────
interface TextRevealProps {
  text: string
  className?: string
  style?: CSSProperties
  delay?: number
  highlight?: string
  highlightStyle?: CSSProperties
}

export function TextReveal({
  text,
  className = '',
  style,
  delay = 0,
  highlight,
  highlightStyle,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const words = text.split(' ')

  return (
    <span ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: delay + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {highlight && word.includes(highlight) ? (
            <span style={highlightStyle}>{word}</span>
          ) : (
            word
          )}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

// ── Infinite horizontal scroll (brands) ───────────────────
interface MarqueeProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: 'left' | 'right'
}

export function Marquee({ children, className = '', speed = 25, direction = 'left' }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-8 w-max"
        animate={{ x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}
