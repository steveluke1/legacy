import React from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { authClient } from '@/components/auth/authClient';
import { useAuth } from '@/components/auth/AuthProvider';

export default function ListingCard({ listing, index = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBuyClick = (e) => {
    if (!user) {
      e.preventDefault();
      authClient.redirectToLogin(`/mercado/alz/checkout/${listing.listing_id}`);
    }
  };

  const formatAlz = (amount) => {
    const billions = amount / 1000000000;
    return `${billions.toFixed(2)}B ALZ`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const pricePerBillion = listing.price_per_billion || (listing.price_brl / listing.alz_amount) * 1000000000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/mercado/alz/checkout/${listing.listing_id}`} onClick={handleBuyClick}>
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 hover:border-[#19E0FF]/40 transition-all hover:shadow-lg hover:shadow-[#19E0FF]/10 cursor-pointer group">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#19E0FF]/10 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#19E0FF]" />
              </div>
              <div>
                <p className="text-sm text-[#A9B2C7]">Vendedor</p>
                <p className="text-white font-semibold">{listing.seller_character_name}</p>
              </div>
            </div>
          </div>

          {/* ALZ Amount */}
          <div className="mb-4">
            <p className="text-3xl font-bold text-[#19E0FF] mb-1">
              {formatAlz(listing.alz_amount)}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#A9B2C7]">
              <TrendingUp className="w-3 h-3" />
              <span>{formatPrice(pricePerBillion)} por bilhão</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-4 border-t border-[#19E0FF]/10">
            <div>
              <p className="text-xs text-[#A9B2C7]">Preço total</p>
              <p className="text-2xl font-bold text-white">{formatPrice(listing.price_brl)}</p>
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg group-hover:shadow-lg transition-all">
              Comprar
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}