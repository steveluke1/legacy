import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';

export default function EnqueteCard({ enquete, user, userVote, onVote, delay = 0 }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(userVote || null);
  const [voting, setVoting] = useState(false);

  const hasVoted = !!userVote;
  const canVote = user && !hasVoted;
  const showResults = hasVoted || !user;

  const totalVotes = enquete.opcoes.reduce((sum, opt) => sum + opt.votos, 0);
  const leadingOption = enquete.opcoes.reduce((max, opt) => 
    opt.votos > max.votos ? opt : max
  , enquete.opcoes[0]);

  const handleVoteSubmit = async () => {
    if (!selectedOption || voting) return;
    
    setVoting(true);
    await onVote(enquete.id, selectedOption);
    
    setTimeout(() => {
      setVoting(false);
    }, 500);
  };

  const getPercentage = (votos) => {
    if (totalVotes === 0) return 0;
    return Math.round((votos / totalVotes) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlowCard className="p-6" glowColor="#19E0FF">
        {/* Question */}
        <h3 className="text-xl font-bold text-white mb-6">
          {enquete.pergunta}
        </h3>

        {/* Voting Interface (if can vote) */}
        {canVote && !showResults && (
          <div className="space-y-3 mb-6">
            {enquete.opcoes.map((opcao) => (
              <button
                key={opcao.id}
                onClick={() => setSelectedOption(opcao.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                  selectedOption === opcao.id
                    ? 'border-[#19E0FF] bg-[#19E0FF]/10'
                    : 'border-[#19E0FF]/20 hover:border-[#19E0FF]/40 bg-[#0C121C]'
                }`}
              >
                <span className="text-white font-medium">{opcao.texto}</span>
                {selectedOption === opcao.id && (
                  <CheckCircle2 className="w-5 h-5 text-[#19E0FF]" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Results (if voted or not logged) */}
        {showResults && (
          <div className="space-y-4 mb-6">
            {enquete.opcoes.map((opcao, index) => {
              const percentage = getPercentage(opcao.votos);
              const isLeading = opcao.id === leadingOption.id;
              const isUserVote = opcao.id === userVote;

              return (
                <motion.div
                  key={opcao.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isUserVote ? 'text-[#19E0FF]' : 'text-white'
                      }`}>
                        {opcao.texto}
                      </span>
                      {isUserVote && (
                        <CheckCircle2 className="w-4 h-4 text-[#19E0FF]" />
                      )}
                      {isLeading && (
                        <TrendingUp className="w-4 h-4 text-[#F7CE46]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#19E0FF] font-bold text-sm">
                        {percentage}%
                      </span>
                      <span className="text-[#A9B2C7] text-xs">
                        ({opcao.votos} votos)
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-[#0C121C] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        isLeading 
                          ? 'bg-gradient-to-r from-[#F7CE46] to-[#FFD700]'
                          : 'bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#19E0FF]/10">
          <div className="text-sm text-[#A9B2C7]">
            Total de votos: <span className="text-white font-bold">{totalVotes}</span>
          </div>

          {/* Action based on state */}
          {!user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[#A9B2C7] text-sm">
                <Lock className="w-4 h-4" />
                Faça login para votar
              </div>
              <MetalButton
                onClick={() => navigate(createPageUrl('Login') + '?from_url=/enquetes')}
                size="sm"
                variant="primary"
              >
                Entrar
              </MetalButton>
            </div>
          ) : hasVoted ? (
            <div className="flex items-center gap-2 text-[#19E0FF] text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Você já votou nesta enquete
            </div>
          ) : (
            <MetalButton
              onClick={handleVoteSubmit}
              disabled={!selectedOption || voting}
              loading={voting}
              size="sm"
              variant="primary"
            >
              {voting ? 'Votando...' : 'Votar'}
            </MetalButton>
          )}
        </div>
      </GlowCard>
    </motion.div>
  );
}