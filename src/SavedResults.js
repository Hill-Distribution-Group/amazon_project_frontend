import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';

const SavedResults = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const fetchSavedItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/get_saved_results');
      setSavedItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved items:', error);
      setError('Failed to load saved items. Please try again later.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const handleApproveSelected = async (selectedItems) => {
    try {
      await api.post('/approve_items', { items: selectedItems });
      setSavedItems(prevItems => 
        prevItems.filter(item => !selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN))
      );
      setSnackbar({ open: true, message: 'Items approved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error approving items:', error);
      setSnackbar({ open: true, message: 'Failed to approve items', severity: 'error' });
    }
  };
  
  const handleRemoveSelected = async (selectedItems) => {
    try {
      await api.post('/remove_saved_items', { items: selectedItems });
      setSavedItems(prevItems => 
        prevItems.filter(item => !selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN))
      );
      setSnackbar({ open: true, message: 'Items removed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error removing items:', error);
      setSnackbar({ open: true, message: 'Failed to remove items', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

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
    <Box width="100%" px={3}>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Saved Results
      </Typography>
      {savedItems.length > 0 ? (
        <ResultTable 
          data={savedItems} 
          setData={setSavedItems}
          onSaveSelected={handleApproveSelected}
          onRemoveSelected={handleRemoveSelected}
          isSavedResults={true}
        />
      ) : (
        <Typography variant="body1">No saved items found.</Typography>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} elevation={6} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SavedResults;