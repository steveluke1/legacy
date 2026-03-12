import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function EnqueteFormModal({ enquete, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: [{ text: '' }, { text: '' }],
    status: 'ACTIVE',
    allowMultiple: false
  });

  useEffect(() => {
    if (enquete) {
      setFormData({
        title: enquete.title || '',
        description: enquete.description || '',
        options: enquete.options || [{ text: '' }, { text: '' }],
        status: enquete.status || 'ACTIVE',
        allowMultiple: enquete.allowMultiple || false
      });
    }
  }, [enquete]);

  const handleAddOption = () => {
    if (formData.options.length < 8) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { text: '' }]
      }));
    } else {
      toast.error('Máximo de 8 opções permitido');
    }
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    } else {
      toast.error('Mínimo de 2 opções necessário');
    }
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, text: value } : opt
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Digite o título da enquete');
      return;
    }

    const validOptions = formData.options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Adicione pelo menos 2 opções válidas');
      return;
    }

    onSubmit({
      ...formData,
      options: validOptions.map(opt => ({
        ...opt,
        text: opt.text.trim()
      }))
    });
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
          <h2 className="text-2xl font-bold text-white">
            {enquete ? 'Editar Enquete' : 'Criar Nova Enquete'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#A9B2C7] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
              Título da Enquete *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da enquete..."
              className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
              Descrição (opcional)
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Adicione uma descrição..."
              className="bg-[#05070B] border-[#19E0FF]/20 text-white"
              rows={3}
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#A9B2C7]">
                Opções de Resposta *
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1 text-[#19E0FF] hover:text-white text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Opção
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {formData.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opção ${index + 1}`}
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
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
              Mínimo de 2 opções, máximo de 8 opções
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
              Status
            </label>
            <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
              <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="ACTIVE">Ativa</SelectItem>
                <SelectItem value="CLOSED">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded-lg hover:bg-[#19E0FF]/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : enquete ? 'Salvar Alterações' : 'Criar Enquete'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}