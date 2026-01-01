'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  delay?: number;
  once?: boolean;
}

export function Reveal({ className, delay = 0, once = true, children, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985, filter: 'blur(10px)' }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={reduceMotion ? undefined : { once, amount: 0.25 }}
      transition={
        reduceMotion
          ? { duration: 0.12 }
          : {
              opacity: { duration: 0.2, ease: 'easeOut' },
              filter: { duration: 0.25, ease: 'easeOut' },
              y: { type: 'spring', stiffness: 380, damping: 34, mass: 0.9, delay },
              scale: { type: 'spring', stiffness: 380, damping: 34, mass: 0.9, delay },
            }
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}

