import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { User, Lock, ChevronRight, Mail, ShoppingBag, ArrowLeftRight, Wallet, Gift, Package } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';

export default function MinhaConta() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Caixas de Insígnias',
      description: 'Abra suas caixas e colete insígnias exclusivas',
      icon: Gift,
      link: createPageUrl('MinhaContaCaixasInsignias'),
      color: '#9146FF'
    },
    {
      title: 'Minhas Insígnias',
      description: 'Veja sua coleção e equipe suas insígnias',
      icon: Gift,
      link: createPageUrl('MinhaContaInsignias'),
      color: '#F7CE46'
    },
    {
      title: 'Minhas Ofertas',
      description: 'Acompanhe suas ofertas de venda no Mercado',
      icon: Package,
      link: createPageUrl('MercadoMinhasOfertas'),
      color: '#19E0FF'
    },
    {
      title: 'Minhas Compras',
      description: 'Veja suas compras e o status no Mercado',
      icon: ShoppingBag,
      link: createPageUrl('MercadoMinhasCompras'),
      color: '#1A9FE8'
    },
    {
      title: 'Doação',
      description: 'Doe e receba CASH para usar no jogo',
      icon: Mail,
      link: createPageUrl('MinhaContaDoacao'),
      color: '#F7CE46'
    },
    {
      title: 'Transferências',
      description: 'Envie e receba transferências entre contas',
      icon: ArrowLeftRight,
      link: createPageUrl('MinhaContaTransferencias'),
      color: '#1A9FE8'
    },
    {
      title: 'Carteira CASH',
      description: 'Saldo e histórico de transações',
      icon: Wallet,
      link: createPageUrl('MinhaContaCarteira'),
      color: '#F7CE46'
    },
    {
      title: 'Alterar senha',
      description: 'Proteja sua conta com uma senha forte',
      icon: Lock,
      link: createPageUrl('MinhaContaAlterarSenha'),
      color: '#F7CE46'
    }
  ];

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionTitle 
          title="Minha Conta"
          subtitle="Gerencie suas informações e configurações de segurança"
          centered={false}
        />

        {/* User info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-[#05070B]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                <div className="flex items-center gap-2 text-[#A9B2C7]">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Menu items */}
        <div className="grid md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={item.link}>
                <GlowCard className="p-6 group cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <item.icon className="w-6 h-6" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#19E0FF] transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[#A9B2C7] text-sm">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#A9B2C7] group-hover:text-white transition-colors" />
                  </div>
                </GlowCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Logout button */}
        <div className="mt-8">
          <GradientButton 
            variant="danger" 
            onClick={logout}
            className="w-full md:w-auto"
          >
            Sair da conta
          </GradientButton>
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}