import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Lock, ChevronLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Entrar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || searchParams.get('from_url');
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo || createPageUrl('MinhaConta'));
    }
  }, [isAuthenticated, navigate, returnTo]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginId.trim()) {
      newErrors.loginId = 'ID de login é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      const result = await login({
        loginId: formData.loginId.toLowerCase(),
        password: formData.password
      });
    
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        navigate(returnTo || createPageUrl('MinhaConta'));
      } else {
        // Handle specific error cases based on error_code
        const errorMsg = result.error || 'Credenciais inválidas';
        const errorCode = result.error_code;
        
        if (errorCode === 'INVALID_CREDENTIALS') {
          setErrors({ general: 'ID ou senha inválidos.' });
          toast.error('ID ou senha inválidos.');
        } else if (errorCode === 'TOO_MANY_ATTEMPTS') {
          setErrors({ general: 'Muitas tentativas. Tente novamente mais tarde.' });
          toast.error('Muitas tentativas. Tente novamente mais tarde.');
        } else if (errorCode === 'BRIDGE_UNAVAILABLE') {
          setErrors({ general: 'Serviço de login indisponível no momento. Tente novamente.' });
          toast.error('Serviço de login indisponível no momento. Tente novamente.');
        } else if (errorCode === 'BRIDGE_RESPONSE_INVALID') {
          setErrors({ general: 'Erro ao validar login. Contate o suporte.' });
          toast.error('Erro ao validar login. Contate o suporte.');
        } else {
          // Fallback for unknown errors
          setErrors({ general: errorMsg });
          toast.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = error.message || 'Erro ao conectar ao servidor';
      
      if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('fetch')) {
        setErrors({ general: 'Falha de conexão. Tente novamente.' });
        toast.error('Falha de conexão. Tente novamente.');
      } else {
        setErrors({ general: errorMsg });
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: null }));
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast.info('Recuperação de senha em breve. Fale com o suporte se necessário.');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full mx-auto">
          {/* Back link */}
          <Link 
            to={createPageUrl('Home')}
            className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-lg flex items-center justify-center">
              <span className="text-[#05070B] font-black text-xl">L</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-wider">Legacy of</span>
              <span className="text-[#19E0FF] text-xs font-semibold tracking-wide -mt-0.5">Nevareth</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Entrar</h1>
            <p className="text-[#A9B2C7] mb-8">
              Use suas credenciais do jogo para acessar o portal
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.general && (
                <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                    <span className="text-[#FF4B6A] text-sm">{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Login ID */}
              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type="text"
                    value={formData.loginId}
                    onChange={(e) => handleChange('loginId', e.target.value)}
                    className={`pl-10 bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 focus:border-[#19E0FF] ${errors.loginId ? 'border-[#FF4B6A]' : ''}`}
                    placeholder="Seu ID de login"
                    disabled={loading}
                    maxLength={32}
                  />
                </div>
                {errors.loginId && (
                  <p className="text-[#FF4B6A] text-sm mt-1">{errors.loginId}</p>
                )}
                <p className="text-[#A9B2C7]/60 text-xs mt-1.5">
                  Use o mesmo ID e senha do jogo.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`pl-10 pr-10 bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 focus:border-[#19E0FF] ${errors.password ? 'border-[#FF4B6A]' : ''}`}
                    placeholder="Sua senha"
                    disabled={loading}
                    maxLength={32}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#FF4B6A] text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Forgot password link */}
              <div className="text-right">
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#19E0FF] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <GradientButton
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </GradientButton>
            </form>

            <p className="text-[#A9B2C7] text-center mt-6">
              Não tem uma conta?{' '}
              <Link to={createPageUrl('Registrar')} className="text-[#19E0FF] hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C121C] to-[#05070B]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #19E0FF 1px, transparent 1px),
              linear-gradient(to bottom, #19E0FF 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Glowing orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#19E0FF] rounded-full blur-[150px] opacity-30"
        />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-4">
              Bem-vindo de volta a<br />
              <span className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] bg-clip-text text-transparent">
                Nevareth
              </span>
            </h2>
            <p className="text-[#A9B2C7] text-lg max-w-md">
              Entre na sua conta e continue sua jornada épica no melhor servidor de CABAL Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}