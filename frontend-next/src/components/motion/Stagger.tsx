'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface StaggerProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  delay?: number;
  stagger?: number;
}

export function Stagger({ className, delay = 0, stagger = 0.06, children, ...props }: StaggerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? 'show' : 'show'}
      variants={{
        hidden: {},
        show: {
          transition: reduceMotion ? undefined : { delayChildren: delay, staggerChildren: stagger },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {}

export function StaggerItem({ className, children, ...props }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={
        reduceMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 14, scale: 0.99, filter: 'blur(8px)' },
              show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              opacity: { duration: 0.18, ease: 'easeOut' },
              filter: { duration: 0.22, ease: 'easeOut' },
              y: { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 },
              scale: { type: 'spring', stiffness: 420, damping: 34, mass: 0.85 },
            }
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}

