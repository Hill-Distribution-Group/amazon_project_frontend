import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';

const SavedResults = () => {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      console.log('Fetching saved items...');  // Add this debug line
      const response = await api.get('/get_saved_results');
      console.log('Received response:', response.data);  // Add this debug line
      setSavedItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching saved items:', error.response ? error.response.data : error);
      setError('Failed to load saved items. Please try again later.');
      setLoading(false);
    }
  };

  const handleApproveSelected = async (selectedItems) => {
    try {
      await api.post('/approve_items', { items: selectedItems });
      setSavedItems(prevItems => 
        prevItems.filter(item => !selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN))
      );
    } catch (error) {
      console.error('Error approving items:', error);
    }
  };
  
  const handleRemoveSelected = async (selectedItems) => {
    try {
      await api.post('/remove_saved_items', { items: selectedItems });
      setSavedItems(prevItems => 
        prevItems.filter(item => !selectedItems.some(selectedItem => selectedItem.ASIN === item.ASIN))
      );
    } catch (error) {
      console.error('Error removing items:', error);
    }
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
    </Box>
  );
};

export default SavedResults;
