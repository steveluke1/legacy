import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { authClient } from '@/components/auth/authClient';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, DollarSign, Copy, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import LoadingShell from '@/components/ui/LoadingShell';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import MetalButton from '@/components/ui/MetalButton';
import GlowCard from '@/components/ui/GlowCard';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function MercadoAlzComprar() {
  const navigate = useNavigate();
  const [selectedAlzAmount, setSelectedAlzAmount] = useState(1_000_000_000); // 1B default
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [pixPayment, setPixPayment] = useState(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState(30); // 7, 30, 365
  
  // NIC validation state
  const [buyerNic, setBuyerNic] = useState('');
  const [validatingNic, setValidatingNic] = useState(false);
  const [validatedCharacter, setValidatedCharacter] = useState(null);
  
  // Debug state
  const [debugLastResponse, setDebugLastResponse] = useState(null);
  const [debugBridgeProbe, setDebugBridgeProbe] = useState(null);
  const [probingBridge, setProbingBridge] = useState(false);
  const debugMode = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MARKET') === '1';
  const debugPixMode = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MARKET_PIX') === '1';
  
  // Polling state for PIX payment status
  const [pollingStatus, setPollingStatus] = useState('idle'); // 'idle' | 'polling' | 'done' | 'error'
  const pollingIntervalRef = useRef(null);

  // Debug helpers (local, no imports)
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

  const getTokenFromLocalStorage = () => {
    const newKey = 'lon_auth_token';
    const legacyKey = 'cz_auth_token';
    return localStorage.getItem(newKey) || localStorage.getItem(legacyKey) || null;
  };

  const buildDebugSnapshot = (requestSummary, responseData) => {
    const token = getTokenFromLocalStorage();
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
      page: 'BUY',
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
    
    // Case 1: res = { ok: true, data: { market: {...} } }
    if (res.ok && res.data && res.data.market) {
      return res.data;
    }
    
    // Case 2: res = { data: { ok: true, data: { market: {...} } } } (double-wrapped)
    if (res.data && res.data.ok && res.data.data && res.data.data.market) {
      return res.data.data;
    }
    
    // Case 3: res = { market: {...} } (already flattened)
    if (res.market) {
      return res;
    }
    
    // Case 4: res.data exists and has market directly
    if (res.data && res.data.market) {
      return res.data;
    }
    
    // Fallback: no valid market data
    return { market: null };
  };

  // Buscar estatísticas REAIS do mercado (sem placeholders)
  const { data: rawStats, isLoading: loadingStats } = useQuery({
    queryKey: ['alz-market-stats-v1'],
    queryFn: async () => {
      const res = await base44.functions.invoke('alzGetMarketStatsV1', {});
      return res.data;
    },
    staleTime: 30000, // Cache válido por 30s
    refetchInterval: 30000, // Atualizar a cada 30s
    refetchOnWindowFocus: false
  });

  // Normalize response shape (defensive)
  const marketStats = normalizeStatsResponse(rawStats);
  const market = marketStats?.market || null;

  // Buscar histórico de preço
   // Store queryClient for potential manual refetch (ESM-safe: direct useQueryClient hook)
   const queryClient = useQueryClient();
   const debugHistoryMode = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MARKET_HISTORY') === '1';

   const { data: historyData, isLoading: loadingHistory, error: historyError, refetch: refetchHistory } = useQuery({
     queryKey: ['alz-price-history-v1', historyPeriod],
     queryFn: async () => {
       try {
         const res = await base44.functions.invoke('marketGetPriceHistory', {
           range: historyPeriod === 7 ? '7D' : historyPeriod === 30 ? '30D' : '1A'
         });

         if (!res.data?.ok) {
           return { error: true, message: res.data?.error?.message || 'Erro desconhecido' };
         }

         // Defensive: Ensure points is always an array
         const data = res.data;
         if (data.points && !Array.isArray(data.points)) {
           console.warn('[marketGetPriceHistory] points is not an array:', typeof data.points);
           data.points = [];
         }

         if (debugHistoryMode) {
           console.log('[DEBUG_MARKET_HISTORY] Fetched points:', data.points?.length, data.points?.[0]);
         }

         return data;
       } catch (error) {
         console.error('Erro ao buscar histórico:', error);
         return { error: true, message: error.message };
       }
     },
     staleTime: 15000,
     refetchInterval: 60000,
     refetchOnWindowFocus: false
   });

  // Mapa historyData com erro para comportamento esperado
  const historyDataWithError = historyError ? { error: true } : historyData;

  // Store queryClient reference for manual refetch on error
  useEffect(() => {
    if (queryClient) {
      window.__queryClientRef = queryClient;
    }
  }, [queryClient]);

  // Buscar cotação com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
    }, [selectedAlzAmount]);

    // Polling cleanup on component unmount
    useEffect(() => {
     return () => {
       if (pollingIntervalRef.current) {
         clearInterval(pollingIntervalRef.current);
         pollingIntervalRef.current = null;
       }
     };
    }, []);

  const fetchQuote = async () => {
    if (selectedAlzAmount < 10_000_000) return;

    setLoadingQuote(true);
    try {
      const res = await base44.functions.invoke('alzGetQuote', {
        requestedAlzAmount: selectedAlzAmount
      });
      
      if (res.data?.error) {
        toast.error(res.data.error);
        setQuote(null);
      } else {
        setQuote(res.data);
      }
    } catch (error) {
      console.error('Erro ao buscar cotação:', error);
      toast.error(error.response?.data?.error || 'Erro ao buscar cotação');
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  const handleValidateNic = async () => {
    const trimmedNic = buyerNic.trim();
    
    if (!trimmedNic || trimmedNic.length === 0) {
      toast.error('Digite o nome do personagem (NIC)');
      return;
    }

    // Auth guard: require token
    const token = authClient.getToken();
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setValidatingNic(true);
    setValidatedCharacter(null); // Clear previous validation
    
    try {
      const reqTimestamp = new Date().toISOString();
      const debugNicMode = typeof window !== 'undefined' && localStorage.getItem('DEBUG_MARKET_NIC') === '1';
      
      const res = await base44.functions.invoke('marketResolveBuyerNic', {
        token,
        nic: trimmedNic,
        debug: debugNicMode
      });
      
      // Debug capture (NO NIC logged, only length)
      if (debugMode) {
        const reqSummary = {
          endpoint: 'marketResolveBuyerNic',
          timestamp: reqTimestamp,
          nicLength: trimmedNic.length
        };
        const snapshot = buildDebugSnapshot(reqSummary, res.data);
        setDebugLastResponse(snapshot);
        console.log(snapshot);
      }
      
      if (!res.data?.ok) {
        const error = res.data?.error || {};
        const errorCode = error.code || 'UNKNOWN_ERROR';
        
        // DETERMINISTIC ERROR HANDLING
        
        // Bridge endpoint não implementado
        if (errorCode === 'BRIDGE_ENDPOINT_NOT_FOUND') {
          setValidatedCharacter({
            _error: true,
            _errorCode: errorCode,
            _errorMessage: error.message,
            _nextAction: error.next_action
          });
          return;
        }
        
        // Timeout
        if (errorCode === 'BRIDGE_TIMEOUT') {
          toast.error('Tempo esgotado ao validar personagem. Tente novamente em alguns segundos.', { duration: 5000 });
          return;
        }
        
        // Network error
        if (errorCode === 'BRIDGE_NETWORK_ERROR') {
          toast.error('Erro de conectividade com servidor do jogo. Tente novamente.', { duration: 5000 });
          return;
        }
        
        // Character not found (404)
        if (errorCode === 'BUYER_NIC_NOT_FOUND' || errorCode === 'CHARACTER_NOT_FOUND') {
          toast.error(error.message || `Personagem "${trimmedNic}" não encontrado`);
          return;
        }
        
        // Bridge bad shape (502)
        if (errorCode === 'BRIDGE_BAD_SHAPE') {
          toast.error('Falha ao validar NIC (resposta inesperada do servidor). Tente novamente em instantes.', { duration: 6000 });
          return;
        }
        
        // DB permission denied (503)
        if (errorCode === 'DB_PERMISSION_DENIED') {
          toast.error('Sistema de validação temporariamente indisponível. Contate o suporte.', { duration: 6000 });
          return;
        }
        
        // Character not yours (ownership mismatch)
        if (errorCode === 'CHARACTER_NOT_YOURS' || errorCode === 'BUYER_MISMATCH_USERNUM') {
          toast.error(error.message || 'Este personagem não pertence à sua conta');
          return;
        }
        
        // No game account
        if (errorCode === 'NO_GAME_ACCOUNT' || errorCode === 'USER_GAME_USER_NUM_MISSING') {
          toast.error('Você ainda não possui uma conta in-game vinculada');
          return;
        }
        
        // Generic error
        toast.error(error.message || 'Erro ao validar NIC');
        return;
      }
      
      const charData = res.data.data;
      
      // Adapt response to UI format (buyerNic → name, buyerCharacterIdx → characterIdx)
      const uiCharData = {
        name: charData.characterName || charData.buyerNic || charData.name,
        characterIdx: charData.buyerCharacterIdx || charData.characterIdx,
        userNum: charData.buyerUserNum || charData.userNum,
        level: charData.level || null,
        class: charData.class || null,
        isOnline: charData.isOnline || false
      };
      
      setValidatedCharacter(uiCharData);
      
      if (uiCharData.isOnline) {
        toast.warning(`Personagem "${uiCharData.name}" está ONLINE. É necessário estar OFFLINE para receber ALZ.`, { duration: 5000 });
      } else {
        toast.success(`Personagem "${uiCharData.name}" validado com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao validar NIC:', error);
      const errorMsg = error.response?.data?.error?.message || 'Erro ao validar NIC';
      toast.error(errorMsg);
      setValidatedCharacter(null);
    } finally {
      setValidatingNic(false);
    }
  };

  const handleGeneratePix = async () => {
    if (!quote || !quote.isFullyAvailable) {
      toast.error('Por favor, aguarde o cálculo da cotação');
      return;
    }

    if (!validatedCharacter) {
      toast.error('Valide o NIC do personagem antes de gerar PIX');
      return;
    }

    if (validatedCharacter.isOnline) {
      toast.error('O personagem precisa estar OFFLINE para receber ALZ. Deslogue e valide novamente.');
      return;
    }

    // Auth guard: require token
    const token = authClient.getToken();
    if (!token) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setGeneratingPix(true);
    try {
      const res = await base44.functions.invoke('alzCreatePixPaymentForQuote', {
        token,
        requestedAlzAmount: selectedAlzAmount,
        buyerCharacterIdx: validatedCharacter.characterIdx,
        buyerNic: validatedCharacter.name,
        buyerUserNum: validatedCharacter.userNum
      });
      
      if (!res.data?.ok) {
        const errorMsg = res.data?.error?.message || 'Erro ao gerar PIX';
        toast.error(errorMsg);
        return;
      }
      
      if (!res.data.txid || !res.data.copiaCola) {
        toast.error('Erro ao gerar dados do PIX');
        return;
      }

      // Adapt response to existing UI format + buyer info
      setPixPayment({
        pixPaymentId: res.data.paymentId,
        requestedAlzAmount: res.data.alzAllocated,
        totalPriceBRL: res.data.amountBrl,
        averagePricePerBillionBRL: res.data.amountBrl / (res.data.alzAllocated / 1_000_000_000),
        pixPayload: {
          pixCopyPaste: res.data.copiaCola,
          qrCodeImageUrl: res.data.qrImage ? `data:image/png;base64,${res.data.qrImage}` : null,
          providerReferenceId: res.data.txid
        },
        needsAnotherPurchase: res.data.needsAnotherPurchase,
        remainingAlzSuggested: res.data.remainingAlzSuggested,
        sellersCount: res.data.sellersCount,
        buyerNic: validatedCharacter.name
      });
      
      if (res.data.needsAnotherPurchase) {
        toast.warning(`Limite: ${res.data.sellersCount} vendedores. Para o restante, finalize e faça outra compra.`, { duration: 6000 });
      } else {
        toast.success('PIX gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.error || 'Erro ao gerar PIX. Tente novamente.';
      toast.error(errorMsg);
    } finally {
      setGeneratingPix(false);
    }
  };

  const copyPixCode = () => {
    const code = pixPayment?.pixPayload?.pixCopyPaste;
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success('Código PIX copiado!');
    }
  };

  const formatAlz = (value) => {
    const billions = value / 1_000_000_000;
    if (billions >= 1) {
      return `${billions.toFixed(2)}B ALZ`;
    }
    const millions = value / 1_000_000;
    return `${millions.toFixed(0)}M ALZ`;
  };

  const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loadingStats) {
    return <LoadingShell message="Carregando mercado..." fullScreen={false} />;
  }

  // Se já gerou PIX, mostrar tela de pagamento
  if (pixPayment) {
    return (
      <div className="min-h-screen bg-[#05070B] p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setPixPayment(null)}
            className="flex items-center gap-2 text-[#19E0FF] hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para cotação
          </button>

          <GlowCard className="p-8">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-[#19E0FF] mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">PIX Gerado com Sucesso!</h1>
              <p className="text-[#A9B2C7]">Escaneie o QR Code ou copie o código PIX para realizar o pagamento</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Detalhes da Compra</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#A9B2C7]">Quantidade de ALZ:</span>
                    <span className="text-white font-bold">{formatAlz(pixPayment.requestedAlzAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A9B2C7]">Valor Total:</span>
                    <span className="text-[#19E0FF] font-bold text-xl">{formatBRL(pixPayment.totalPriceBRL)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A9B2C7]">Preço Médio (1B ALZ):</span>
                    <span className="text-white">{formatBRL(pixPayment.averagePricePerBillionBRL)}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-4">QR Code PIX</h3>
                {pixPayment.pixPayload?.qrCodeImageUrl ? (
                  <img 
                    src={pixPayment.pixPayload.qrCodeImageUrl} 
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto bg-white rounded-lg p-2"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                    <p className="text-[#A9B2C7]">QR Code não disponível</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">PIX Copia e Cola</h3>
              {pixPayment.pixPayload?.pixCopyPaste ? (
                <>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={pixPayment.pixPayload.pixCopyPaste}
                      readOnly
                      className="flex-1 bg-[#05070B] border border-[#19E0FF]/30 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <MetalButton onClick={copyPixCode}>
                      <Copy className="w-5 h-5" />
                      Copiar
                    </MetalButton>
                  </div>
                  <p className="text-[#A9B2C7] text-sm mt-3">
                    Validade: {pixPayment.pixPayload.expiresAt ? 
                      new Date(pixPayment.pixPayload.expiresAt).toLocaleString('pt-BR') : 
                      '30 minutos'}
                  </p>
                </>
              ) : (
                <p className="text-[#A9B2C7]">Código PIX não disponível</p>
              )}
            </div>

            {pixPayment?.needsAnotherPurchase && (
              <div className="mt-6 p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
                <p className="text-[#F7CE46] text-sm font-bold mb-2">
                  ⚠️ Limite de Split Atingido
                </p>
                <p className="text-[#A9B2C7] text-sm">
                  Este pagamento distribui entre {pixPayment.sellersCount} vendedores (limite máximo: 18). 
                  Para comprar os {formatAlz(pixPayment.remainingAlzSuggested)} restantes, 
                  finalize esta compra e faça outro pedido.
                </p>
              </div>
            )}
            
            {pollingStatus === 'polling' && (
              <div className="mt-6 p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#19E0FF] animate-spin" />
                  <p className="text-[#19E0FF] text-sm font-medium">
                    Pagamento confirmado! Entregando ALZ no correio do jogo...
                  </p>
                </div>
              </div>
            )}
            
            {pollingStatus === 'error' && (
              <div className="mt-6 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg">
                <div className="flex items-center justify-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                  <p className="text-[#FF4B6A] text-sm font-medium">
                    Não foi possível atualizar o status do PIX. Tente novamente.
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
              <p className="text-[#A9B2C7] text-sm text-center">
                Após o pagamento PIX, os ALZ serão enviados automaticamente para o correio do personagem validado. 
                O valor será distribuído automaticamente entre os vendedores via Efí Split.
              </p>
            </div>
            
            {pixPayment?.buyerNic && (
              <div className="mt-4 p-3 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
                <p className="text-[#A9B2C7] text-sm text-center">
                  🎯 Destino: <span className="text-white font-bold">{pixPayment.buyerNic}</span>
                </p>
              </div>
            )}
            
            {/* Botão de simulação para testes */}
            {pixPayment?.pixPaymentId && (
            <div className="mt-6">
            <MetalButton
            onClick={async () => {
                              try {
                                // Auth guard: require token
                                const token = authClient.getToken();
                                if (!token) {
                                  toast.error('Sessão expirada. Faça login novamente.');
                                  return;
                                }

                                // Buscar o provider_reference_id correto
                                const refId = pixPayment.pixPayload?.providerReferenceId || 
                                              pixPayment.pixPaymentId;

                                const debugMode = debugPixMode;
                                if (debugMode) {
                                  console.log('[DEBUG_MARKET_PIX] Simulando pagamento com refId:', refId);
                                }

                                const res = await base44.functions.invoke('alzSimulatePix', {
                                  token,
                                  providerReferenceId: refId,
                                  debug: debugMode
                                });

                                if (debugMode) {
                                  console.log('[DEBUG_MARKET_PIX] Resposta simulação:', res.data);
                                  setDebugLastResponse({
                                    path: 'alzSimulatePix',
                                    ok: res.data?.ok,
                                    bridgeCalled: res.data?.data?.bridge_called,
                                    bridgeProofs: res.data?.data?.bridge?.proofs,
                                    settledOrders: res.data?.data?.settled_orders,
                                    requestedAlz: res.data?.data?.requested_alz_amount,
                                    deliveredAlz: res.data?.data?.delivered_alz_amount,
                                    timestamp: new Date().toISOString()
                                  });
                                }

                                if (!res.data?.ok) {
                                  const errorMsg = res.data?.error?.message || 'Erro ao simular pagamento';
                                  const errorCode = res.data?.error?.code || '';
                                  const downstream = res.data?.downstream;

                                  // Build detailed error message
                                  let detailMsg = errorMsg;
                                  if (downstream) {
                                    detailMsg = `${errorMsg} (${downstream.source} HTTP ${downstream.httpStatus})`;
                                  }

                                  if (debugMode && errorCode) {
                                    toast.error(`Falha na entrega: ${detailMsg}. Tente novamente.`);
                                  } else {
                                    toast.error(`Falha na entrega: ${errorMsg}. Tente novamente.`);
                                  }

                                  // Show error details in debug UI
                                  if (debugMode && (res.data?.debug || downstream)) {
                                    setDebugLastResponse({
                                      path: 'alzSimulatePix',
                                      error: res.data?.error,
                                      errorCode,
                                      downstream: downstream || { source: 'unknown' },
                                      bridgeDebug: res.data?.debug,
                                      timestamp: new Date().toISOString()
                                    });
                                  }
                                  return;
                                }

                                const deliveredData = res.data?.data || {};
                                const requested = deliveredData?.requested_alz_amount ? BigInt(deliveredData.requested_alz_amount) : BigInt(pixPayment.requestedAlzAmount);
                                const delivered = deliveredData?.delivered_alz_amount ? BigInt(deliveredData.delivered_alz_amount) : requested;
                                const nicDelivered = deliveredData?.buyer_nic || pixPayment.buyerNic;

                                // Validate amount match
                                if (delivered !== requested) {
                                  console.warn('[DEBUG_MARKET_PIX] Amount mismatch! Requested:', requested.toString(), 'Delivered:', delivered.toString());
                                  toast.error(`⚠️ Aviso: Quantidades não correspondem. Solicitado: ${(requested / 1_000_000_000n).toString()}B, Entregue: ${(delivered / 1_000_000_000n).toString()}B. Contate o suporte.`);
                                  return;
                                }

                                // Validate bridge was actually called
                                if (!deliveredData.bridge_called) {
                                  console.warn('[DEBUG_MARKET_PIX] Bridge was not called!');
                                  toast.error('Aviso: Bridge não foi chamado. Pagamento pode não ter sido entregue. Contate o suporte.');
                                  return;
                                }

                                const deliveredBillions = (delivered / 1_000_000_000n).toString();
                                toast.success(`Pagamento simulado com sucesso! ${deliveredBillions}B ALZ enviados para ${nicDelivered}.`);

                                // CRITICAL: Invalidate both price history and market stats queries
                                if (queryClient) {
                                  queryClient.invalidateQueries({ queryKey: ['alz-price-history-v1'] });
                                  queryClient.invalidateQueries({ queryKey: ['alz-market-stats-v1'] });
                                }

                                if (debugMode) {
                                  console.log('[DEBUG_MARKET_PIX] Settlement completo:', {
                                    requested: requested.toString(),
                                    delivered: delivered.toString(),
                                    buyerNic: nicDelivered,
                                    bridgeCalled: deliveredData.bridge_called,
                                    settledOrders: deliveredData?.settled_orders,
                                    warnings: deliveredData?.warnings,
                                    proofs: deliveredData?.bridge?.proofs
                                  });
                                }

                                // Navigate after brief delay to show toast
                                setTimeout(() => {
                                  navigate(createPageUrl('MinhaConta'));
                                }, 2000);
                              } catch (error) {
                                console.error('Erro ao simular pagamento:', error);
                                const errorMsg = (error?.response?.data?.error?.message || error?.response?.data?.error || error?.message || 'Erro ao simular pagamento').substring(0, 100);
                                toast.error(`Falha na entrega: ${errorMsg}. Tente novamente.`);
                              }
                            }}
            variant="secondary"
            className="w-full"
            >
            🧪 Simular Confirmação de Pagamento (Teste)
            </MetalButton>
            </div>
            )}
          </GlowCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070B] p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/mercado')}
          className="flex items-center gap-2 text-[#19E0FF] hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Mercado
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Comprar ALZ</h1>
          <p className="text-[#A9B2C7] text-lg">
            Selecione a quantidade de ALZ e veja o preço conforme a liquidez do mercado
          </p>
        </div>

        {/* Resumo do Mercado */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GlowCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#19E0FF]" />
              <span className="text-[#A9B2C7] text-sm">Ofertas Ativas</span>
            </div>
            <div className="text-white font-bold text-2xl">
              {market?.activeSellCount ?? 0}
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#19E0FF]" />
              <span className="text-[#A9B2C7] text-sm">Preço Mínimo Atual (1B ALZ)</span>
            </div>
            <div className="text-[#19E0FF] font-bold text-2xl">
              {market?.minPricePerBillionBRL !== null && market?.minPricePerBillionBRL !== undefined 
                ? formatBRL(market.minPricePerBillionBRL) 
                : 'Sem dados'}
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-[#F7CE46]" />
              <span className="text-[#A9B2C7] text-sm">Preço Médio Recente (1B ALZ)</span>
            </div>
            <div className="text-[#F7CE46] font-bold text-2xl">
              {market?.avgRecentPricePerBillionBRL !== null && market?.avgRecentPricePerBillionBRL !== undefined 
                ? formatBRL(market.avgRecentPricePerBillionBRL) 
                : 'Sem dados'}
            </div>
          </GlowCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
           {/* Gráfico de Histórico */}
           <GlowCard className="p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-2xl font-bold text-white">Histórico de Preço (ALZ → BRL)</h2>
               <div className="flex gap-2">
                 {[
                   { label: '7D', days: 7 },
                   { label: '30D', days: 30 },
                   { label: '1A', days: 365 }
                 ].map(period => (
                   <button
                     key={period.days}
                     onClick={() => setHistoryPeriod(period.days)}
                     className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                       historyPeriod === period.days
                         ? 'bg-[#19E0FF] text-[#05070B]'
                         : 'bg-[#0C121C] text-[#A9B2C7] hover:text-white border border-[#19E0FF]/20'
                     }`}
                   >
                     {period.label}
                   </button>
                 ))}
               </div>
             </div>

             {loadingHistory ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-[#19E0FF] animate-spin mx-auto mb-3" />
                  <p className="text-[#A9B2C7]">Carregando histórico...</p>
                </div>
              </div>
             ) : historyDataWithError?.error ? (
              <div className="h-[300px] flex items-center justify-center flex-col gap-4">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-[#FF4B6A] mx-auto mb-3" />
                  <p className="text-[#FF4B6A] font-bold mb-3">Não foi possível carregar o histórico</p>
                  <p className="text-[#A9B2C7] text-sm mb-4">Tente novamente em alguns momentos.</p>
                </div>
                <MetalButton
                  onClick={() => refetchHistory()}
                  size="sm"
                  variant="secondary"
                >
                  🔄 Atualizar Histórico
                </MetalButton>
              </div>
             ) : !historyData?.points || historyData.points.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center flex-col gap-4">
                <div className="text-center">
                  <p className="text-[#A9B2C7] text-lg mb-2">Sem dados de histórico disponíveis</p>
                  <p className="text-[#A9B2C7] text-sm">Os gráficos aparecerão após as primeiras negociações</p>
                </div>
                <MetalButton
                  onClick={() => refetchHistory()}
                  size="sm"
                  variant="secondary"
                >
                  🔄 Atualizar Histórico
                </MetalButton>
              </div>
             ) : (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historyData.points}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#19E0FF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#19E0FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#19E0FF/10" />
                    <XAxis 
                      dataKey="ts" 
                      stroke="#A9B2C7"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#A9B2C7"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'BRL por 1B ALZ', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#0C121C',
                        border: '1px solid #19E0FF',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [formatBRL(value), 'Preço Médio']}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgPricePer1bBrl" 
                      stroke="#19E0FF" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {(historyData?.points?.length || 0) > 0 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#19E0FF]/20">
                    {debugMode && (
                      <div className="text-xs text-[#A9B2C7]">
                        <p>📊 Pontos: {historyData.points?.length || 0} | Trades: {historyData.totalTrades || 0}</p>
                      </div>
                    )}
                    <MetalButton
                      onClick={() => refetchHistory()}
                      size="sm"
                      variant="secondary"
                      className="ml-auto"
                    >
                      🔄 Atualizar Histórico
                    </MetalButton>
                  </div>
                )}
              </div>
            )}
           </GlowCard>

          {/* Painel de Compra */}
          <GlowCard className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Realizar Compra</h2>

            <div className="mb-8">
              <label className="text-[#A9B2C7] text-sm mb-3 block">Quantidade de ALZ</label>
              <Slider
                value={[selectedAlzAmount]}
                onValueChange={(values) => setSelectedAlzAmount(values[0])}
                min={10_000_000}
                max={100_000_000_000}
                step={100_000_000}
                className="mb-4"
              />
              <div className="text-center">
                <div className="text-white font-bold text-3xl mb-1">
                  {formatAlz(selectedAlzAmount)}
                </div>
                <div className="text-[#A9B2C7] text-sm">
                  Você está comprando: {(selectedAlzAmount / 1_000_000_000).toFixed(2)} bilhões de ALZ
                </div>
              </div>
            </div>

            {/* Cotação */}
            {loadingQuote ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-[#19E0FF] animate-spin mx-auto" />
                <p className="text-[#A9B2C7] mt-2">Calculando cotação...</p>
              </div>
            ) : quote ? (
              <div className="space-y-4 mb-6">
                {!quote.isFullyAvailable && (
                  <div className="bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg p-4">
                    <p className="text-[#FF4B6A] text-sm">
                      ⚠️ Liquidez insuficiente para este valor. Ajuste a quantidade de ALZ ou aguarde novas ofertas.
                      <br />
                      Disponível: {formatAlz(quote.availableAlzAmount)}
                    </p>
                  </div>
                )}

                <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#A9B2C7]">Preço Total:</span>
                      <span className="text-[#19E0FF] font-bold text-2xl">
                        {formatBRL(quote.totalPriceBRL)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ladder de Preços */}
                  {quote.ladder && quote.ladder.length > 0 && (
                    <div className="pt-4 border-t border-[#19E0FF]/20">
                      <h4 className="text-[#A9B2C7] text-sm mb-3 font-semibold">Composição do Preço:</h4>
                      <div className="space-y-2 mb-4">
                        {quote.ladder.map((level, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm bg-[#05070B] p-3 rounded-lg">
                            <span className="text-white">
                              {formatAlz(level.matchedAlz)} × {formatBRL(level.pricePerBillionBRL)}/B
                            </span>
                            <span className="text-[#19E0FF] font-bold">
                              {formatBRL((level.matchedAlz / 1_000_000_000) * level.pricePerBillionBRL)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-[#19E0FF]/10 flex justify-between items-center">
                        <span className="text-[#A9B2C7] text-sm">Preço Médio por 1B ALZ:</span>
                        <span className="text-white font-bold">
                          {formatBRL(quote.averagePricePerBillionBRL)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* NIC Validation */}
            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Personagem Destinatário</h3>
              
              <div className="mb-4">
                <label className="text-[#A9B2C7] text-sm mb-2 block">
                  NIC do Personagem (obrigatório)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={buyerNic}
                    onChange={(e) => setBuyerNic(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !validatingNic) {
                        handleValidateNic();
                      }
                    }}
                    placeholder="Ex: MeuPersonagem"
                    maxLength={16}
                    className="flex-1 bg-[#05070B] border border-[#19E0FF]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#19E0FF]"
                    disabled={validatingNic}
                  />
                  <MetalButton
                    onClick={handleValidateNic}
                    loading={validatingNic}
                    disabled={!buyerNic.trim() || validatingNic}
                  >
                    Validar NIC
                  </MetalButton>
                </div>
              </div>

              {validatedCharacter && validatedCharacter._error && (
                <div className="p-4 rounded-lg border bg-[#F7CE46]/10 border-[#F7CE46]/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#F7CE46] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-white font-bold mb-1">
                        Validação do personagem indisponível
                      </div>
                      <p className="text-[#A9B2C7] text-sm mt-2">
                        A validação do personagem está temporariamente indisponível. 
                        Tente novamente em alguns minutos. Se você é admin, verifique a integração do servidor (Bridge).
                      </p>
                      {/* Admin details (only show error code if admin - will implement via auth check) */}
                    </div>
                  </div>
                </div>
              )}

              {validatedCharacter && !validatedCharacter._error && (
                <div className={`p-4 rounded-lg border ${
                  validatedCharacter.isOnline 
                    ? 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
                    : 'bg-[#19E0FF]/10 border-[#19E0FF]/30'
                }`}>
                  <div className="flex items-start gap-3">
                    {validatedCharacter.isOnline ? (
                      <AlertCircle className="w-5 h-5 text-[#FF4B6A] flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-white font-bold mb-1">
                        {validatedCharacter.name}
                        {validatedCharacter.level && ` • Lv. ${validatedCharacter.level}`}
                        {validatedCharacter.class && ` • ${validatedCharacter.class}`}
                      </div>
                      <div className={validatedCharacter.isOnline ? 'text-[#FF4B6A]' : 'text-[#19E0FF]'}>
                        Status: {validatedCharacter.isOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}
                      </div>
                      {validatedCharacter.isOnline ? (
                        <p className="text-[#FF4B6A] text-sm mt-2">
                          ⚠️ O personagem precisa estar OFFLINE para receber ALZ no correio. 
                          Deslogue do jogo e valide novamente.
                        </p>
                      ) : (
                        <p className="text-[#A9B2C7] text-sm mt-2">
                          ✓ O ALZ será entregue no correio deste personagem.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!validatedCharacter && (
                <p className="text-[#A9B2C7] text-sm">
                  Digite o nome exato do seu personagem e valide antes de gerar o PIX. 
                  O personagem deve estar OFFLINE para receber ALZ.
                </p>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Forma de Pagamento</h3>
              <div className="flex items-center gap-3 p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                <div className="w-12 h-12 bg-[#19E0FF] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-[#05070B]" />
                </div>
                <div>
                  <div className="text-white font-bold">PIX</div>
                  <div className="text-[#A9B2C7] text-sm">Pagamento instantâneo</div>
                </div>
              </div>
              <p className="text-[#A9B2C7] text-sm mt-3">
                O pagamento será processado via PIX. Após a confirmação, os ALZ serão entregues no correio do personagem validado.
              </p>
            </div>

            <MetalButton
              onClick={handleGeneratePix}
              loading={generatingPix}
              disabled={
                !quote || 
                !quote.isFullyAvailable || 
                loadingQuote ||
                !validatedCharacter ||
                validatedCharacter._error ||
                validatedCharacter.isOnline
              }
              className="w-full"
              size="lg"
            >
              {!validatedCharacter ? 'Valide o NIC Primeiro' :
               validatedCharacter._error ? 'Validação Indisponível' :
               validatedCharacter.isOnline ? 'Personagem Online - Deslogue' :
               'Gerar PIX e Continuar'}
            </MetalButton>
            
            {!validatedCharacter && (
              <p className="text-[#A9B2C7] text-xs text-center mt-2">
                É necessário validar o NIC do personagem destinatário antes de gerar o PIX
              </p>
            )}
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
                <div className="flex gap-2">
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
                  <MetalButton
                    onClick={() => {
                      if (debugLastResponse?.bridgeProofs) {
                        const proofs = debugLastResponse.bridgeProofs;
                        toast.success(`Bridge was called ${proofs.length} times`);
                      } else {
                        toast.info('No bridge proofs yet');
                      }
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    Ver Bridge Proof
                  </MetalButton>
                </div>
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
                      {debugLastResponse.reqSummary.nicLength && (
                        <div>NIC length: {debugLastResponse.reqSummary.nicLength}</div>
                      )}
                      {debugLastResponse.reqSummary.totalAlz && (
                        <>
                          <div>totalAlz: {debugLastResponse.reqSummary.totalAlz}</div>
                          <div>pricePerBillionBRL: {debugLastResponse.reqSummary.pricePerBillionBRL}</div>
                        </>
                      )}
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
                <p className="text-[#A9B2C7] text-sm">Nenhuma requisição capturada ainda. Tente validar um NIC.</p>
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