import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, RefreshCcw, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BridgeAlzTest() {
  // LOCK state
  const [lockForm, setLockForm] = useState({
    sellerUserNum: '',
    amount: '',
    idempotencyKey: '',
  });
  const [lockLoading, setLockLoading] = useState(false);
  const [lockResult, setLockResult] = useState(null);

  // RELEASE state
  const [releaseForm, setReleaseForm] = useState({
    idempotencyKey: '',
  });
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseResult, setReleaseResult] = useState(null);

  // SETTLE state
  const [settleForm, setSettleForm] = useState({
    idempotencyKey: '',
    buyerCharacterIdx: '',
  });
  const [settleLoading, setSettleLoading] = useState(false);
  const [settleResult, setSettleResult] = useState(null);

  // HEALTH state
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState(null);

  const handleHealth = async () => {
    setHealthLoading(true);
    setHealthResult(null);

    try {
      const response = await base44.functions.invoke('bridgeHealth', {});
      setHealthResult(response.data);
    } catch (error) {
      setHealthResult({
        ok: false,
        error: {
          code: 'INVOKE_ERROR',
          message: error.message || 'Erro ao invocar função',
          detail: error.response?.data || error.toString(),
        },
      });
    } finally {
      setHealthLoading(false);
    }
  };

  const handleLock = async (e) => {
    e.preventDefault();
    setLockLoading(true);
    setLockResult(null);

    try {
      const response = await base44.functions.invoke('bridgeAlzLock', {
        sellerUserNum: parseInt(lockForm.sellerUserNum, 10),
        amount: lockForm.amount,
        idempotencyKey: lockForm.idempotencyKey,
      });

      setLockResult(response.data);
    } catch (error) {
      setLockResult({
        ok: false,
        error: {
          code: 'INVOKE_ERROR',
          message: error.message || 'Erro ao invocar função',
          detail: error.response?.data || error.toString(),
          status: error.response?.status,
        },
      });
    } finally {
      setLockLoading(false);
    }
  };

  const handleRelease = async (e) => {
    e.preventDefault();
    setReleaseLoading(true);
    setReleaseResult(null);

    try {
      const response = await base44.functions.invoke('bridgeAlzRelease', {
        idempotencyKey: releaseForm.idempotencyKey,
      });

      setReleaseResult(response.data);
    } catch (error) {
      setReleaseResult({
        ok: false,
        error: {
          code: 'INVOKE_ERROR',
          message: error.message || 'Erro ao invocar função',
          detail: error.response?.data || error.toString(),
          status: error.response?.status,
        },
      });
    } finally {
      setReleaseLoading(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setSettleLoading(true);
    setSettleResult(null);

    try {
      const response = await base44.functions.invoke('bridgeAlzSettle', {
        idempotencyKey: settleForm.idempotencyKey,
        buyerCharacterIdx: parseInt(settleForm.buyerCharacterIdx, 10),
      });

      setSettleResult(response.data);
    } catch (error) {
      setSettleResult({
        ok: false,
        error: {
          code: 'INVOKE_ERROR',
          message: error.message || 'Erro ao invocar função',
          detail: error.response?.data || error.toString(),
          status: error.response?.status,
        },
      });
    } finally {
      setSettleLoading(false);
    }
  };

  const renderResult = (result) => {
    if (!result) return null;

    const isSuccess = result.ok === true;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border mt-4 ${
          isSuccess
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`font-bold mb-2 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess ? 'Sucesso' : 'Erro'}
            </p>
            <pre className="text-xs text-[#A9B2C7] overflow-x-auto bg-[#05070B] p-3 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#05070B] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Teste Bridge ALZ</h1>
            <p className="text-[#A9B2C7]">
              Ferramenta interna para validar LOCK / RELEASE / SETTLE via Bridge (SQL Server).
            </p>
          </motion.div>

          {/* HEALTH Card (sempre visível) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlowCard className="p-6" glowColor="#1A9FE8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A9FE8]/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#1A9FE8]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">HEALTH CHECK</h2>
                </div>
                <MetalButton
                  onClick={handleHealth}
                  loading={healthLoading}
                  disabled={healthLoading}
                  size="sm"
                >
                  {healthLoading ? 'Verificando…' : 'Testar Bridge'}
                </MetalButton>
              </div>
              <p className="text-[#A9B2C7] text-sm mb-2">
                Verifica se o Bridge está acessível via GET /health
              </p>
              {renderResult(healthResult)}
            </GlowCard>
          </motion.div>

          {/* Grid de Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* LOCK Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlowCard className="p-6" glowColor="#19E0FF">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#19E0FF]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">LOCK</h2>
                </div>

                <form onSubmit={handleLock} className="space-y-4">
                  <div>
                    <Label className="text-white text-sm">Seller UserNum</Label>
                    <Input
                      type="number"
                      value={lockForm.sellerUserNum}
                      onChange={(e) =>
                        setLockForm({ ...lockForm, sellerUserNum: e.target.value })
                      }
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: 123"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm">Amount (string)</Label>
                    <Input
                      type="text"
                      value={lockForm.amount}
                      onChange={(e) => setLockForm({ ...lockForm, amount: e.target.value })}
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: 100000000"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm">Idempotency Key</Label>
                    <Input
                      type="text"
                      value={lockForm.idempotencyKey}
                      onChange={(e) =>
                        setLockForm({ ...lockForm, idempotencyKey: e.target.value })
                      }
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: lock_test_001"
                      required
                      minLength={8}
                      maxLength={80}
                    />
                  </div>

                  <MetalButton
                    type="submit"
                    loading={lockLoading}
                    disabled={lockLoading}
                    className="w-full"
                  >
                    {lockLoading ? 'Processando…' : 'Executar LOCK'}
                  </MetalButton>
                </form>

                {renderResult(lockResult)}
              </GlowCard>
            </motion.div>

            {/* RELEASE Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlowCard className="p-6" glowColor="#F7CE46">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#F7CE46]/20 flex items-center justify-center">
                    <Unlock className="w-5 h-5 text-[#F7CE46]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">RELEASE</h2>
                </div>

                <form onSubmit={handleRelease} className="space-y-4">
                  <div>
                    <Label className="text-white text-sm">Idempotency Key</Label>
                    <Input
                      type="text"
                      value={releaseForm.idempotencyKey}
                      onChange={(e) =>
                        setReleaseForm({ ...releaseForm, idempotencyKey: e.target.value })
                      }
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: lock_test_001"
                      required
                      minLength={8}
                      maxLength={80}
                    />
                  </div>

                  <MetalButton
                    type="submit"
                    loading={releaseLoading}
                    disabled={releaseLoading}
                    className="w-full"
                    variant="secondary"
                  >
                    {releaseLoading ? 'Processando…' : 'Executar RELEASE'}
                  </MetalButton>
                </form>

                {renderResult(releaseResult)}
              </GlowCard>
            </motion.div>

            {/* SETTLE Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlowCard className="p-6" glowColor="#1A9FE8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#1A9FE8]/20 flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-[#1A9FE8]" />
                  </div>
                  <h2 className="text-xl font-bold text-white">SETTLE</h2>
                </div>

                <form onSubmit={handleSettle} className="space-y-4">
                  <div>
                    <Label className="text-white text-sm">Idempotency Key</Label>
                    <Input
                      type="text"
                      value={settleForm.idempotencyKey}
                      onChange={(e) =>
                        setSettleForm({ ...settleForm, idempotencyKey: e.target.value })
                      }
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: lock_test_001"
                      required
                      minLength={8}
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <Label className="text-white text-sm">Buyer CharacterIdx</Label>
                    <Input
                      type="number"
                      value={settleForm.buyerCharacterIdx}
                      onChange={(e) =>
                        setSettleForm({ ...settleForm, buyerCharacterIdx: e.target.value })
                      }
                      className="mt-1 bg-[#0C121C] border-[#19E0FF]/20 text-white"
                      placeholder="Ex: 456"
                      required
                    />
                  </div>

                  <MetalButton
                    type="submit"
                    loading={settleLoading}
                    disabled={settleLoading}
                    className="w-full"
                    variant="honor"
                  >
                    {settleLoading ? 'Processando…' : 'Executar SETTLE'}
                  </MetalButton>
                </form>

                {renderResult(settleResult)}
              </GlowCard>
            </motion.div>
          </div>

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <GlowCard className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-bold mb-2">Instruções de Teste</h3>
                  <ul className="text-[#A9B2C7] text-sm space-y-1">
                    <li>• <strong>LOCK:</strong> Trava ALZ em escrow. Requer sellerUserNum válido e amount {'>'} 0.</li>
                    <li>• <strong>RELEASE:</strong> Libera ALZ do escrow de volta ao vendedor. Use o mesmo idempotencyKey do LOCK.</li>
                    <li>• <strong>SETTLE:</strong> Transfere ALZ do escrow para o comprador. Requer buyerCharacterIdx válido.</li>
                    <li>• <strong>Idempotency Key:</strong> Deve ter entre 8-80 caracteres. Use valores únicos para cada teste.</li>
                    <li>• <strong>Escrow UserNum:</strong> Configurado via secret ESCROW_USERNUM (backend gerencia automaticamente).</li>
                    <li>• <strong>Configuração:</strong> Certifique-se de que BRIDGE_BASE_URL, BRIDGE_API_KEY e ESCROW_USERNUM estão configurados nos secrets.</li>
                  </ul>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </RequireAuth>
  );
}