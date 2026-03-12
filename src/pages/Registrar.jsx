import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, Check, ChevronLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { trackFunnel } from '@/components/analytics/analyticsClient';

export default function Registrar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { register, login } = useAuth();
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
    howFoundUs: null,
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Track signup page view
    trackFunnel('signup_view');
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginId.trim()) {
      newErrors.loginId = 'ID de login é obrigatório';
    } else if (formData.loginId.length < 1) {
      newErrors.loginId = 'ID de login deve ter pelo menos 1 caractere';
    } else if (formData.loginId.length > 32) {
      newErrors.loginId = 'ID de login deve ter no máximo 32 caracteres';
    }

    // Email is optional now
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Informe um e-mail válido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 1) {
      newErrors.password = 'A senha deve ter pelo menos 1 caractere';
    } else if (formData.password.length > 32) {
      newErrors.password = 'A senha deve ter no máximo 32 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não conferem';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você precisa aceitar os termos para continuar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    if (localStorage.admin_debug === "1") {
      console.debug('[Registrar] Submitting:', {
        email: formData.email.substring(0, 3) + '***',
        username: formData.username,
        hasPassword: !!formData.password,
        acceptTerms: formData.acceptTerms,
        howFoundUs: formData.howFoundUs
      });
    }
    
    try {
      const result = await register({
        email: formData.email,
        loginId: formData.loginId.toLowerCase(),
        password: formData.password,
        acceptTerms: formData.acceptTerms,
        howFoundUs: formData.howFoundUs || null
      });
    
      if (result.success) {
        setSuccess(true);
        toast.success('Conta criada com sucesso! Entrando na sua conta…');

        // Track signup completion
        trackFunnel('signup_complete', { loginId: formData.loginId });
        
        // Auto-login by calling auth_login with same credentials
        const loginResult = await login({
          loginId: formData.loginId.toLowerCase(),
          password: formData.password
        });
        
        if (!loginResult.success) {
          // Login failed after registration
          toast.error('Conta criada, mas não foi possível iniciar sessão automaticamente. Faça login para continuar.');
          navigate(createPageUrl('Entrar') + (returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''));
          return;
        }
        
        // Redirect immediately
        const destination = returnTo || createPageUrl('MinhaConta');
        navigate(destination);
      } else {
        if (localStorage.admin_debug === "1") {
          console.error('[Registrar] Registration failed:', result);
        }
        setErrors({ general: result.error || 'Não foi possível criar sua conta. Verifique os dados e tente novamente.' });
        toast.error(result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.error('[Registrar] Registration exception:', error);
      }
      setErrors({ general: error.message || 'Não foi possível criar sua conta. Verifique os dados e tente novamente.' });
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
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
            <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
            <p className="text-[#A9B2C7] mb-8">
              Crie sua conta e comece a jogar
            </p>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-xl text-center"
              >
                <div className="w-16 h-16 bg-[#19E0FF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#19E0FF]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Conta criada com sucesso!</h2>
                <p className="text-[#A9B2C7]">Redirecionando para o login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && (
                  <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                    <span className="text-[#FF4B6A] text-sm">{errors.general}</span>
                  </div>
                )}

                {/* Login ID */}
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    ID de Login
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                    <Input
                      type="text"
                      value={formData.loginId}
                      onChange={(e) => handleChange('loginId', e.target.value)}
                      className={`pl-10 bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 focus:border-[#19E0FF] ${errors.loginId ? 'border-[#FF4B6A]' : ''}`}
                      placeholder="Seu ID de login"
                      maxLength={32}
                    />
                  </div>
                  {errors.loginId && (
                    <p className="text-[#FF4B6A] text-sm mt-1">{errors.loginId}</p>
                  )}
                  <p className="text-[#A9B2C7] text-xs mt-1">Esse ID será o mesmo usado no jogo e no site.</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    E-mail (opcional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`pl-10 bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 focus:border-[#19E0FF] ${errors.email ? 'border-[#FF4B6A]' : ''}`}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[#FF4B6A] text-sm mt-1">{errors.email}</p>
                  )}
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
                      placeholder="Digite sua senha"
                      maxLength={32}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[#FF4B6A] text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 focus:border-[#19E0FF] ${errors.confirmPassword ? 'border-[#FF4B6A]' : ''}`}
                      placeholder="Digite a senha novamente"
                      maxLength={32}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[#FF4B6A] text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* How found us */}
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Como conheceu o Legacy of Nevareth? (Opcional)
                  </label>
                  <Select
                    value={formData.howFoundUs || ''}
                    onValueChange={(value) => handleChange('howFoundUs', value || null)}
                  >
                    <SelectTrigger className="bg-[#0C121C] border-[#19E0FF]/20 text-white">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20 text-white">
                      <SelectItem value="amigo" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">Indicação de amigo</SelectItem>
                      <SelectItem value="youtube" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">YouTube</SelectItem>
                      <SelectItem value="discord" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">Discord</SelectItem>
                      <SelectItem value="google" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">Pesquisa no Google</SelectItem>
                      <SelectItem value="forum" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">Fórum de CABAL</SelectItem>
                      <SelectItem value="outro" className="text-white hover:bg-[#19E0FF]/10 focus:bg-[#19E0FF]/10 cursor-pointer">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleChange('acceptTerms', checked)}
                    className="border-[#19E0FF]/50 data-[state=checked]:bg-[#19E0FF] data-[state=checked]:border-[#19E0FF]"
                  />
                  <label htmlFor="terms" className="text-sm text-[#A9B2C7] cursor-pointer">
                    Aceito os{' '}
                    <Link 
                      to={createPageUrl('TermosDeUso')} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#19E0FF] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      termos de uso
                    </Link>
                    {' '}e a{' '}
                    <Link 
                      to={createPageUrl('PoliticaDePrivacidade')} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#19E0FF] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      política de privacidade
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-[#FF4B6A] text-sm -mt-3">{errors.acceptTerms}</p>
                )}

                <GradientButton
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </GradientButton>
              </form>
            )}

            <p className="text-[#A9B2C7] text-center mt-6">
              Já tem uma conta?{' '}
              <Link to={createPageUrl('Entrar')} className="text-[#19E0FF] hover:underline font-medium">
                Fazer login
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
              Bem-vindo a<br />
              <span className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] bg-clip-text text-transparent">
                Nevareth
              </span>
            </h2>
            <p className="text-[#A9B2C7] text-lg max-w-md">
              Junte-se a milhares de jogadores e viva a melhor experiência de CABAL Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}