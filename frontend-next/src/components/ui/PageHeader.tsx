'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <motion.div
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner-glow"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85, rotate: -8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
            transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
          >
            {icon}
          </motion.div>
        )}
        <div className="min-w-0">
          <motion.h1
            className="text-3xl font-bold text-white tracking-tight"
            initial={reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={reduceMotion ? { duration: 0.12 } : { duration: 0.22, ease: 'easeOut' }}
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              className="text-gray-400 mt-1"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0.12 } : { duration: 0.22, ease: 'easeOut', delay: 0.04 }}
            >
              {description}
            </motion.p>
          )}

          <motion.div
            className="mt-3 h-[2px] w-24 rounded-full bg-gradient-to-r from-primary-500 via-cyan-400 to-emerald-400"
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
            transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
            style={{ transformOrigin: '0% 50%' }}
          />
        </div>
      </div>

      {actions && (
        <motion.div
          className="flex items-center gap-3"
          initial={reduceMotion ? false : { opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={reduceMotion ? { duration: 0.12 } : { duration: 0.22, ease: 'easeOut', delay: 0.06 }}
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}

