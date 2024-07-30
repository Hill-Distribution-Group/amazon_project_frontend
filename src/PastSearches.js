import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';
import { useSnackbar } from './SnackbarContext';

const PastSearches = () => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [error, setError] = useState(null);
  const { showSnackbar} = useSnackbar();

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      console.log('Fetching search history...');
      const response = await api.get('/api/past_searches/get_past_searches');
      console.log('Received response:', response.data);
      setSearchHistory(response.data);
    } catch (error) {
      console.error('Error fetching search history:', error.response ? error.response.data : error);
      setError('Failed to load search history. Please try again later.');
    }
  };

  const handleRemoveFromPast = async (selectedItems) => {
    try {
      await api.post('/api/past_searches/remove_past_searches', { items: selectedItems });
      fetchSearchHistory();
      showSnackbar('Items removed successfully.', 'success');
    } catch (error) {
      console.error('Error removing items:', error);
      showSnackbar('Error removing items. Please try again.', 'error');
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
    <Box width="100%" px={3}>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Search History
      </Typography>
      {searchHistory.length > 0 ? (
        <ResultTable 
          data={searchHistory} 
          setData={setSearchHistory}
          onRemoveSelected={handleRemoveFromPast}
          isSavedResults={false}
          isPastResults={true}
          
        />
      ) : (
        <Typography variant="body1">No search history found.</Typography>
      )}

    </Box>
  );
};

export default PastSearches;