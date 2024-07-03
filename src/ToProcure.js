import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';

const ToProcure = () => {
  const [toProcureItems, setToProcureItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError('Failed to load to procure items. Please try again later.');
      setLoading(false);
    }
  };

  const handleCreatePurchaseOrder = async (selectedItems) => {
    try {
      await api.post('/create_purchase_order', { items: selectedItems });
      fetchToProcureItems();  // Refresh the data
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4">Items To Procure</Typography>
      <ResultTable 
        data={toProcureItems}
        setData={setToProcureItems}
        onSaveSelected={handleCreatePurchaseOrder}
        isToProcure={true}
      />
    </Box>
  );
};

export default ToProcure;