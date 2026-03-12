import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MetalButton from '@/components/ui/MetalButton';
import { Textarea } from '@/components/ui/textarea';

export default function RatingModal({ isOpen, onClose, order, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('market_rateOrder', {
        order_id: order.id,
        seller_user_id: order.listing_snapshot?.seller_user_id,
        score: rating,
        comment: comment.trim() || null
      });
      
      if (response.data && response.data.success) {
        onSubmit();
        onClose();
      }
    } catch (e) {
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#0C121C] to-[#05070B] border-2 border-[#19E0FF]/30 rounded-xl max-w-md w-full p-6 shadow-2xl shadow-[#19E0FF]/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Avaliar Vendedor</h2>
                <button
                  onClick={onClose}
                  className="text-[#A9B2C7] hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Seller info */}
              <div className="mb-6 p-4 bg-[#0C121C] rounded-lg border border-[#19E0FF]/10">
                <p className="text-[#A9B2C7] text-sm mb-1">Vendedor</p>
                <p className="text-white font-bold">
                  {order.listing_snapshot?.seller_username || 'Vendedor'}
                </p>
              </div>
              
              {/* Star rating */}
              <div className="mb-6">
                <p className="text-[#A9B2C7] text-sm mb-3">Como foi sua experiência?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-[#FFD700] text-[#FFD700]'
                            : 'text-[#A9B2C7]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Comment */}
              <div className="mb-6">
                <label className="block text-[#A9B2C7] text-sm mb-2">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi sua experiência..."
                  className="bg-[#0C121C] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50 resize-none h-24"
                  maxLength={500}
                />
                <p className="text-[#A9B2C7] text-xs mt-1">
                  {comment.length}/500
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <MetalButton
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </MetalButton>
                <MetalButton
                  variant="primary"
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={rating === 0}
                  loading={loading}
                >
                  Enviar Avaliação
                </MetalButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}