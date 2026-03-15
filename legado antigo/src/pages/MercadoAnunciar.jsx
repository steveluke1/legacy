import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, AlertCircle, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function MercadoAnunciar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    type: 'ALZ',
    alz_amount: '',
    item_name: '',
    item_description: '',
    quantity_units: '',
    price_brl: '',
    seller_notes: '',
    acceptTerms: false
  });

  useEffect(() => {
    if (user) {
      checkRMTTerms();
    }
  }, [user]);

  const checkRMTTerms = async () => {
    try {
      const termsResponse = await base44.functions.invoke('market_checkRMTTerms', {});
      if (termsResponse.data && !termsResponse.data.has_accepted) {
        navigate(createPageUrl('MercadoTermos') + '?return=MercadoAnunciar');
      }
    } catch (e) {
      console.error('Erro ao verificar termos:', e);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Selecione o tipo de anúncio';
    }

    if (formData.type === 'ALZ') {
      if (!formData.alz_amount || parseFloat(formData.alz_amount) <= 0) {
        newErrors.alz_amount = 'Informe a quantidade de ALZ';
      }
    } else {
      if (!formData.item_name?.trim()) {
        newErrors.item_name = 'Informe o nome do item';
      }
      if (!formData.item_description?.trim()) {
        newErrors.item_description = 'Informe a descrição do item';
      }
      if (!formData.quantity_units || parseFloat(formData.quantity_units) <= 0) {
        newErrors.quantity_units = 'Informe a quantidade';
      }
    }

    if (!formData.price_brl || parseFloat(formData.price_brl) <= 0) {
      newErrors.price_brl = 'Informe um preço válido em reais';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você precisa aceitar os Termos do Mercado ZIRON para continuar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await base44.functions.invoke('market_createListing', {
        type: formData.type,
        alz_amount: formData.type === 'ALZ' ? parseFloat(formData.alz_amount) : null,
        item_name: formData.type === 'ITEM' ? formData.item_name : null,
        item_description: formData.type === 'ITEM' ? formData.item_description : null,
        quantity_units: formData.type === 'ITEM' ? parseFloat(formData.quantity_units) : null,
        price_brl: parseFloat(formData.price_brl),
        seller_notes: formData.seller_notes
      });

      if (response.data && response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(createPageUrl('MercadoMinhasOfertas'));
        }, 2000);
      } else {
        setErrors({ general: response.data?.error || 'Erro ao criar anúncio. Tente novamente.' });
      }
    } catch (error) {
      setErrors({ general: 'Erro ao criar anúncio. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const isAlz = formData.type === 'ALZ';

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link 
          to={createPageUrl('Mercado')}
          className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao Mercado
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlowCard className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Criar novo anúncio</h1>
            <p className="text-[#A9B2C7] mb-6">
              Aqui você pode anunciar ALZ ou itens do CABAL ZIRON para vender em reais (BRL). 
              A entrega do ALZ ou do item é combinada dentro do jogo, diretamente entre você e o comprador.
            </p>

            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Anúncio criado com sucesso!</h3>
                <p className="text-[#A9B2C7]">
                  Ele já está visível no Mercado ZIRON. Redirecionando...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                    <span className="text-[#FF4B6A] text-sm">{errors.general}</span>
                  </div>
                )}

                {/* Type selection */}
                <div>
                  <Label className="text-white text-base mb-3 block">Tipo de anúncio</Label>
                  <RadioGroup value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                    <div className="flex items-center space-x-2 p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20 hover:border-[#19E0FF]/50 transition-colors">
                      <RadioGroupItem value="ALZ" id="alz" className="border-[#19E0FF]" />
                      <Label htmlFor="alz" className="text-white cursor-pointer flex-1">Vender ALZ</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20 hover:border-[#19E0FF]/50 transition-colors">
                      <RadioGroupItem value="ITEM" id="item" className="border-[#19E0FF]" />
                      <Label htmlFor="item" className="text-white cursor-pointer flex-1">Vender item</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* ALZ fields */}
                {isAlz && (
                  <div>
                    <Label className="text-white">Quantidade de ALZ</Label>
                    <Input
                      type="number"
                      value={formData.alz_amount}
                      onChange={(e) => handleChange('alz_amount', e.target.value)}
                      className={`mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white ${errors.alz_amount ? 'border-[#FF4B6A]' : ''}`}
                      placeholder="Ex: 1000000"
                    />
                    {errors.alz_amount && (
                      <p className="text-[#FF4B6A] text-sm mt-1">{errors.alz_amount}</p>
                    )}
                  </div>
                )}

                {/* ITEM fields */}
                {!isAlz && (
                  <>
                    <div>
                      <Label className="text-white">Nome do item</Label>
                      <Input
                        value={formData.item_name}
                        onChange={(e) => handleChange('item_name', e.target.value)}
                        className={`mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white ${errors.item_name ? 'border-[#FF4B6A]' : ''}`}
                        placeholder="Ex: Espada +15 / Craft Lendário"
                      />
                      {errors.item_name && (
                        <p className="text-[#FF4B6A] text-sm mt-1">{errors.item_name}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white">Descrição do item</Label>
                      <Textarea
                        value={formData.item_description}
                        onChange={(e) => handleChange('item_description', e.target.value)}
                        className={`mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white min-h-[100px] ${errors.item_description ? 'border-[#FF4B6A]' : ''}`}
                        placeholder="Descreva o item: nível, slots, opções, etc."
                      />
                      {errors.item_description && (
                        <p className="text-[#FF4B6A] text-sm mt-1">{errors.item_description}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-white">Quantidade / unidades</Label>
                      <Input
                        type="number"
                        value={formData.quantity_units}
                        onChange={(e) => handleChange('quantity_units', e.target.value)}
                        className={`mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white ${errors.quantity_units ? 'border-[#FF4B6A]' : ''}`}
                        placeholder="Ex: 1, 5, 10"
                      />
                      {errors.quantity_units && (
                        <p className="text-[#FF4B6A] text-sm mt-1">{errors.quantity_units}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Price */}
                <div>
                  <Label className="text-white">Preço total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price_brl}
                    onChange={(e) => handleChange('price_brl', e.target.value)}
                    className={`mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white ${errors.price_brl ? 'border-[#FF4B6A]' : ''}`}
                    placeholder="Ex: 50.00"
                  />
                  {errors.price_brl && (
                    <p className="text-[#FF4B6A] text-sm mt-1">{errors.price_brl}</p>
                  )}
                  {formData.price_brl && (isAlz ? formData.alz_amount : formData.item_name) && (
                    <p className="text-[#A9B2C7] text-sm mt-2">
                      Você está vendendo {isAlz ? `${parseFloat(formData.alz_amount || 0).toLocaleString()} ALZ` : formData.item_name} por R$ {parseFloat(formData.price_brl || 0).toFixed(2)}.
                    </p>
                  )}
                </div>

                {/* Seller notes */}
                <div>
                  <Label className="text-white">Observações para o comprador (opcional)</Label>
                  <Textarea
                    value={formData.seller_notes}
                    onChange={(e) => handleChange('seller_notes', e.target.value)}
                    className="mt-2 bg-[#05070B] border-[#19E0FF]/20 text-white min-h-[80px]"
                    placeholder="Ex: Vou entregar no canal CH1, mapa Bloody Ice. Fale comigo no jogo pelo nick XYZ."
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleChange('acceptTerms', checked)}
                    className="border-[#19E0FF]/50 data-[state=checked]:bg-[#19E0FF] data-[state=checked]:border-[#19E0FF] mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-[#A9B2C7] cursor-pointer">
                    Li e concordo com os Termos do Mercado ZIRON, incluindo regras de uso e políticas contra fraude.
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-[#FF4B6A] text-sm -mt-4">{errors.acceptTerms}</p>
                )}

                <GradientButton
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  Publicar anúncio
                </GradientButton>
              </form>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
    </RequireAuth>
  );
}