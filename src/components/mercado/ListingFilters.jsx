import React from 'react';
import { Search, Filter } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ListingFilters({ 
  filters, 
  onFilterChange 
}) {
  return (
    <GlowCard className="p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
          <Input
            placeholder="Buscar por nome de item ou descrição..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select 
              value={filters.type} 
              onValueChange={(value) => onFilterChange({ ...filters, type: value })}
            >
              <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ALZ">ALZ</SelectItem>
                <SelectItem value="ITEM">Itens</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              type="number"
              placeholder="Preço mínimo (R$)"
              value={filters.minPrice}
              onChange={(e) => onFilterChange({ ...filters, minPrice: e.target.value })}
              className="bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
            />
          </div>

          <div className="flex-1">
            <Input
              type="number"
              placeholder="Preço máximo (R$)"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.value })}
              className="bg-[#05070B] border-[#19E0FF]/20 text-white placeholder:text-[#A9B2C7]/50"
            />
          </div>
        </div>
      </div>
    </GlowCard>
  );
}