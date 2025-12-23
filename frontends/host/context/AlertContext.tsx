import React, { createContext, useState, useContext, useCallback } from 'react';
import Alert, { AlertType } from '../components/ui/Alert';

interface AlertState {
  type: AlertType;
  title: string;
  message: string;
  id: number;
}

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message: string) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message, id: Date.now() });
  }, []);
  
  const handleClose = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <Alert
          key={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={handleClose}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
