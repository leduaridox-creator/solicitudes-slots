import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-white border-l-4 border-green-500';
      case 'error': return 'bg-white border-l-4 border-red-500';
      default: return 'bg-white border-l-4 border-blue-500';
    }
  };

  return (
    <div className={`w-full min-w-[320px] max-w-[420px] shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-up ${getStyles()}`}>
      <div className="flex w-full items-start p-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">{toast.title}</p>
          <p className="mt-1 text-sm text-gray-500">{toast.message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => onDismiss(toast.id)}
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-0 right-0 z-50 flex w-full max-w-[420px] flex-col items-stretch gap-4 p-4 pointer-events-none sm:p-6">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  );
};