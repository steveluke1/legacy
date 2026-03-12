import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Coins, Package, User, ChevronRight, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CrystalBorder from '@/components/ui/CrystalBorder';
import SellerBadge from '@/components/mercado/SellerBadge';
import { Badge } from '@/components/ui/badge';

export default function ListingCard({ listing, index = 0 }) {
  const isAlz = listing.type === 'ALZ';
  const [sellerBadges, setSellerBadges] = useState([]);
  const [sellerRating, setSellerRating] = useState(null);

  useEffect(() => {
    if (listing.seller_user_id) {
      loadSellerInfo();
    }
  }, [listing.seller_user_id]);

  const loadSellerInfo = async () => {
    try {
      const response = await base44.functions.invoke('market_getSellerBadges', {
        seller_user_id: listing.seller_user_id
      });
      if (response.data && response.data.success) {
        setSellerBadges(response.data.badges || []);
      }

      // Get seller rating
      const ratings = await base44.entities.MarketReputation.filter({
        seller_user_id: listing.seller_user_id
      });
      if (ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
        setSellerRating({ avg: avg.toFixed(1), count: ratings.length });
      }
    } catch (e) {
      // Ignore errors
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={createPageUrl(`MercadoPedido?id=${listing.id}`)}>
        <CrystalBorder tier="Bronze Crystal">
          <div className="p-5 h-full group hover:bg-[#0C121C]/30 transition-colors rounded-lg">
            <div className="flex items-start justify-between mb-3">
            <Badge className={`${isAlz ? 'bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30' : 'bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30'}`}>
              {isAlz ? (
                <><Coins className="w-3 h-3 mr-1" /> ALZ</>
              ) : (
                <><Package className="w-3 h-3 mr-1" /> Item</>
              )}
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#19E0FF] transition-colors">
            {isAlz 
              ? `${listing.alz_amount?.toLocaleString()} ALZ`
              : listing.item_name
            }
          </h3>

          {!isAlz && listing.item_description && (
            <p className="text-[#A9B2C7] text-sm mb-3 line-clamp-2">
              {listing.item_description}
            </p>
          )}

          {!isAlz && listing.quantity_units && (
            <p className="text-[#A9B2C7] text-sm mb-3">
              Quantidade: {listing.quantity_units} unidade(s)
            </p>
          )}

          <div className="pt-3 border-t border-[#19E0FF]/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#A9B2C7] text-sm">Preço:</span>
              <span className="text-xl font-bold text-white">
                R$ {listing.price_brl?.toFixed(2)}
              </span>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3 h-3 text-[#A9B2C7]" />
                <span className="text-white font-medium">{listing.seller_username || 'Vendedor'}</span>
              </div>
              
              {sellerRating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                  <span className="text-white font-bold">{sellerRating.avg}</span>
                  <span className="text-[#A9B2C7] text-xs">({sellerRating.count} avaliações)</span>
                </div>
              )}
              
              {sellerBadges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sellerBadges.slice(0, 2).map(badge => (
                    <SellerBadge key={badge} badge={badge} showTooltip={false} />
                  ))}
                </div>
              )}
            </div>

            <span className="text-[#19E0FF] flex items-center gap-1 group-hover:translate-x-1 transition-transform text-sm font-medium">
              Ver detalhes
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
          </div>
        </CrystalBorder>
      </Link>
    </motion.div>
  );
}