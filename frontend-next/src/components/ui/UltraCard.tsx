'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type UltraCardTone = 'auto' | 'brand' | 'success' | 'warning' | 'danger' | 'terminal';

export interface UltraCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  tone?: UltraCardTone;
  interactive?: boolean;
  glow?: boolean;
  elevated?: boolean;
}

export const UltraCard = React.forwardRef<HTMLDivElement, UltraCardProps>(
  (
    {
      className,
      tone = 'auto',
      interactive = true,
      glow = true,
      elevated = true,
      children,
      ...props
    },
    ref
  ) => {
    const reduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        className={cn(
          'ultra-card',
          tone !== 'auto' && `ultra-card--${tone}`,
          glow && 'ultra-card--glow',
          elevated && 'ultra-card--elevated',
          interactive && 'ultra-card--interactive',
          className
        )}
        initial={
          reduceMotion
            ? false
            : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(10px) saturate(120%)' }
        }
        whileInView={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px) saturate(100%)' }
        }
        viewport={{ once: true, amount: 0.2 }}
        transition={
          reduceMotion
            ? { duration: 0.12 }
            : { type: 'spring', stiffness: 420, damping: 30, mass: 0.9 }
        }
        whileHover={
          reduceMotion || !interactive
            ? undefined
            : { y: -6, scale: 1.01, rotateX: 1.2, rotateY: -1.2 }
        }
        whileTap={reduceMotion || !interactive ? undefined : { scale: 0.985 }}
        style={{ transformStyle: 'preserve-3d' }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

UltraCard.displayName = 'UltraCard';

