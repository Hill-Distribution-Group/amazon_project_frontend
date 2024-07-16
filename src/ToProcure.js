import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ToProcureTable from './ToProcureTable';
import api from './api';
import { useSnackbar } from './SnackbarContext';

const ToProcure = () => {
  const [toProcureItems, setToProcureItems] = useState([]);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchToProcureItems();
  }, []);

  const fetchToProcureItems = async () => {
    try {
      const response = await api.get('/api/to_procure/get_to_procure_items');
      setToProcureItems(response.data);
    } catch (error) {
      console.error('Error fetching to procure items:', error);
      setError(error.response?.data?.message || 'Failed to load to procure items. Please try again later.');
    }
  };

  const handleCreatePurchaseOrder = async (selectedItems, errorMessage) => {
    if (errorMessage) {
      showSnackbar(errorMessage, 'error');
      return;
    }

    try {
      const response = await api.post('/api/to_procure/create_purchase_order', { items: selectedItems });
      await fetchToProcureItems();
      showSnackbar(response.data.message || 'Purchase order created successfully', 'success');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to create purchase order. Please try again.',
        'error'
      );
    }
  };


  if (error) {
    return (
      <Box width="100%">
        <Typography variant="h4" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4">Items To Procure</Typography>
      <ToProcureTable
        data={toProcureItems}
        setData={setToProcureItems}
        onSaveSelected={handleCreatePurchaseOrder}
      />
    </Box>
  );
};

export default ToProcure;
