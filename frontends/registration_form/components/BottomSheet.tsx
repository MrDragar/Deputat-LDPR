import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    const sheetRef = useRef<HTMLDivElement>(null);

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

    const portalRoot = document.body;
    if (!portalRoot) return null;

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? '' : 'pointer-events-none'}`}
            style={{ 
                backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
                transition: 'background-color 300ms ease-in-out'
            }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
        >
            <div
                ref={sheetRef}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
                className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ willChange: 'transform' }}
            >
                <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                             <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-600">
                                <AlertTriangle className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <h2 id="sheet-title" className="text-xl font-bold text-gray-900">{title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                            aria-label="Закрыть"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="text-base text-gray-600">
                        {children}
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-red-600 text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
                        >
                            Подтвердить
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-6 py-3 text-base font-semibold rounded-lg transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};

export default BottomSheet;