'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { LoadingOverlayProvider } from '@/contexts/LoadingOverlayContext';
import { NotificationEffectsListener } from '@/components/effects/NotificationEffectsListener';
import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getPageKeyFromPathname } from '@/lib/pageTheme';

function PageThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    const page = getPageKeyFromPathname(pathname);
    document.documentElement.dataset.page = page;
    document.body.dataset.page = page;
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: true,
        staleTime: 5000,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <PageThemeSync />
        <MotionConfig
          reducedMotion="user"
          transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
        >
          <AuthProvider>
            <SocketProvider>
              <PreferencesProvider>
                <LoadingOverlayProvider>
                  <NotificationEffectsListener />
                  {children}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      className: 'toast-custom',
                      success: { className: 'toast-custom toast-success' },
                      error: { className: 'toast-custom toast-error' },
                    }}
                  />
                </LoadingOverlayProvider>
              </PreferencesProvider>
            </SocketProvider>
          </AuthProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
