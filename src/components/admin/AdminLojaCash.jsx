import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Gift, Crown } from 'lucide-react';
import AdminStreamerPackages from './AdminStreamerPackages';

export default function AdminLojaCash() {
  const [activeTab, setActiveTab] = useState('pacotes-streamer');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Loja Cash</h1>
        <p className="text-[#A9B2C7]">Gerencie produtos e pacotes compráveis com CASH</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-[#0C121C] p-1 rounded-xl mb-6">
          <TabsTrigger 
            value="pacotes-streamer"
            className="flex items-center gap-2 data-[state=active]:bg-[#19E0FF]/20 data-[state=active]:text-[#19E0FF]"
          >
            <Package className="w-4 h-4" />
            Pacotes Streamer
          </TabsTrigger>
          <TabsTrigger 
            value="pacotes"
            className="flex items-center gap-2 data-[state=active]:bg-[#19E0FF]/20 data-[state=active]:text-[#19E0FF]"
          >
            <Gift className="w-4 h-4" />
            Pacotes
          </TabsTrigger>
          <TabsTrigger 
            value="premium"
            className="flex items-center gap-2 data-[state=active]:bg-[#19E0FF]/20 data-[state=active]:text-[#19E0FF]"
          >
            <Crown className="w-4 h-4" />
            Premium
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pacotes-streamer">
          <AdminStreamerPackages />
        </TabsContent>

        <TabsContent value="pacotes">
          <div className="text-center py-12 text-[#A9B2C7]">
            <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Em breve: gerenciamento de pacotes gerais</p>
          </div>
        </TabsContent>

        <TabsContent value="premium">
          <div className="text-center py-12 text-[#A9B2C7]">
            <Crown className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Em breve: gerenciamento de planos Premium</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}