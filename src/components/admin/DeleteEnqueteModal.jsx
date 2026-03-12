import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

export default function DeleteEnqueteModal({ enquete, onClose, onConfirm, loading }) {
  const [hardDelete, setHardDelete] = useState(false);

  const handleConfirm = () => {
    onConfirm(hardDelete);
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
        className="bg-[#0C121C] border border-[#FF4B6A]/30 rounded-2xl p-8 max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#FF4B6A]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
              <p className="text-[#A9B2C7] text-sm">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A9B2C7] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-white mb-4">
            Tem certeza que deseja remover a enquete "{enquete.title}"?
          </p>

          <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-4 mb-4">
            <p className="text-[#A9B2C7] text-sm mb-2">
              <strong className="text-white">Encerramento suave (recomendado):</strong>
            </p>
            <p className="text-[#A9B2C7] text-sm">
              A enquete será marcada como "Encerrada" e não aparecerá mais para usuários, mas os dados serão preservados.
            </p>
          </div>

          <label className="flex items-start gap-3 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={hardDelete}
              onChange={(e) => setHardDelete(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="text-[#FF4B6A] font-bold text-sm mb-1">
                Excluir permanentemente
              </p>
              <p className="text-[#A9B2C7] text-xs">
                Remove completamente do banco de dados. Use apenas se necessário.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded-lg hover:bg-[#19E0FF]/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF4B6A] to-[#FF6B8A] text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Removendo...' : hardDelete ? 'Excluir Permanentemente' : 'Encerrar Enquete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}