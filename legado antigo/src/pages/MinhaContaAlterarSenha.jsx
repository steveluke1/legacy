import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import { authClient } from '@/components/auth/authClient';
import RequireAuth from '@/components/auth/RequireAuth';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function MinhaContaAlterarSenha() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get token using authClient (correct key)
      const token = authClient.getToken();
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('auth_change_password', {
        token,
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      if (response.data && response.data.success) {
        toast.success('Senha alterada. Faça login novamente.');
        
        // If require_relogin is true, logout and redirect
        if (response.data.require_relogin) {
          setTimeout(async () => {
            await logout();
            navigate(createPageUrl('Entrar'));
          }, 1500);
        } else {
          navigate(createPageUrl('MinhaConta'));
        }
      } else {
        const errorMsg = response.data?.error || 'Erro ao alterar senha. Tente novamente.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Password change error:', err);
      const errorData = err.response?.data;
      const status = err.response?.status;
      
      if (status === 401) {
        setError(errorData?.error || 'Sessão expirada. Faça login novamente.');
      } else if (status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else if (status === 400) {
        setError(errorData?.error || 'Dados inválidos. Verifique os campos.');
      } else {
        setError(errorData?.error || 'Erro ao alterar senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-md mx-auto">
          <Link 
            to={createPageUrl('MinhaConta')}
            className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Minha Conta
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Alterar senha</h1>
            <p className="text-[#A9B2C7] mb-8">
              Para sua segurança, você precisará fazer login novamente após alterar a senha.
            </p>

            {error && (
              <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-[#FF4B6A] flex-shrink-0" />
                <span className="text-[#FF4B6A] text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Senha atual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="Digite sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#A9B2C7] mt-2">
                  Mínimo 10 caracteres, com maiúscula, minúscula e número ou símbolo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
                    placeholder="Digite a senha novamente"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <GradientButton
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                Alterar senha
              </GradientButton>
            </form>
          </motion.div>
        </div>
      </div>
    </RequireAuth>
  );
}