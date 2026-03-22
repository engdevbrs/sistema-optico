import type { CSSProperties } from 'react'
import { useInView } from '../../hooks/useInView'

interface AnimatedSectionProps {
  children: React.ReactNode
  animation?: 'fade-up' | 'slide-left' | 'slide-right' | 'scale' | 'stagger'
  className?: string
  delay?: number
  style?: CSSProperties
}

export function AnimatedSection({ children, animation = 'fade-up', className = '', delay, style }: AnimatedSectionProps) {
  const { ref, inView } = useInView(0.15)

  const animClass = {
    'fade-up': 'in-view-fade-up',
    'slide-left': 'in-view-slide-left',
    'slide-right': 'in-view-slide-right',
    'scale': 'in-view-scale',
    'stagger': 'stagger-children',
  }[animation]

  return (
    <div
      ref={ref}
      className={`${animClass} ${inView ? 'visible' : ''} ${className}`}
      style={{ ...(delay ? { transitionDelay: `${delay}s` } : {}), ...style }}
    >
      {children}
    </div>
  )
}
