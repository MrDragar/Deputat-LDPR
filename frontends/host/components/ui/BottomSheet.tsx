import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmButtonText?: string;
    confirmButtonVariant?: 'danger' | 'primary' | 'success';
}

const BottomSheet: React.FC<BottomSheetProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    children,
    confirmButtonText = 'Подтвердить',
    confirmButtonVariant = 'primary'
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const portalRoot = typeof document !== 'undefined' ? document.getElementById('root') : null;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleKeyDown);
            sheetRef.current?.focus();
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !portalRoot) {
        return null;
    }

    const variantStyles = {
        primary: {
            Icon: CheckCircle,
            iconBg: 'bg-blue-600',
            buttonClasses: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        },
        success: {
            Icon: CheckCircle,
            iconBg: 'bg-green-600',
            buttonClasses: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        },
        danger: {
            Icon: AlertTriangle,
            iconBg: 'bg-red-600',
            buttonClasses: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        },
    };

    const currentVariant = variantStyles[confirmButtonVariant || 'primary'];
    const { Icon, iconBg, buttonClasses } = currentVariant;

    const sheetContent = (
        <div
            className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ease-in-out"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
        >
            <div
                ref={sheetRef}
                tabIndex={-1}
                className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out transform focus:outline-none ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ willChange: 'transform' }}
            >
                <div className="relative p-4 sm:p-6">
                     <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label="Закрыть"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <div className="text-center">
                        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <div className="mt-3">
                            <h2 id="sheet-title" className="text-xl font-bold text-gray-900">{title}</h2>
                        </div>
                    </div>

                    <div className="mt-4 text-base text-gray-600 text-center">
                        {children}
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3">
                         <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-6 py-3 text-base font-semibold rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Отмена
                        </button>
                         <button
                            type="button"
                            onClick={onConfirm}
                            className={`w-full px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClasses}`}
                        >
                            {confirmButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
     return createPortal(sheetContent, portalRoot);
};

export default React.memo(BottomSheet);