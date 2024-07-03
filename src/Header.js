import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import api from './api';

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
          <>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={() => navigate('/help')}>
              <HelpOutlineIcon />
            </IconButton>

            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => navigate('/to-procure')}>To Procure</MenuItem>
              <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
          
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;