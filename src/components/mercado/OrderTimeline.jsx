import React from 'react';
import { Check, Clock, Package, CheckCircle2 } from 'lucide-react';

const stepConfig = {
  created: {
    icon: Clock,
    label: 'Pedido criado',
    color: '#19E0FF'
  },
  paid: {
    icon: Check,
    label: 'Pagamento aprovado',
    color: '#10B981'
  },
  delivering: {
    icon: Package,
    label: 'Entrega in-game',
    color: '#F7CE46'
  },
  completed: {
    icon: CheckCircle2,
    label: 'Pedido concluído',
    color: '#9146FF'
  }
};

export default function OrderTimeline({ currentStatus }) {
  const steps = ['created', 'paid', 'delivering', 'completed'];
  const currentIndex = steps.indexOf(currentStatus);
  
  return (
    <div className="relative">
      {/* Connection line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#19E0FF]/20" />
      
      {/* Active progress line */}
      <div 
        className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#19E0FF] to-[#0097d8] transition-all duration-500"
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      />
      
      <div className="relative grid grid-cols-4 gap-2">
        {steps.map((step, index) => {
          const config = stepConfig[step];
          const Icon = config.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10 transition-all
                  ${isActive 
                    ? 'bg-gradient-to-br from-[#0097d8] to-[#19E0FF] shadow-lg shadow-[#19E0FF]/50' 
                    : 'bg-[#0C121C] border-2 border-[#19E0FF]/20'
                  }
                  ${isCurrent ? 'ring-4 ring-[#19E0FF]/30' : ''}
                `}
              >
                <Icon 
                  className={`w-5 h-5 ${isActive ? 'text-[#05070B]' : 'text-[#A9B2C7]'}`}
                />
              </div>
              
              <p className={`
                text-xs text-center font-medium
                ${isActive ? 'text-white' : 'text-[#A9B2C7]'}
              `}>
                {config.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}