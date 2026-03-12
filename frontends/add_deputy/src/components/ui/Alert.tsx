import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning';

interface AlertProps {
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-600',
    iconColorClass: 'text-green-600',
    focusRingOffsetClass: 'focus:ring-offset-green-600',
  },
  error: {
    icon: AlertTriangle,
    bgClass: 'bg-red-600',
    iconColorClass: 'text-red-600',
    focusRingOffsetClass: 'focus:ring-offset-red-600',
  },
  warning: {
    icon: Info,
    bgClass: 'bg-amber-500',
    iconColorClass: 'text-amber-500',
    focusRingOffsetClass: 'focus:ring-offset-amber-500',
  },
};

const Alert: React.FC<AlertProps> = ({ type, title, message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const portalRoot = document.getElementById('root');

  const handleClose = React.useCallback(() => {
    setIsVisible(false);
    // Wait for animation to finish before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Duration should match animation out
  }, [onClose]);

  useEffect(() => {
    // Animate in
    const inTimer = setTimeout(() => setIsVisible(true), 10);

    const outTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
        clearTimeout(inTimer);
        clearTimeout(outTimer);
    }
  }, [duration, handleClose]);

  if (!portalRoot) return null;

  const { icon: Icon, bgClass, iconColorClass, focusRingOffsetClass } = alertConfig[type];

  return createPortal(
    <div
      role="alert"
      className={`fixed top-4 left-1/2 -translate-x-1/2 sm:top-6 sm:left-auto sm:right-6 sm:translate-x-0 z-[100] w-11/12 max-w-sm sm:w-full rounded-xl p-4 shadow-lg transition-all duration-300 ease-in-out ${bgClass} ${isVisible ? 'translate-y-0 opacity-100 sm:translate-x-0' : '-translate-y-12 opacity-0 sm:translate-y-0 sm:translate-x-full'}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <Icon className={`h-6 w-6 ${iconColorClass}`} aria-hidden="true" />
          </div>
        </div>
        <div className="ml-3 flex-1 pt-0.5">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/90">{message}</p>
        </div>
        <div className="ml-auto pl-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className={`inline-flex rounded-full p-1.5 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white ${focusRingOffsetClass}`}
            >
              <span className="sr-only">Закрыть</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default Alert;