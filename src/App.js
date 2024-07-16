import React, { useState, useEffect,useCallback } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { Container, Typography, Box, Paper, Grid, CssBaseline, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/system';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import Dashboard from './Dashboard';
import Header from './Header';
import Footer from './Footer';
import backgroundImage from './assets/pexels-tiger-lily-4483775.jpg';
import logo from './assets/hdg-logo.jpeg';
import api, { setLoadingSetter } from './api';
import ToApprove from './ToApprove';
import ToProcure from './ToProcure';
import PastSearches from './PastSearches';
import HelpPage from './HelpPage';
import SupplierManagement from './SupplierManagement';
import PurchaseOrders from './PurchaseOrders';
import { SnackbarProvider, useSnackbar } from './SnackbarContext';
import { LoadingProvider, useLoading } from './LoadingContext';
import LoadingOverlay from './LoadingOverlay';

let theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h2: { fontWeight: 700 },
    h4: { fontWeight: 600 },
  },
  palette: {
    primary: { main: '#0056b3' },
    secondary: { main: '#ff6b00' },
    background: { default: '#f4f6f8' },
  },
});

theme = responsiveFontSizes(theme);

const AppContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}));

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

export const ContentOverlay = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  minHeight: '100vh',
  width: '100%',
  position: 'absolute',
}));

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const { snackbar, closeSnackbar } = useSnackbar();
  const { setLoading } = useLoading();

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
    // Set up an interval to check login status every 5 minutes
    const intervalId = setInterval(checkLoginStatus, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [checkLoginStatus]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };
  return (
    <>
      <Header isLoggedIn={isLoggedIn} onLogout={() => {
        setIsLoggedIn(false);
        navigate('/');
      }} />
      <AppContainer maxWidth={false} disableGutters>
        <Routes>
          <Route path="/" element={
            !isLoggedIn ? (
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
            ) : (
              <Dashboard isLoggedIn={isLoggedIn} checkLoginStatus={checkLoginStatus} />
            )
          } />
          <Route path="/dashboard" element={<ContentOverlay><Dashboard isLoggedIn={isLoggedIn} checkLoginStatus={checkLoginStatus} /> </ContentOverlay>} />
          <Route path="/to-approve" element={<ContentOverlay><ToApprove /> </ContentOverlay>} />
          <Route path="/to-procure" element={<ContentOverlay><ToProcure/></ContentOverlay>} />
          <Route path="/past-searches" element={<ContentOverlay><PastSearches/></ContentOverlay>} />
          <Route path="/help" element={<ContentOverlay><HelpPage /></ContentOverlay>} />
          <Route path="/supplier-management" element={<ContentOverlay><SupplierManagement /></ContentOverlay>} />
          <Route path="/purchase-orders" element={<ContentOverlay><PurchaseOrders /></ContentOverlay>} />
        </Routes>
      </AppContainer>
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
    </>
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