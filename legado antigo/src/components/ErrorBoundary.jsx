import React from 'react';
import { AlertCircle } from 'lucide-react';
import MetalButton from '@/components/ui/MetalButton';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#05070B] flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-[#0C121C] border border-[#FF4B6A]/30 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Algo deu errado
            </h2>
            <p className="text-[#A9B2C7] mb-6">
              Não foi possível carregar esta página. Tente novamente.
            </p>
            <MetalButton
              onClick={() => window.location.reload()}
              variant="primary"
              className="w-full"
            >
              Recarregar página
            </MetalButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;