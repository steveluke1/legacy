import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

const statusSteps = [
  { key: 'PENDING_PAYMENT', label: 'Contrato criado' },
  { key: 'PAID', label: 'Pagamento confirmado' },
  { key: 'IN_PROGRESS', label: 'Serviço em andamento' },
  { key: 'COMPLETED', label: 'Concluído' }
];

export default function ServiceContractTimeline({ currentStatus }) {
  const currentIndex = statusSteps.findIndex(s => s.key === currentStatus);

  return (
    <div className="space-y-4">
      {statusSteps.map((step, idx) => {
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={step.key} className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isActive 
                ? 'bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8]' 
                : 'bg-[#A9B2C7]/20'
            }`}>
              {isActive ? (
                <CheckCircle className="w-6 h-6 text-[#05070B]" />
              ) : (
                <Clock className="w-5 h-5 text-[#A9B2C7]" />
              )}
            </div>
            <div className="flex-1 pt-2">
              <div className={`font-bold ${isActive ? 'text-white' : 'text-[#A9B2C7]'}`}>
                {step.label}
              </div>
              {isCurrent && (
                <div className="text-[#19E0FF] text-sm mt-1">Status atual</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}