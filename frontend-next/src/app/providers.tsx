'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { NotificationEffectsListener } from '@/components/effects/NotificationEffectsListener';
import { useState } from 'react';
import { MotionConfig } from 'framer-motion';

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
        <MotionConfig
          reducedMotion="user"
          transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
        >
          <AuthProvider>
            <SocketProvider>
              <PreferencesProvider>
                <NotificationEffectsListener />
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(30, 41, 59, 0.95)',
                      color: '#fff',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    },
                    success: {
                      iconTheme: { primary: '#10b981', secondary: '#fff' },
                    },
                    error: {
                      iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    },
                  }}
                />
              </PreferencesProvider>
            </SocketProvider>
          </AuthProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
