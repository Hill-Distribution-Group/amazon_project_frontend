import React, { createContext, useState, useContext } from 'react';

const SnackbarContext = createContext({
    snackbar: { open: false, message: '', severity: 'info' },
    showSnackbar: () => {},
    closeSnackbar: () => {},
  });

export const SnackbarProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState({
      open: false,
      message: '',
      severity: 'info',
    });
  
    const showSnackbar = (message, severity = 'info') => {
      setSnackbar({ open: true, message, severity });
    };
  
    const closeSnackbar = () => {
      setSnackbar(prev => ({ ...prev, open: false }));
    };
  
    return (
      <SnackbarContext.Provider value={{ snackbar, showSnackbar, closeSnackbar }}>
        {children}
      </SnackbarContext.Provider>
    );
  };

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export default SnackbarContext;