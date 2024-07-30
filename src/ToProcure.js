import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, ThemeProvider } from '@mui/material';
import ToProcureTable from './ToProcureTable';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import theme, {
  PageContainer,
  ContentContainer,
  ResultsContainer,
  StyledHeader,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';

const ToProcure = () => {
  const [toProcureItems, setToProcureItems] = useState([]);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();

  const fetchToProcureItems = useCallback(async () => {
    try {
      const response = await api.get('/api/to_procure/get_to_procure_items');
      setToProcureItems(response.data);
    } catch (error) {
      console.error('Error fetching to procure items:', error);
      setError(error.response?.data?.error || 'Failed to load to procure items. Please try again later.');
    }
  }, []);

  useEffect(() => {
    fetchToProcureItems();
  }, [fetchToProcureItems]);

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
        error.response?.data?.error || 'Failed to create purchase order. Please try again.',
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
    <ThemeProvider theme={theme}>
      <PageContainer>
        <StyledHeader>
          <Box sx={{ width: '33%' }} />
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Items To Procure
          </HeaderTitle>
          <HeaderActions>
            {/* Add your header buttons here if needed */}
          </HeaderActions>
        </StyledHeader>
        <ContentContainer>
          <ResultsContainer>
            {toProcureItems.length > 0 ? (
              <ToProcureTable
                data={toProcureItems}
                setData={setToProcureItems}
                onSaveSelected={handleCreatePurchaseOrder}
                fetchToProcureItems={fetchToProcureItems}
              />
            ) : (
              <Typography variant="body1">No items to procure found.</Typography>
            )}
          </ResultsContainer>
        </ContentContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default ToProcure;
