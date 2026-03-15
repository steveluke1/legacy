import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, User, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '@/components/notifications/NotificationBell';

const navLinks = [
  { name: 'Início', path: 'Home' },
  { name: 'Ranking', path: 'Ranking' },
  { name: 'Enquete', path: 'Enquetes' },
  { name: 'Loja', path: 'Loja', icon: ShoppingCart, color: '#F7CE46' },
  { name: 'Guildas', path: 'Guildas' },
  { name: 'TG ao Vivo', path: 'TGAoVivo' },
  { name: 'Mercado', path: 'Mercado' },
  { name: 'Suporte', path: 'Suporte' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05070B]/95 backdrop-blur-md border-b border-[#19E0FF]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-lg flex items-center justify-center">
                <span className="text-[#05070B] font-black text-lg">L</span>
              </div>
              <div className="absolute inset-0 bg-[#19E0FF]/30 rounded-lg blur-md -z-10"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm tracking-wider">Legacy of</span>
              <span className="text-[#19E0FF] text-xs font-semibold tracking-wide -mt-0.5">Nevareth</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={createPageUrl(link.path)}
                  className="px-3 py-2 text-sm text-[#A9B2C7] hover:text-white transition-colors relative group flex items-center gap-1.5"
                  style={link.color ? { color: link.color } : {}}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] group-hover:w-full transition-all duration-300"></span>
                </Link>
              );
            })}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoading ? (
              <div className="w-24 h-9 bg-[#0C121C] rounded-lg animate-pulse"></div>
            ) : user ? (
              <>
                <NotificationBell />
                <button
                  onClick={() => navigate(createPageUrl('MinhaConta'))}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg text-white hover:border-[#19E0FF]/50 transition-colors"
                  aria-label="Ir para Minha Conta"
                >
                  <User className="w-4 h-4 text-[#19E0FF]" />
                  <span className="text-sm">{user.username || user.full_name}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={createPageUrl('Entrar')}
                  className="px-4 py-2 text-sm border border-[#19E0FF]/30 text-[#19E0FF] hover:bg-[#19E0FF]/10 rounded-lg font-medium transition-all"
                >
                  Entrar
                </Link>
                <Link
                  to={createPageUrl('Registrar')}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#19E0FF]/20 transition-all"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-[#A9B2C7] hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0C121C] border-t border-[#19E0FF]/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={createPageUrl(link.path)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[#A9B2C7] hover:text-white hover:bg-[#19E0FF]/10 rounded-lg transition-colors"
                    style={link.color ? { color: link.color } : {}}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-[#19E0FF]/10 space-y-2">
                {user ? (
                  <>
                    <Link
                      to={createPageUrl('MinhaConta')}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-[#19E0FF] hover:bg-[#19E0FF]/10 rounded-lg transition-colors"
                    >
                      Minha Conta
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to={createPageUrl('Entrar')}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-[#A9B2C7] hover:text-white hover:bg-[#19E0FF]/10 rounded-lg transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      to={createPageUrl('Registrar')}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-semibold rounded-lg text-center"
                    >
                      Criar Conta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}