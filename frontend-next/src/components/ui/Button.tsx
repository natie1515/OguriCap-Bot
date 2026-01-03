'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'btn-sheen relative overflow-hidden press-scale focus-ring-animated inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        success: 'btn-glow',
        glow: 'btn-glow',
        ghost: [
          'px-4 py-2',
          'text-gray-400 hover:text-white hover:bg-white/5',
          '[html.light_&]:text-gray-600 [html.light_&]:hover:text-gray-900 [html.light_&]:hover:bg-gray-100/50',
        ],
      },
      size: {
        default: '',
        sm: '!px-4 !py-2 text-xs',
        lg: '!px-8 !py-4',
        icon: '!p-2.5 h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, icon, children, disabled, ...props }, ref) => {
    const reduceMotion = useReducedMotion();
    const isDisabled = !!disabled || !!loading;
    return (
      <motion.button
        whileHover={reduceMotion ? undefined : { scale: disabled || loading ? 1 : 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: disabled || loading ? 1 : 0.98 }}
        className={cn(
          buttonVariants({ variant, size }),
          isDisabled && 'is-disabled',
          loading && 'is-loading',
          className
        )}
        ref={ref as any}
        disabled={isDisabled}
        {...(props as any)}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
