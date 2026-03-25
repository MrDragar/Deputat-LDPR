import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            modalRef.current?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }
    
    const portalRoot = document.getElementById('add-deputy-root') || document.body;
    if (!portalRoot) return null;

    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[100] flex flex-col sm:flex-row sm:items-center sm:justify-center justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity" 
                onClick={onClose}
            />
            <div 
                ref={modalRef}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white sm:rounded-xl rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-2xl w-full sm:max-w-md sm:m-4 p-6 sm:p-8 transform transition-all animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border-t border-gray-200 sm:border-none"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 hidden sm:flex">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <h2 id="modal-title" className="text-xl font-bold text-gray-900 w-full text-center sm:text-left">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="absolute right-4 top-6 sm:static sm:p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                        aria-label="Закрыть"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="mt-4 text-base text-gray-600 text-center sm:text-left">
                    {children}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-base font-semibold rounded-xl sm:rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 order-2 sm:order-1"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2.5 text-base font-semibold rounded-xl sm:rounded-lg transition-all shadow-sm bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 order-1 sm:order-2"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default ConfirmationModal;
