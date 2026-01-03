'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/services/api';
import { Button } from './ui/Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ident = identifier.trim();
    if (!ident) {
      toast.error('Ingresa tu email o tu usuario');
      return;
    }

    setIsLoading(true);
    try {
      await api.requestPasswordResetEmail(ident);
      setStep('success');
      toast.success('Si la cuenta existe, te enviamos un email con el link');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setIdentifier('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-content max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {step === 'form' ? 'Recuperar Contraseña' : 'Listo'}
              </h2>
              <button onClick={handleClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {step === 'form' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <p className="text-gray-400 mb-6 text-sm">
                  Ingresá tu email o tu usuario. Te enviaremos un link para restablecer tu contraseña.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email o usuario</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="tu@email.com o usuario"
                        className="input-glass pl-12"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Si tu cuenta no tiene email, pedí al admin que lo agregue.</p>
                  </div>

                  <Button type="submit" variant="primary" className="w-full mt-6" loading={isLoading} disabled={isLoading}>
                    Enviar link por email
                  </Button>
                </form>

                <button onClick={handleClose} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mt-4 mx-auto">
                  <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Revisá tu email</h3>
                <p className="text-gray-400 mb-6 text-sm">
                  Si el usuario existe y tiene email, te enviamos un link para restablecer la contraseña.
                </p>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-amber-400 font-medium mb-1">Importante:</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li>• Revisá spam/promociones si no llega</li>
                        <li>• El link vence en ~30 minutos</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button onClick={handleClose} variant="primary" className="w-full">Continuar al Login</Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForgotPasswordModal;
