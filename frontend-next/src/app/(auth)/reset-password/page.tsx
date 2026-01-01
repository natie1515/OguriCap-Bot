'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/motion/Reveal';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token.trim();
    if (!t) {
      toast.error('Token inválido');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== password2) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await api.confirmPasswordReset(t, password);
      toast.success('Contraseña actualizada. Iniciá sesión.');
      router.replace('/login');
    } catch (error: any) {
      const msg = error?.response?.data?.error || error?.message || 'No se pudo restablecer la contraseña';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={reduceMotion ? { opacity: 1 } : { x: [0, 100, 0], y: [0, -50, 0] }}
          transition={reduceMotion ? { duration: 0.12 } : { repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={reduceMotion ? { opacity: 1 } : { x: [0, -100, 0], y: [0, 50, 0] }}
          transition={reduceMotion ? { duration: 0.12 } : { repeat: Infinity, duration: 25, ease: 'linear' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <Reveal className="glass-card p-8">
          <PageHeader
            title="Restablecer contraseña"
            description="Elegí una contraseña nueva"
            icon={<Bot className="w-5 h-5 text-primary-400" />}
            actions={
              <Link
                href="/login"
                className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Link>
            }
            className="mb-8"
          />

          <form onSubmit={handleReset}>
            <Stagger className="space-y-5" delay={0.02} stagger={0.06}>
              <StaggerItem>
              <label className="block text-sm font-medium text-gray-400 mb-2">Nueva contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="••••••••"
                />
              </div>
              </StaggerItem>

              <StaggerItem>
              <label className="block text-sm font-medium text-gray-400 mb-2">Repetir contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  type="password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="••••••••"
                />
              </div>
              </StaggerItem>

              <StaggerItem>
                <Button type="submit" variant="primary" className="w-full" loading={isLoading} disabled={isLoading}>
                  Cambiar contraseña
                </Button>
              </StaggerItem>
            </Stagger>
          </form>
        </Reveal>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen mesh-bg" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
