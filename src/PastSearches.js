import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import ResultTable from './ResultTable';
import api from './api';

const PastSearches = () => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      console.log('Fetching search history...');
      const response = await api.get('/get_past_searches');
      console.log('Received response:', response.data);
      setSearchHistory(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching search history:', error.response ? error.response.data : error);
      setError('Failed to load search history. Please try again later.');
      setLoading(false);
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
  console.log(searchHistory);

  return (
    <Box width="100%" px={3}>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Search History
      </Typography>
      {searchHistory.length > 0 ? (
        <ResultTable 
          data={searchHistory} 
          setData={setSearchHistory}
          isSavedResults={false} // This differentiates between saved results and search history
        />
      ) : (
        <Typography variant="body1">No search history found.</Typography>
      )}
    </Box>
  );
};

export default PastSearches;
