
import React, { useEffect, useRef } from 'react';
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

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 p-6 sm:p-8 transform transition-all"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <h2 id="modal-title" className="text-xl font-bold text-gray-900">{title}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label="Закрыть"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="mt-4 text-base text-gray-600">
                    {children}
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
                        className="w-full sm:w-auto px-6 py-2.5 text-base font-semibold rounded-lg transition-all shadow-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
