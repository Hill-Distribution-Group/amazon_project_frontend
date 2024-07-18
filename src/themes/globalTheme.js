import { createTheme } from '@mui/material/styles';
import { styled } from '@mui/system';
import { Box, Paper, Button, Typography } from '@mui/material';

const theme = createTheme({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif'
    },
    h6: {
      fontWeight: 600,
      fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif'
    },
  },
  palette: {
    primary: { main: '#FFA500' }, // Orange
    secondary: { main: '#005BBB' }, // Blue
    background: { default: '#FFFFFF' }, // White
    error: { main: '#D32F2F' }, // Dark Red
    success: { main: '#388E3C' }, // Dark Green
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

export const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: theme.palette.background.default,
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  width: '100%',
  padding: theme.spacing(2, 3), // Adjust padding as needed
}));

export const ResultsContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(4),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

export const StyledHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  width: '100%',
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  gap: theme.spacing(2), // Add gap between header elements
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  textAlign: 'center',
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
}));

export const HeaderActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  position: 'absolute',
  right: theme.spacing(3),
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  fontWeight: 600,
  padding: theme.spacing(1, 3),
}));

export default theme;
