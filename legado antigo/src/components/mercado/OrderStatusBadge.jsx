import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, XCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

const statusConfig = {
  PENDING_PAYMENT: {
    label: 'Aguardando pagamento',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock
  },
  PAID: {
    label: 'Pago',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: Check
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: CheckCircle2
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle
  },
  REFUNDED: {
    label: 'Reembolsado',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: RefreshCw
  }
};

export default function OrderStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING_PAYMENT;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}