import React, { createContext, useContext, useState } from 'react';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('message'); // 'loading' | 'success' | 'error' | 'message'
  const [navigationTarget, setNavigationTarget] = useState(null);

  const showAlert = (msg, alertType = 'message', target = null) => {
    setMessage(msg);
    setType(alertType);
    setNavigationTarget(target);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        message={message}
        onClose={hideAlert}
        type={type}
        navigationTarget={navigationTarget}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
