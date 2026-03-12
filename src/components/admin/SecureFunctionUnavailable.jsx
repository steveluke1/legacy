import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';

export default function SecureFunctionUnavailable({ onGoToRBAC }) {
  return (
    <GlowCard className="p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#F7CE46]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-[#F7CE46]" />
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">
          Segurança Ativa
        </h3>
        
        <p className="text-[#A9B2C7] max-w-md mx-auto mb-6">
          Esta aba depende de permissões (RBAC) e endpoints seguros. 
          Configure RBAC no Base44 e/ou publique as funções para produção.
        </p>

        <div className="flex justify-center gap-4">
          <Button
            onClick={onGoToRBAC}
            className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-white font-bold"
          >
            Ver Guia RBAC
          </Button>
        </div>

        <div className="mt-6 p-4 bg-[#F7CE46]/10 rounded-lg border border-[#F7CE46]/20">
          <div className="flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-[#F7CE46] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#A9B2C7]">
              <p className="font-bold text-white mb-1">Por que estou vendo isso?</p>
              <p>
                Esta página tenta acessar dados sensíveis (logs de auditoria, ledgers, etc). 
                Por segurança, o acesso direto do navegador está bloqueado até que você configure 
                permissões no Dashboard Base44.
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlowCard>
  );
}