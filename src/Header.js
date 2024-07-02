import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Import the configured Axios instance

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTitleClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          style={{ flexGrow: 1, cursor: 'pointer' }} 
          onClick={handleTitleClick}
        >
          HDG Data Warehouse
        </Typography>
        {isLoggedIn && (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;