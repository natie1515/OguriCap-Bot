import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useBotStatus, useConnectionHealth } from '@/hooks/useRealTime';
import { RealTimeBadge } from '@/components/ui/StatusIndicator';
import { FloatingSupportButton } from '@/components/ui/FloatingSupportButton';
import { RouteProgressBar } from '@/components/motion/RouteProgressBar';
import { cn } from '@/lib/utils';
import { getPageKeyFromPathname } from '@/lib/pageTheme';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useBotStatus(5000);
  const { latency } = useConnectionHealth();
  const reduceMotion = useReducedMotion();
  const pageKey = getPageKeyFromPathname(pathname);

  const stagedChildren = React.useMemo(() => {
    if (!children) return children;
    if (React.isValidElement(children) && children.type !== React.Fragment) {
      const existing = (children.props as any)?.className;
      return React.cloneElement(children as any, { className: cn('stagger-children', existing) });
    }
    return <div className="stagger-children">{children}</div>;
  }, [children]);

  return (
    <div className="h-screen overflow-hidden mesh-bg" data-page={pageKey}>
      <RouteProgressBar />
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            'absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl',
            !reduceMotion && 'animate-blob'
          )}
        />
        <div
          className={cn(
            'absolute top-3/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl',
            !reduceMotion && 'animate-blob animation-delay-2000'
          )}
        />
        <div
          className={cn(
            'absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl',
            !reduceMotion && 'animate-blob animation-delay-4000'
          )}
        />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-72 h-screen flex flex-col relative z-10 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              className="relative"
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985, rotateX: -3, filter: 'blur(10px)' }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, scale: 0.985, rotateX: 2, filter: 'blur(10px)' }}
              transition={
                reduceMotion
                  ? { duration: 0.12 }
                  : {
                      opacity: { duration: 0.35, ease: 'easeOut' },
                      y: { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 },
                      scale: { type: 'spring', stiffness: 320, damping: 30, mass: 0.9 },
                      filter: { duration: 0.5, ease: 'easeOut' },
                    }
              }
              style={{ transformPerspective: 1000 }}
            >
              <motion.div
                aria-hidden="true"
                className="page-transition-overlay"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                animate={reduceMotion ? { opacity: 0 } : { opacity: [0, 1, 0], scale: [0.98, 1.04, 1] }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
              {stagedChildren}
            </motion.div>
          </AnimatePresence>
        </main>

        <FloatingSupportButton />

        {/* Footer */}
        <footer className="px-4 lg:px-6 py-4 border-t border-white/10 glass-dark">
          <div className="flex items-center justify-between gap-4 text-sm text-gray-400">
            <span>© 2025 Oguri Bot Panel</span>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-xs font-mono text-gray-500">v1.0.0</span>
              <RealTimeBadge isActive={isConnected} latency={latency} />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
