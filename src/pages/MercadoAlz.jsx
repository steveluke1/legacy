import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ListingCard from '@/components/marketplace/ListingCard';
import { marketplaceClient } from '@/components/marketplace/marketplaceClient';

export default function MercadoAlz() {
  const [sortBy, setSortBy] = useState('-created_date');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alz-listings', sortBy, page],
    queryFn: () => marketplaceClient.listListings({ page, limit: 20, sortBy }),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  return (
    <div className="min-h-screen bg-[#05070B] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Marketplace de ALZ</h1>
          <p className="text-[#A9B2C7]">Compre ALZ de forma segura com entrega imediata</p>
        </div>

        {/* Filters */}
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[#A9B2C7] mb-2">Ordenar por</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">Mais recentes</SelectItem>
                  <SelectItem value="price_brl">Menor preço</SelectItem>
                  <SelectItem value="-alz_amount">Maior quantidade ALZ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 bg-[#19E0FF]/10" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar anúncios</h3>
            <p className="text-[#A9B2C7] mb-6">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : !data?.listings || data.listings.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum anúncio disponível</h3>
            <p className="text-[#A9B2C7]">
              Não há ofertas de ALZ no momento. Volte mais tarde.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data.listings.map((listing, index) => (
                <ListingCard key={listing.listing_id} listing={listing} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <div className="px-4 py-2 bg-[#19E0FF]/10 text-[#19E0FF] rounded font-semibold">
                  {page} / {data.pagination.totalPages}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.pagination.totalPages}
                  className="px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}