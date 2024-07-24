import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, MenuItem, Badge, Box, Paper, ClickAwayListener } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import api from './api';

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const menuRefs = useRef({});
  const closeTimeoutRef = useRef(null);

  const handleMenuOpen = useCallback((menuName) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpenMenu(menuName);
  }, []);

  const handleMenuClose = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null);
    }, 800); 
  }, []);

  const handleClickAway = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setOpenMenu(null);
  }, []);


  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTitleClick = () => {
    navigate(isLoggedIn ? '/dashboard' : '/');
  };


  const menuItems = {
    inventory: [
      { label: 'Stock Overview', path: '/stock-overview' },
      { label: 'Product Catalog', path: '/product-catalog' },
      { label: 'Inventory Management', path: '/inventory' },  // Add this line
      { label: 'Product Mapping', path: '/product-mapping' }, // Add this line
      { label: 'Inventory Adjustments', path: '/inventory-adjustments' },
      { label: 'Low Stock Alerts', path: '/low-stock-alerts' },
      { label: 'Warehouse Management', path: '/warehouse-management' },
      { label: 'Inventory Valuation', path: '/inventory-valuation' },
    ],
    procurement: [
      { label: 'Procurement Board', path: '/procurement-board' },
      { label: 'Approve Items', path: '/to-approve' },
      { label: 'To Procure', path: '/to-procure' },
      { label: 'Purchase Orders', path: '/purchase-orders' },
      { label: 'Supplier Management', path: '/supplier-management' },
      { label: 'Reorder Points', path: '/reorder-points' },
      { label: 'Bulk Orders', path: '/bulk-orders' },
      { label: 'Price Negotiations', path: '/price-negotiations' },
    ],
    sales: [
      { label: 'Order Management', path: '/order-management' },
      { label: 'Amazon FBA', path: '/amazon-fba' },
      { label: 'Amazon FBM', path: '/amazon-fbm' },
      { label: 'eBay', path: '/ebay' },
      { label: 'TikTok Shop', path: '/tiktok-shop' },
      { label: 'Multi-Channel Listings', path: '/multi-channel-listings' },
    ],
    logistics: [
      { label: 'Shipment Tracking', path: '/shipment-tracking' },
      { label: 'FBA Shipments', path: '/fba-shipments' },
      { label: 'Returns Management', path: '/returns-management' },
      { label: 'Cross-Docking', path: '/cross-docking' },
      { label: '3PL Integration', path: '/3pl-integration' },
    ],
    analysis: [
      { label: 'Sales Performance', path: '/sales-performance' },
      { label: 'Inventory Turnover', path: '/inventory-turnover' },
      { label: 'Supplier Performance', path: '/supplier-performance' },
      { label: 'Channel Profitability', path: '/channel-profitability' },
      { label: 'Product Performance', path: '/product-performance' },
      { label: 'Demand Forecasting', path: '/demand-forecasting' },
    ],
    reports: [
      { label: 'Inventory Reports', path: '/inventory-reports' },
      { label: 'Sales Reports', path: '/sales-reports' },
      { label: 'Procurement Reports', path: '/procurement-reports' },
      { label: 'Financial Reports', path: '/financial-reports' },
      { label: 'Custom Reports', path: '/custom-reports' },
    ],
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const renderMenu = (menuName) => (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Paper
        ref={(el) => (menuRefs.current[menuName] = el)}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 9999,
          mt: 1,
          minWidth: 200,
          boxShadow: 3,
        }}
        onMouseEnter={() => {
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
          }
        }}
        onMouseLeave={handleMenuClose}
      >
        {menuItems[menuName].map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setOpenMenu(null);
            }}
            sx={{
              transition: 'background-color 0.2s ease',
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Paper>
    </ClickAwayListener>
  );

  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={handleTitleClick}
        >
          HDG Inventory Management
        </Typography>

        {isLoggedIn && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Object.keys(menuItems).map((menuName) => (
              <Box
                key={menuName}
                sx={{ position: 'relative' }}
                onMouseEnter={() => handleMenuOpen(menuName)}
                onMouseLeave={handleMenuClose}
                onClick={() => handleMenuOpen(menuName)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    mx: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': { color: 'secondary.main' },
                    transition: 'color 0.3s ease',
                  }}
                >
                  {menuName.charAt(0).toUpperCase() + menuName.slice(1)}
                  <KeyboardArrowDownIcon fontSize="small" />
                </Typography>
                {openMenu === menuName && renderMenu(menuName)}
              </Box>
            ))}

            <IconButton color="inherit">
              <Badge badgeContent={4} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={() => navigate('/help')}>
              <HelpOutlineIcon />
            </IconButton>

            <Box
              sx={{ position: 'relative' }}
              onMouseEnter={() => handleMenuOpen('account')}
              onMouseLeave={handleMenuClose}
              onClick={() => handleMenuOpen('account')}
            >
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              {openMenu === 'account' && (
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Paper
                    ref={(el) => (menuRefs.current['account'] = el)}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      zIndex: 9999,
                      mt: 1,
                      minWidth: 200,
                      boxShadow: 3,
                    }}
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                      }
                    }}
                    onMouseLeave={handleMenuClose}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); setOpenMenu(null); }}>Profile</MenuItem>
                    <MenuItem onClick={() => { navigate('/settings'); setOpenMenu(null); }}>Settings</MenuItem>
                    <MenuItem onClick={() => { handleLogout(); setOpenMenu(null); }}>Logout</MenuItem>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;