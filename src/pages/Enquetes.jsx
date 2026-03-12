import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Plus } from 'lucide-react';
import RequireAuth from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import SectionTitle from '@/components/ui/SectionTitle';
import EnqueteCard from '@/components/enquetes/EnqueteCard';
import CreateEnqueteModal from '@/components/enquetes/CreateEnqueteModal';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data das enquetes
const MOCK_ENQUETES = [
  {
    id: 'enq_001',
    pergunta: 'Qual deve ser o próximo evento do servidor?',
    opcoes: [
      { id: 'opt_001', texto: 'Bingo', votos: 128 },
      { id: 'opt_002', texto: 'Natal', votos: 342 },
      { id: 'opt_003', texto: 'Páscoa', votos: 96 }
    ],
    is_active: true,
    created_at: '2025-12-10T10:00:00Z'
  },
  {
    id: 'enq_002',
    pergunta: 'Qual DG deve ser liberada primeiro?',
    opcoes: [
      { id: 'opt_004', texto: 'Drag 3SS', votos: 214 },
      { id: 'opt_005', texto: 'T3', votos: 187 },
      { id: 'opt_006', texto: 'Ilha da Miragem', votos: 401 }
    ],
    is_active: true,
    created_at: '2025-12-11T14:30:00Z'
  },
  {
    id: 'enq_003',
    pergunta: 'Qual modelo de TG você prefere?',
    opcoes: [
      { id: 'opt_007', texto: 'TG focada em player', votos: 356 },
      { id: 'opt_008', texto: 'TG focada em mob', votos: 142 },
      { id: 'opt_009', texto: 'TG mista', votos: 289 }
    ],
    is_active: true,
    created_at: '2025-12-09T16:00:00Z'
  }
];

export default function Enquetes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enquetes, setEnquetes] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simular votos do usuário (em produção viria do backend)
      const mockUserVotes = {
        'enq_001': 'opt_002' // Usuário votou em "Natal"
      };
      setUserVotes(mockUserVotes);
      
      // Carregar enquetes (mock data por enquanto)
      await new Promise(resolve => setTimeout(resolve, 500));
      setEnquetes(MOCK_ENQUETES);
    } catch (e) {
      console.error('Erro ao carregar enquetes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (enqueteId, opcaoId) => {
    if (!user) return;
    
    // Atualização otimista
    setUserVotes(prev => ({ ...prev, [enqueteId]: opcaoId }));
    
    // Atualizar contagem de votos
    setEnquetes(prev => prev.map(enq => {
      if (enq.id === enqueteId) {
        return {
          ...enq,
          opcoes: enq.opcoes.map(opt => 
            opt.id === opcaoId ? { ...opt, votos: opt.votos + 1 } : opt
          )
        };
      }
      return enq;
    }));

    // Em produção: await base44.functions.invoke('enquete_vote', { enqueteId, opcaoId })
  };

  const handleCreateEnquete = (newEnquete) => {
    const enqueteWithId = {
      ...newEnquete,
      id: `enq_${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    setEnquetes(prev => [enqueteWithId, ...prev]);
    setShowCreateModal(false);
  };

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#05070B]" />
              </div>
              <div>
                <SectionTitle 
                  title="Enquetes da Comunidade"
                  subtitle="Vote e ajude a decidir os próximos passos do CABAL ZIRON"
                  centered={false}
                  className="mb-0"
                />
              </div>
            </div>
            
            {/* Admin button */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Criar Nova Enquete
              </button>
            )}
          </div>
        </motion.div>

        {/* Enquetes List */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full bg-[#19E0FF]/10 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {enquetes.map((enquete, index) => (
              <EnqueteCard
                key={enquete.id}
                enquete={enquete}
                user={user}
                userVote={userVotes[enquete.id]}
                onVote={handleVote}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && enquetes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <BarChart3 className="w-20 h-20 text-[#A9B2C7]/30 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Nenhuma enquete ativa no momento
            </h3>
            <p className="text-[#A9B2C7]">
              Volte em breve para participar das próximas votações!
            </p>
          </motion.div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <CreateEnqueteModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateEnquete}
          />
        )}
      </div>
    </div>
    </RequireAuth>
  );
}