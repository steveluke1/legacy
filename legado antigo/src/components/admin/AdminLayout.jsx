import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { Shield, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate(createPageUrl('AdminAuth'));
  };

  return (
    <div className="min-h-screen bg-[#05070B]">
      {/* Admin Header */}
      <div className="bg-[#0C121C] border-b border-[#FF4B6A]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4B6A] to-[#8B0000] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">CABAL ZIRON Admin</h1>
              <p className="text-[#A9B2C7] text-xs">Logado como: {admin?.username || admin?.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#05070B] border border-[#FF4B6A]/30 text-[#FF4B6A] rounded-lg hover:bg-[#FF4B6A]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}