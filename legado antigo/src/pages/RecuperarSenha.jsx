import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, Mail, Lock, Key, AlertCircle, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';

export default function RecuperarSenha() {
  const [step, setStep] = useState(1); // 1: email, 2: code + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('auth_requestPasswordReset', { email });
      if (response.data && response.data.success) {
        setStep(2);
        setError('');
      } else {
        // Standardized error message
        setError('Não foi possível concluir agora. Tente novamente em alguns minutos.');
      }
    } catch (err) {
      // Never show raw server errors
      setError('Não foi possível concluir agora. Tente novamente em alguns minutos.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke('auth_confirmPasswordReset', {
        email,
        code,
        new_password: newPassword
      });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        setError('');
      } else {
        // Standardized error - only show safe messages
        const serverError = response.data?.error || '';
        if (serverError.includes('Código inválido') || serverError.includes('expirado')) {
          setError('Código inválido ou expirado. Solicite um novo código.');
        } else if (serverError.includes('senha deve ter')) {
          setError(serverError); // Password validation errors are safe
        } else if (serverError.includes('Muitas tentativas')) {
          setError('Muitas tentativas. Tente novamente em alguns minutos.');
        } else {
          setError('Não foi possível concluir agora. Tente novamente em alguns minutos.');
        }
      }
    } catch (err) {
      // Never show raw server errors
      if (err.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else {
        setError('Não foi possível concluir agora. Tente novamente em alguns minutos.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Senha alterada!</h2>
            <p className="text-[#A9B2C7] mb-6">
              Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
            </p>
            <Link to={createPageUrl('Entrar')}>
              <GradientButton className="w-full">
                Ir para login
              </GradientButton>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link 
          to={createPageUrl('Entrar')}
          className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para login
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Recuperar senha</h1>
          <p className="text-[#A9B2C7] mb-8">
            {step === 1 
              ? 'Digite seu email para receber o código de recuperação'
              : 'Digite o código recebido e sua nova senha'
            }
          </p>

          {error && (
            <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
              <span className="text-[#FF4B6A] text-sm">{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <GradientButton
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Enviar código
              </GradientButton>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="Mínimo 10 caracteres"
                    required
                  />
                </div>
                <p className="text-xs text-[#A9B2C7] mt-2">
                  Mínimo 10 caracteres, com letras maiúsculas, minúsculas e número ou símbolo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="Digite a senha novamente"
                    required
                  />
                </div>
              </div>

              <GradientButton
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Alterar senha
              </GradientButton>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}