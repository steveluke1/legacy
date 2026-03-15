import React from 'react';
import { AlertCircle } from 'lucide-react';
import MetalButton from './MetalButton';

class ErrorBoundary extends React.Component {
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
        <div className="min-h-screen bg-[#05070B] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0C121C] border border-[#FF4B6A]/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Algo deu errado
            </h2>
            <p className="text-[#A9B2C7] mb-6">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <MetalButton
              onClick={() => window.location.reload()}
              variant="primary"
              className="w-full"
            >
              Recarregar Página
            </MetalButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;