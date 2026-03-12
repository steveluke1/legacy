import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Loader2, AlertCircle, Package, CreditCard } from 'lucide-react';

const statusConfig = {
  created: { label: 'Criado', icon: Clock, color: 'text-[#A9B2C7]' },
  awaiting_pix: { label: 'Aguardando Pagamento', icon: CreditCard, color: 'text-[#F7CE46]' },
  paid: { label: 'Pago', icon: CheckCircle, color: 'text-[#10B981]' },
  delivering: { label: 'Em Entrega', icon: Loader2, color: 'text-[#19E0FF]', spin: true },
  delivered: { label: 'Entregue', icon: Package, color: 'text-[#10B981]' },
  in_review: { label: 'Em Revisão', icon: AlertCircle, color: 'text-[#F7CE46]' },
  cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'text-[#FF4B6A]' },
  failed: { label: 'Falhou', icon: AlertCircle, color: 'text-[#FF4B6A]' }
};

export default function OrderStatusTimeline({ status, timeline = [] }) {
  const currentStatus = statusConfig[status] || statusConfig.created;
  const Icon = currentStatus.icon;

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center gap-3 p-4 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
        <div className={`w-10 h-10 rounded-full bg-[#19E0FF]/10 flex items-center justify-center ${currentStatus.color}`}>
          <Icon className={`w-5 h-5 ${currentStatus.spin ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <p className="text-xs text-[#A9B2C7]">Status atual</p>
          <p className={`text-lg font-bold ${currentStatus.color}`}>{currentStatus.label}</p>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-[#A9B2C7] font-semibold">Histórico</p>
          <div className="space-y-2">
            {timeline.map((event, index) => {
              const eventConfig = statusConfig[event.type] || { label: event.type, icon: Clock, color: 'text-[#A9B2C7]' };
              const EventIcon = eventConfig.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-[#0C121C]/50 rounded"
                >
                  <EventIcon className={`w-4 h-4 mt-0.5 ${eventConfig.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{eventConfig.label}</p>
                    <p className="text-xs text-[#A9B2C7]">
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}