import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert } from '@mui/material';
import ToProcureTable from './ToProcureTable';
import api from './api';

const ToProcure = () => {
  const [toProcureItems, setToProcureItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchToProcureItems();
  }, []);

  const fetchToProcureItems = async () => {
    try {
      const response = await api.get('/get_to_procure_items');
      setToProcureItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching to procure items:', error);
      setError(error.response?.data?.message || 'Failed to load to procure items. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreatePurchaseOrder = async (selectedItems, errorMessage) => {
    if (errorMessage) {
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      return;
    }

    try {
      const response = await api.post('/create_purchase_order', { items: selectedItems });
      await fetchToProcureItems();
      setSnackbar({ open: true, message: response.data.message || "Purchase order created successfully", severity: 'success' });
    } catch (error) {
      console.error('Error creating purchase order:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || "Error creating purchase order. Please try again.", severity: 'error' });
    }
  };

  if (loading) return <CircularProgress aria-label="Loading to procure items" />;
  if (error) return <Typography color="error" role="alert">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4">Items To Procure</Typography>
      <ToProcureTable
        data={toProcureItems}
        setData={setToProcureItems}
        onSaveSelected={handleCreatePurchaseOrder}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} elevation={6} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};


export default ToProcure;