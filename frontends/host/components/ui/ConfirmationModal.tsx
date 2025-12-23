import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
    confirmButtonText?: string;
    confirmButtonVariant?: 'danger' | 'primary' | 'success';
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
    const { 
        isOpen, 
        onClose, 
        onConfirm, 
        title, 
        children,
        confirmButtonText = 'Подтвердить',
        confirmButtonVariant = 'primary'
    } = props;
    
    const isMobile = useIsMobile();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen && !isMobile) { // Only for desktop modal
            document.addEventListener('keydown', handleKeyDown);
            modalRef.current?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, isMobile]);
    
    const portalRoot = typeof document !== 'undefined' ? document.getElementById('root') : null;

    if (!isOpen || !portalRoot) {
        return null;
    }

    if (isMobile) {
        return <BottomSheet {...props} />;
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

    const modalContent = (
         <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 sm:p-8 transform transition-all focus:outline-none"
            >
                 <div className="text-center">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="mt-3 sm:mt-5">
                        <h2 id="modal-title" className="text-xl font-bold text-gray-900">{title}</h2>
                        <div className="mt-4 text-base text-gray-600 text-center">
                            {children}
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto mt-3 sm:mt-0 px-6 py-2.5 text-base font-semibold rounded-lg transition-all shadow-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`w-full sm:w-auto px-6 py-2.5 text-base font-semibold rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonClasses}`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
                
                 <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Закрыть"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, portalRoot);
};

export default React.memo(ConfirmationModal);