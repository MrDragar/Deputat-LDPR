import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Calendar } from '../ui/Calendar';
import MobileSingleDatePicker from './MobileSingleDatePicker';

interface SingleDateCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    disabledDates?: Date[];
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const SingleDateCalendarModal: React.FC<SingleDateCalendarModalProps> = ({ isOpen, onClose, selectedDate, onDateSelect, disabledDates }) => {
    const isMobile = useIsMobile();
    const portalRoot = typeof document !== 'undefined' ? document.getElementById('root') : null;

    if (!isOpen || !portalRoot) {
        return null;
    }
    
    const handleSelectAndClose = (date: Date) => {
        onDateSelect(date);
        onClose();
    };

    if (isMobile) {
        return createPortal(
            <MobileSingleDatePicker 
                isOpen={isOpen}
                onClose={onClose}
                date={selectedDate}
                onSelect={handleSelectAndClose}
                disabledDates={disabledDates}
            />,
            portalRoot
        );
    }

    const modalContent = (
         <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm m-4 transform transition-all"
            >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 id="modal-title" className="text-lg font-bold text-gray-900">Выберите дату</h2>
                   <button 
                      onClick={onClose} 
                      className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Закрыть"
                  >
                      <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-2">
                    <Calendar
                        selected={{ from: selectedDate, to: undefined }}
                        onDayClick={handleSelectAndClose}
                        className="p-0 border-none shadow-none max-w-none bg-transparent"
                        disabledDates={disabledDates}
                    />
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, portalRoot);
};

export default SingleDateCalendarModal;