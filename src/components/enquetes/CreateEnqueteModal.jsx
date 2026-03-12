import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import MetalButton from '@/components/ui/MetalButton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CreateEnqueteModal({ onClose, onCreate }) {
  const [pergunta, setPergunta] = useState('');
  const [opcoes, setOpcoes] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const handleAddOpcao = () => {
    if (opcoes.length < 6) {
      setOpcoes([...opcoes, '']);
    } else {
      toast.error('Máximo de 6 opções permitido');
    }
  };

  const handleRemoveOpcao = (index) => {
    if (opcoes.length > 2) {
      setOpcoes(opcoes.filter((_, i) => i !== index));
    } else {
      toast.error('Mínimo de 2 opções necessário');
    }
  };

  const handleOpcaoChange = (index, value) => {
    const newOpcoes = [...opcoes];
    newOpcoes[index] = value;
    setOpcoes(newOpcoes);
  };

  const handleCreate = async () => {
    // Validação
    if (!pergunta.trim()) {
      toast.error('Digite a pergunta da enquete');
      return;
    }

    const validOpcoes = opcoes.filter(opt => opt.trim() !== '');
    if (validOpcoes.length < 2) {
      toast.error('Adicione pelo menos 2 opções válidas');
      return;
    }

    setCreating(true);

    // Criar enquete
    const newEnquete = {
      pergunta: pergunta.trim(),
      opcoes: validOpcoes.map((texto, index) => ({
        id: `opt_${Date.now()}_${index}`,
        texto: texto.trim(),
        votos: 0
      }))
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    
    onCreate(newEnquete);
    toast.success('Enquete criada com sucesso!');
    setCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.95)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0C121C] border border-[#19E0FF]/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Criar Nova Enquete</h2>
          <button
            onClick={onClose}
            className="text-[#A9B2C7] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pergunta */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
            Pergunta da Enquete
          </label>
          <Input
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Digite a pergunta da enquete..."
            className="bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
          />
        </div>

        {/* Opções */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-[#A9B2C7]">
              Opções de Resposta
            </label>
            <button
              onClick={handleAddOpcao}
              className="flex items-center gap-1 text-[#19E0FF] hover:text-white text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Opção
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {opcoes.map((opcao, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={opcao}
                    onChange={(e) => handleOpcaoChange(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
                  />
                  {opcoes.length > 2 && (
                    <button
                      onClick={() => handleRemoveOpcao(index)}
                      className="text-[#FF4B6A] hover:text-[#FF6B8A] transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <p className="text-xs text-[#A9B2C7] mt-2">
            Mínimo de 2 opções, máximo de 6 opções
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <MetalButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancelar
          </MetalButton>
          <MetalButton
            onClick={handleCreate}
            loading={creating}
            disabled={creating}
            variant="primary"
            className="flex-1"
          >
            {creating ? 'Criando...' : 'Criar Enquete'}
          </MetalButton>
        </div>
      </motion.div>
    </motion.div>
  );
}