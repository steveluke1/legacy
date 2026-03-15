import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GradientButton from '@/components/ui/GradientButton';
import { toast } from 'sonner';

export default function AdminAuth() {
  const navigate = useNavigate();
  const { login, register, isAdminAuthenticated } = useAdminAuth();
  
  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Register state
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerErrors, setRegisterErrors] = useState({});

  useEffect(() => {
    if (isAdminAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('from_url');
      navigate(fromUrl || createPageUrl('AdminDashboard'));
    }
  }, [isAdminAuthenticated, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  // Login handlers
  const validateLogin = () => {
    const errors = {};
    
    if (!loginData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = 'Email inválido';
    }

    if (!loginData.password) {
      errors.password = 'Senha é obrigatória';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Debounce protection (2 seconds)
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      console.debug('[AdminAuth] Submit debounced');
      return;
    }
    setLastSubmitTime(now);

    // Cooldown check
    if (cooldownRemaining > 0) {
      toast.error(`Aguarde ${cooldownRemaining} segundos`);
      return;
    }
    
    if (!validateLogin()) return;

    setLoginLoading(true);
    setLoginErrors({});
    
    try {
      if (localStorage.admin_debug === "1") {
        console.debug('[AdminAuth] Login attempt', { email: loginData.email.substring(0, 3) + '***' });
      }
      
      const result = await login(loginData.email, loginData.password);
      
      if (result.success) {
        toast.success('Login administrativo bem-sucedido');
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('from_url');
        navigate(fromUrl || createPageUrl('AdminDashboard'));
      } else {
        // Handle specific error codes with friendly PT-BR messages
        if (result.code === 'RATE_LIMITED' || result.code === 'RATE_LIMIT' || result.status === 429) {
          const retryAfter = result.retryAfterSeconds || 10;
          setCooldownRemaining(retryAfter);
          toast.error(`Aguarde ${retryAfter} segundos para tentar novamente.`);
          setLoginErrors({ form: `Muitas tentativas. Aguarde ${retryAfter} segundos.` });
        } else if (result.status === 401 || result.code === 'INVALID_CREDENTIALS') {
          toast.error('Usuário ou senha inválidos');
          setLoginErrors({ form: 'Usuário ou senha inválidos.' });
        } else if (result.status === 403) {
          toast.error('Acesso negado');
          setLoginErrors({ form: result.error || 'Acesso negado.' });
        } else {
          toast.error(result.error || 'Erro no login');
          setLoginErrors({ form: result.error || 'Erro no login.' });
        }
      }
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.error('[AdminAuth] Login error:', error);
      }
      
      // Network or connection error
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast.error('Falha de conexão. Verifique sua internet.');
        setLoginErrors({ form: 'Falha de conexão. Verifique sua internet e tente novamente.' });
      } else {
        toast.error('Erro ao conectar ao servidor');
        setLoginErrors({ form: 'Erro ao conectar ao servidor. Tente novamente.' });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (loginErrors[name]) {
      setLoginErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Register handlers
  const validateRegister = () => {
    const errors = {};
    
    if (!registerData.username) {
      errors.username = 'Nome de usuário é obrigatório';
    } else if (registerData.username.length < 3) {
      errors.username = 'Mínimo de 3 caracteres';
    } else if (registerData.username.length > 30) {
      errors.username = 'Máximo de 30 caracteres';
    }

    if (!registerData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = 'Email inválido';
    }

    if (!registerData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (registerData.password.length < 8) {
      errors.password = 'Senha deve ter no mínimo 8 caracteres';
    } else if (!/[a-zA-Z]/.test(registerData.password)) {
      errors.password = 'Senha deve conter letras';
    } else if (!/[0-9]/.test(registerData.password)) {
      errors.password = 'Senha deve conter números';
    }

    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'As senhas não conferem';
    }

    if (!registerData.inviteCode) {
      errors.inviteCode = 'Código de convite é obrigatório';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateRegister()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await register(
        registerData.email,
        registerData.username,
        registerData.password,
        registerData.inviteCode
      );
      
      if (result.success) {
        toast.success('Admin criado com sucesso!');
        navigate(createPageUrl('AdminDashboard'));
      } else {
        toast.error(result.error || 'Erro ao criar admin');
        setRegisterErrors({ form: result.error || 'Erro ao criar admin' });
      }
    } catch (error) {
      toast.error('Erro ao criar admin');
      setRegisterErrors({ form: 'Erro ao conectar com o servidor' });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#05070B]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=2574')] bg-cover bg-center opacity-5" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#0C121C] border border-[#FF4B6A]/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF4B6A] to-[#8B0000] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-[#A9B2C7]">Acesso restrito a administradores</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#05070B] mb-6">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF4B6A] data-[state=active]:to-[#8B0000] data-[state=active]:text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#19E0FF] data-[state=active]:to-[#1A9FE8] data-[state=active]:text-[#05070B]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Admin
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              {loginErrors.form && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                  <p className="text-[#FF4B6A] text-sm">{loginErrors.form}</p>
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder="admin@legacyofnevareth.com"
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{loginErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{loginErrors.password}</p>
                  )}
                </div>

                <GradientButton
                  type="submit"
                  variant="danger"
                  className="w-full"
                  disabled={loginLoading || cooldownRemaining > 0}
                  loading={loginLoading}
                >
                  {cooldownRemaining > 0 ? (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Aguarde {cooldownRemaining}s
                    </>
                  ) : loginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Entrar no Admin
                    </>
                  )}
                </GradientButton>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              {registerErrors.form && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                  <p className="text-[#FF4B6A] text-sm">{registerErrors.form}</p>
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Nome de usuário
                  </label>
                  <Input
                    type="text"
                    name="username"
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    placeholder="AdminUser"
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  />
                  {registerErrors.username && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{registerErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder="admin@legacyofnevareth.com"
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  />
                  {registerErrors.email && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{registerErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showRegisterPassword ? 'text' : 'password'}
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      placeholder="••••••••"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerErrors.password && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{registerErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="••••••••"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B2C7] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{registerErrors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                    Código de convite
                  </label>
                  <Input
                    type="text"
                    name="inviteCode"
                    value={registerData.inviteCode}
                    onChange={handleRegisterChange}
                    placeholder="Código fornecido pela equipe"
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  />
                  {registerErrors.inviteCode && (
                    <p className="mt-1 text-[#FF4B6A] text-xs">{registerErrors.inviteCode}</p>
                  )}
                  <p className="mt-2 text-[#A9B2C7] text-xs">
                    Apenas administradores autorizados podem criar contas
                  </p>
                </div>

                <GradientButton
                  type="submit"
                  className="w-full"
                  disabled={registerLoading}
                  loading={registerLoading}
                >
                  {registerLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Criar Admin e Entrar
                    </>
                  )}
                </GradientButton>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#19E0FF]/10 text-center">
            <p className="text-[#A9B2C7] text-sm">
              Não tem acesso administrativo?{' '}
              <button
                onClick={() => navigate(createPageUrl('Home'))}
                className="text-[#19E0FF] hover:underline"
              >
                Voltar ao portal
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}