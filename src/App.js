import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Snackbar, Alert,Grid,Box,Typography,Paper } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from './LoginForm';
import ProcurementBoard from './ProcurementBoard';
import Header from './Header';
import Footer from './Footer';
import logo from './assets/hdg-logo.jpeg';
import ToApprove from './ToApprove';
import ToProcure from './ToProcure';
import PastSearches from './PastSearches';
import HelpPage from './HelpPage';
import SupplierManagement from './SupplierManagement';
import PurchaseOrders from './PurchaseOrders';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import ProductMapping from './ProductMapping';
import ProductCatalog from './ProductCatalog';

import { SnackbarProvider, useSnackbar } from './SnackbarContext';
import { LoadingProvider, useLoading } from './LoadingContext';
import LoadingOverlay from './LoadingOverlay';
import api, { setLoadingSetter } from './api';
import theme, { PageContainer, ContentContainer } from './themes/globalTheme';
import { styled } from '@mui/system';

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { snackbar, closeSnackbar } = useSnackbar();
  const { setLoading } = useLoading();


  const WelcomeBox = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(6),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  }));
  
  const Logo = styled('img')({
    width: '120px',
    marginBottom: '2rem',
  });

  useEffect(() => {
    setLoadingSetter(setLoading);
  }, [setLoading]);

  const checkLoginStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/check_login_status');
      setIsLoggedIn(response.data.isAuthenticated);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
    const intervalId = setInterval(checkLoginStatus, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [checkLoginStatus]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <PageContainer>
      <Header isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
      <ContentContainer>
        <Routes>
        <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Grid container justifyContent="center">
                  <Grid item xs={12} sm={10} md={8} lg={6}>
                    <WelcomeBox elevation={0}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Logo src={logo} alt="HDG Logo" />
                        <Typography variant="h2" gutterBottom color="primary">
                          Welcome to HDG Data Warehouse
                        </Typography>
                        <Typography variant="h4" gutterBottom color="textSecondary">
                          Hill Distribution Group
                        </Typography>
                      </Box>
                      <Box mt={4}>
                        <Typography variant="body1" paragraph align="center" color="textSecondary">
                          Access your comprehensive data management and analysis tools for Amazon product matching and more.
                        </Typography>
                        <LoginForm onLoginSuccess={handleLoginSuccess} />
                      </Box>
                    </WelcomeBox>
                  </Grid>
                </Grid>
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? (
                <Dashboard isLoggedIn={isLoggedIn} checkLoginStatus={checkLoginStatus} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="/procurement-board" element={<ProcurementBoard />} />
          <Route path="/to-approve" element={<ToApprove />} />
          <Route path="/to-procure" element={<ToProcure />} />
          <Route path="/past-searches" element={<PastSearches />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/supplier-management" element={<SupplierManagement />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/product-mapping" element={<ProductMapping />} />
          <Route path="/product-catalog" element={<ProductCatalog />} />
        </Routes>
      </ContentContainer>
      <Footer />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <LoadingOverlay />
    </PageContainer>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <LoadingProvider>
          <AppContent />
        </LoadingProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;