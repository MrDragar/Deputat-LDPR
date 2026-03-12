import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Switch from '../../components/ui/Switch';
import { User } from '../../types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAvailable: boolean, reason: string | null) => void;
  deputy: User | null;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({ isOpen, onClose, onConfirm, deputy }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [reason, setReason] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (deputy && isOpen) {
      setIsAvailable(deputy.isAvailable ?? true);
      setReason(deputy.reasonUnavailable || '');
      setIsTouched(false);
    }
  }, [deputy, isOpen]);

  const handleConfirm = () => {
    if (!isAvailable && !reason.trim()) {
      setIsTouched(true);
      return;
    }
    onConfirm(isAvailable, isAvailable ? null : reason);
  };

  const showError = !isAvailable && isTouched && !reason.trim();

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Изменить взаимодействие"
      confirmButtonText="Сохранить"
      isConfirmDisabled={false}
      hideIcon={true}
    >
      <div className="text-left space-y-4 mt-4 min-h-[220px]">
        <p className="text-sm text-gray-600">
          Настройте статус взаимодействия для депутата <strong>{deputy?.deputyForm?.lastName} {deputy?.deputyForm?.firstName}</strong>.
        </p>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <span className="font-medium text-gray-700">Взаимодействующий</span>
          <Switch
            id="availability-switch"
            checked={isAvailable}
            onChange={(val) => {
                setIsAvailable(val);
                if (val) setIsTouched(false);
            }}
            label=""
          />
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${!isAvailable ? 'opacity-100 max-h-[150px]' : 'opacity-0 max-h-0'}`}>
          <div className="space-y-2 pt-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Причина невзаимодействия <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              rows={3}
              className={`w-full rounded-md shadow-sm sm:text-sm p-3 border ${showError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              placeholder="Укажите причину..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setIsTouched(true)}
            />
            {showError && (
              <p className="text-xs text-red-500">Обязательное поле</p>
            )}
          </div>
        </div>
      </div>
    </ConfirmationModal>
  );
};

export default AvailabilityModal;
