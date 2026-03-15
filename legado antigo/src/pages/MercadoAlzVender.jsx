import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { authClient } from '@/components/auth/authClient';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import MetalButton from '@/components/ui/MetalButton';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import SellerSplitForm from '@/components/mercado/SellerSplitForm';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MercadoAlzVender() {
  const navigate = useNavigate();
  const [totalAlz, setTotalAlz] = useState('');
  const [pricePerBillion, setPricePerBillion] = useState('');
  const [creating, setCreating] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);
  const [showSplitConfig, setShowSplitConfig] = useState(false);
  
  // Debug state
  const [debugLastResponse, setDebugLastResponse] = useState(null);
  const [debugBridgeProbe, setDebugBridgeProbe] = useState(null);
  const [probingBridge, setProbingBridge] = useState(false);
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MARKET') === '1';

  // Debug helpers
  const safeRedactToken = (token) => {
    if (!token || typeof token !== 'string' || token.length < 20) return 'INVALID_TOKEN';
    return `${token.slice(0, 12)}...${token.slice(-8)}`;
  };

  const safeDecodeJwtPart = (base64url) => {
    try {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = atob(base64);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  const buildDebugSnapshot = (requestSummary, responseData) => {
    const token = authClient.getToken();
    const now = Math.floor(Date.now() / 1000);
    
    let jwtHeader = null;
    let jwtPayload = null;
    let expInSeconds = null;
    let expired = null;
    
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        jwtHeader = safeDecodeJwtPart(parts[0]);
        jwtPayload = safeDecodeJwtPart(parts[1]);
        if (jwtPayload?.exp) {
          expInSeconds = jwtPayload.exp - now;
          expired = expInSeconds <= 0;
        }
      }
    }
    
    return {
      tag: 'DEBUG_MARKET',
      page: 'SELL',
      timestamp: new Date().toISOString(),
      authDiag: {
        tokenSourceKey: 'lon_auth_token',
        tokenPresent: !!token,
        tokenRedacted: token ? safeRedactToken(token) : null,
        jwtHeader,
        jwtPayload: jwtPayload ? { 
          sub: jwtPayload.sub, 
          exp: jwtPayload.exp, 
          iat: jwtPayload.iat 
        } : null,
        nowEpoch: now,
        expInSeconds,
        expired
      },
      reqSummary: requestSummary,
      res: responseData
    };
  };

  // Helper: Normalize response shape (handles multiple possible wrapping formats)
  const normalizeStatsResponse = (res) => {
    if (!res) return { market: null };
    
    // Case 1: { ok: true, data: { market: {...} } }
    if (res.ok && res.data && res.data.market) {
      return res.data;
    }
    
    // Case 2: { data: { ok: true, data: { market: {...} } } } (double-wrapped)
    if (res.data && res.data.ok && res.data.data && res.data.data.market) {
      return res.data.data;
    }
    
    // Case 3: { market: {...} } (already flattened)
    if (res.market) {
      return res;
    }
    
    // Case 4: { data: { market: {...} } } (partial)
    if (res.data && res.data.market) {
      return res.data;
    }
    
    // Fallback
    return { market: null };
  };

  // Load seller profile
  const { data: profileData, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const token = authClient.getToken();
      const res = await base44.functions.invoke('sellerGetMyProfile', { token });
      return res.data;
    }
  });

  // Buscar estatísticas REAIS do mercado (sem placeholders)
  const { data: rawStats } = useQuery({
    queryKey: ['alz-market-stats-v1'],
    queryFn: async () => {
      const token = authClient.getToken();
      const res = await base44.functions.invoke('alzGetMarketStatsV1', { token });
      return res.data;
    },
    staleTime: 30000, // Cache 30s
    refetchOnWindowFocus: false
  });

  // Normalize stats (defensive against multiple response shapes)
  const marketStats = normalizeStatsResponse(rawStats);
  const market = marketStats?.market || null;

  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatAlz = (value) => {
    const billions = value / 1_000_000_000;
    if (billions >= 1) {
      return `${billions.toFixed(2)}B ALZ`;
    }
    const millions = value / 1_000_000;
    return `${millions.toFixed(0)}M ALZ`;
  };

  const handleUpdateSplitProfile = async (splitData) => {
    try {
      const token = authClient.getToken();
      const res = await base44.functions.invoke('sellerUpdateSplitProfileV2', { 
        ...splitData, 
        token 
      });
      
      if (res.data?.ok) {
        await refetchProfile();
        setShowSplitConfig(false);
      } else {
        throw new Error(res.data?.error?.message || 'Erro ao salvar');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCreateOrder = async () => {
    // Split enforcement now handled by backend (alzCreateSellOrderV2)
    
    const alzAmount = parseFloat(totalAlz);
    const price = parseFloat(pricePerBillion);

    if (!alzAmount || alzAmount < 10_000_000) {
      toast.error('A quantidade mínima é 10.000.000 ALZ (10M)');
      return;
    }

    if (alzAmount > 100_000_000_000) {
      toast.error('A quantidade máxima é 100.000.000.000 ALZ (100B)');
      return;
    }

    if (!price || price <= 0) {
      toast.error('Informe um preço válido por bilhão');
      return;
    }

    setCreating(true);
    try {
      const token = authClient.getToken();
      const reqTimestamp = new Date().toISOString();
      const res = await base44.functions.invoke('alzCreateSellOrderV2', {
        token,
        totalAlz: alzAmount,
        pricePerBillionBRL: price
      });

      // Debug capture
      if (debugMode) {
        const reqSummary = {
          endpoint: 'alzCreateSellOrderV2',
          timestamp: reqTimestamp,
          totalAlz: alzAmount,
          pricePerBillionBRL: price
        };
        const snapshot = buildDebugSnapshot(reqSummary, res.data);
        setDebugLastResponse(snapshot);
        console.log(snapshot);
      }

      // Handle backend error response (ok: false)
      if (res.data?.ok === false) {
        const errorCode = res.data?.error?.code;
        
        // If Split not configured, open modal
        if (errorCode === 'SPLIT_NOT_CONFIGURED') {
          toast.error('Configure seus dados Efí Split primeiro');
          setShowSplitConfig(true);
          return;
        }
        
        throw new Error(res.data?.error?.message || 'Erro ao criar oferta');
      }

      setOrderCreated(res.data.data);
      toast.success('Oferta de venda criada com sucesso!');
    } catch (error) {
      // Extract error code from common shapes
      const errorCode = error.response?.data?.error?.code || error.data?.error?.code;
      
      // Handle Split not configured
      if (errorCode === 'SPLIT_NOT_CONFIGURED') {
        toast.error('Configure seus dados Efí Split primeiro');
        setShowSplitConfig(true);
        return;
      }
      
      // Handle 401 specifically
      if (error.response?.status === 401 || error.message?.includes('401')) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        const errorMsg = error.response?.data?.error?.message || error.message || 'Erro ao criar oferta';
        toast.error(errorMsg);
      }
    } finally {
      setCreating(false);
    }
  };

  if (loadingProfile) {
    return <LoadingShell message="Carregando perfil..." />;
  }

  if (orderCreated) {
    return (
      <div className="min-h-screen bg-[#05070B] p-6">
        <div className="max-w-3xl mx-auto">
          <GlowCard className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-[#19E0FF] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Oferta Criada com Sucesso!</h1>
            
            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 mb-6">
              <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#A9B2C7]">Quantidade de ALZ:</span>
                <span className="text-white font-bold">
                  {formatAlz(orderCreated?.sellOrder?.total_alz || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A9B2C7]">Preço por 1B ALZ:</span>
                <span className="text-[#19E0FF] font-bold">
                  {formatBRL(orderCreated?.sellOrder?.price_per_billion_brl)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A9B2C7]">Valor Total (se vender tudo):</span>
                <span className="text-[#F7CE46] font-bold text-xl">
                  {formatBRL(((orderCreated?.sellOrder?.total_alz || 0) / 1_000_000_000) * (orderCreated?.sellOrder?.price_per_billion_brl || 0))}
                </span>
              </div>
              </div>
            </div>

            <p className="text-[#A9B2C7] mb-6">
              Sua oferta de venda foi criada com sucesso. Ela será usada automaticamente quando jogadores 
              comprarem ALZ pelo mercado. O pagamento será creditado assim que houver match.
            </p>

            <div className="flex gap-4 justify-center">
              <MetalButton onClick={() => navigate('/mercado')} variant="secondary">
                Voltar ao Mercado
              </MetalButton>
              <MetalButton onClick={() => {
                setOrderCreated(null);
                setTotalAlz('');
                setPricePerBillion('');
              }}>
                Criar Nova Oferta
              </MetalButton>
            </div>
          </GlowCard>
        </div>
      </div>
    );
  }

  // Show Split config modal
  if (showSplitConfig) {
    return (
      <div className="min-h-screen bg-[#05070B] p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowSplitConfig(false)}
            className="flex items-center gap-2 text-[#19E0FF] hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <GlowCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-8 h-8 text-[#19E0FF]" />
              <div>
                <h1 className="text-2xl font-bold text-white">Configurar Efí Split</h1>
                <p className="text-[#A9B2C7] text-sm">Obrigatório para vender ALZ no marketplace</p>
              </div>
            </div>

            <SellerSplitForm
              profile={profileData?.profile}
              onUpdate={handleUpdateSplitProfile}
            />
          </GlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/mercado')}
          className="flex items-center gap-2 text-[#19E0FF] hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Mercado
        </button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Vender ALZ</h1>
              <p className="text-[#A9B2C7] text-lg">
                Crie uma oferta de venda e receba automaticamente via Efí Split
              </p>
            </div>
            <MetalButton
              onClick={() => setShowSplitConfig(true)}
              variant="secondary"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Config. Split
            </MetalButton>
          </div>
        </div>

        {/* Split eligibility warning */}
        {(!profileData?.profile || profileData.profile.efi_split_status !== 'verified') && (
          <div className="mb-6 p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#F7CE46] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#F7CE46] font-bold mb-1">
                  Configuração Efí Split Obrigatória
                </p>
                <p className="text-[#A9B2C7] text-sm mb-3">
                  Para vender ALZ no marketplace, você precisa cadastrar seus dados Efí Split. 
                  O split permite que você receba o pagamento diretamente na sua conta Efí.
                </p>
                <button
                  onClick={() => setShowSplitConfig(true)}
                  className="text-[#19E0FF] hover:underline text-sm font-medium"
                >
                  Configurar Agora →
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Informações do Mercado */}
          <GlowCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#19E0FF]" />
              Informações do Mercado
            </h2>

            <div className="space-y-4">
              <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
                <div className="text-[#A9B2C7] text-sm mb-1">Preço Mínimo Atual (1B ALZ)</div>
                <div className="text-[#19E0FF] font-bold text-2xl">
                  {market?.minPricePerBillionBRL !== null && market?.minPricePerBillionBRL !== undefined 
                    ? formatBRL(market.minPricePerBillionBRL) 
                    : 'Sem dados'}
                </div>
                <p className="text-[#A9B2C7] text-xs mt-2">
                  Este é o menor preço atual no mercado. Ofertas com preço menor aparecem primeiro.
                </p>
              </div>

              <div className="bg-[#0C121C] border border-[#F7CE46]/20 rounded-lg p-4">
                <div className="text-[#A9B2C7] text-sm mb-1">Preço Médio Recente (1B ALZ)</div>
                <div className="text-[#F7CE46] font-bold text-2xl">
                  {market?.avgRecentPricePerBillionBRL !== null && market?.avgRecentPricePerBillionBRL !== undefined 
                    ? formatBRL(market.avgRecentPricePerBillionBRL) 
                    : 'Sem dados'}
                </div>
                <p className="text-[#A9B2C7] text-xs mt-2">
                  Baseado nas últimas negociações realizadas no mercado. Se ainda não houver negociações, o preço médio ficará como "Sem dados".
                </p>
              </div>

              <div className="bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#A9B2C7] text-sm">
                      <strong className="text-white">Dica:</strong> Para vender mais rápido, 
                      defina um preço igual ou abaixo do preço mínimo atual. Ofertas mais baratas 
                      são vendidas primeiro (ordem crescente de preço).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Formulário de Venda */}
          <GlowCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Criar Oferta de Venda</h2>

            <div className="space-y-6">
              <div>
                <label className="text-[#A9B2C7] text-sm mb-2 block">
                  Quantidade de ALZ
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 1000000000 (1B ALZ)"
                  value={totalAlz}
                  onChange={(e) => setTotalAlz(e.target.value)}
                  className="bg-[#0C121C] border-[#19E0FF]/30 text-white"
                />
                {totalAlz && parseFloat(totalAlz) >= 10_000_000 && (
                  <p className="text-[#19E0FF] text-sm mt-2">
                    = {formatAlz(parseFloat(totalAlz))}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[#A9B2C7] text-sm mb-2 block">
                  Preço por 1B ALZ (em R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 15.00"
                  value={pricePerBillion}
                  onChange={(e) => setPricePerBillion(e.target.value)}
                  className="bg-[#0C121C] border-[#19E0FF]/30 text-white"
                />
                {pricePerBillion && market?.minPricePerBillionBRL !== null && market?.minPricePerBillionBRL !== undefined && (
                  <div className="mt-2">
                    {parseFloat(pricePerBillion) <= market.minPricePerBillionBRL ? (
                      <p className="text-[#19E0FF] text-sm">
                        ✓ Seu preço é competitivo! Será vendido rapidamente.
                      </p>
                    ) : (
                      <p className="text-[#F7CE46] text-sm">
                        ⚠️ Seu preço está acima do mínimo atual. Pode demorar para vender.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {totalAlz && pricePerBillion && parseFloat(totalAlz) >= 10_000_000 && parseFloat(pricePerBillion) > 0 && (
                <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
                  <div className="text-[#A9B2C7] text-sm mb-1">Valor Total (se vender tudo)</div>
                  <div className="text-[#19E0FF] font-bold text-3xl">
                    {formatBRL((parseFloat(totalAlz) / 1_000_000_000) * parseFloat(pricePerBillion))}
                  </div>
                </div>
              )}

              <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
                <h4 className="text-white font-bold mb-2">Como Funciona:</h4>
                <ul className="text-[#A9B2C7] text-sm space-y-2">
                  <li>• Sua oferta será adicionada ao order book do mercado</li>
                  <li>• Compradores não verão seu nome (mercado anônimo)</li>
                  <li>• Quando alguém comprar, seu ALZ será vendido automaticamente</li>
                  <li>• O pagamento via Efí Split será creditado diretamente na sua conta</li>
                  <li>• Ofertas mais baratas são vendidas primeiro</li>
                  <li>• Split ocorre apenas entre contas Efí aprovadas</li>
                </ul>
              </div>

              <MetalButton
                onClick={handleCreateOrder}
                loading={creating}
                disabled={
                  !totalAlz || 
                  !pricePerBillion || 
                  parseFloat(totalAlz) < 10_000_000 || 
                  parseFloat(pricePerBillion) <= 0
                }
                className="w-full"
                size="lg"
              >
                Criar Oferta de Venda
              </MetalButton>
            </div>
          </GlowCard>
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <div className="mt-8">
            <GlowCard className="p-6 bg-[#0C121C]/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#F7CE46]">
                  🔧 Diagnóstico do Mercado (DEBUG_MARKET=1)
                </h3>
                <MetalButton
                  onClick={async () => {
                    setProbingBridge(true);
                    try {
                      const res = await base44.functions.invoke('marketBridgeProbe', {});
                      setDebugBridgeProbe(res.data);
                      toast.success('Probe executado');
                    } catch (error) {
                      toast.error('Erro ao executar probe');
                      console.error('Bridge probe error:', error);
                    } finally {
                      setProbingBridge(false);
                    }
                  }}
                  loading={probingBridge}
                  size="sm"
                  variant="secondary"
                >
                  Testar Bridge
                </MetalButton>
              </div>
              <p className="text-[#A9B2C7] text-xs mb-4">
                Este painel é apenas para testes. Não compartilhe tokens.
              </p>
              
              {debugLastResponse ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-[#19E0FF] text-sm font-bold mb-2">Auth Diagnostics:</div>
                    <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-3 text-xs font-mono">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Token presente: {debugLastResponse.authDiag.tokenPresent ? '✅' : '❌'}</div>
                        <div>Expirado: {debugLastResponse.authDiag.expired ? '🔴 SIM' : '🟢 NÃO'}</div>
                        <div className="col-span-2">Token (redigido): {debugLastResponse.authDiag.tokenRedacted}</div>
                        <div>JWT sub: {debugLastResponse.authDiag.jwtPayload?.sub || 'N/A'}</div>
                        <div>JWT exp (epoch): {debugLastResponse.authDiag.jwtPayload?.exp || 'N/A'}</div>
                        <div className="col-span-2">Exp em segundos: {debugLastResponse.authDiag.expInSeconds ?? 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[#19E0FF] text-sm font-bold mb-2">Resumo da Última Requisição:</div>
                    <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-3 text-xs font-mono">
                      <div>Endpoint: {debugLastResponse.reqSummary.endpoint}</div>
                      <div>Timestamp: {debugLastResponse.reqSummary.timestamp}</div>
                      <div>totalAlz: {debugLastResponse.reqSummary.totalAlz}</div>
                      <div>pricePerBillionBRL: {debugLastResponse.reqSummary.pricePerBillionBRL}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-[#19E0FF] text-sm font-bold mb-2">Última Resposta do Backend:</div>
                    <pre className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-3 text-xs text-[#A9B2C7] overflow-auto max-h-96">
                      {JSON.stringify(debugLastResponse.res, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-[#A9B2C7] text-sm">Nenhuma requisição capturada ainda. Tente criar uma oferta.</p>
              )}
              
              {/* Bridge Probe */}
              {debugBridgeProbe && (
                <div className="mt-6 pt-6 border-t border-[#19E0FF]/20">
                  <div className="text-[#19E0FF] text-sm font-bold mb-2">Probe Bridge (marketBridgeProbe):</div>
                  <p className="text-[#A9B2C7] text-xs mb-3">
                    Mostra host do BRIDGE_BASE_URL e o diagnóstico de conectividade. Não compartilhe tokens.
                  </p>
                  <pre className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-3 text-xs text-[#A9B2C7] overflow-auto max-h-96">
                    {JSON.stringify(debugBridgeProbe, null, 2)}
                  </pre>
                </div>
              )}
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}