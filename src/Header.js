import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Badge, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import api from './api';

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAnchors, setMenuAnchors] = useState({
    inventory: null,
    procurement: null,
    sales: null,
    logistics: null,
    analysis: null,
    reports: null,
  });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuOpen = (menuName) => (event) => {
    setMenuAnchors({ ...menuAnchors, [menuName]: event.currentTarget });
  };

  const handleMenuClose = (menuName) => () => {
    setMenuAnchors({ ...menuAnchors, [menuName]: null });
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
    navigate(isLoggedIn ? '/dashboard' : '/');
  };

  const menuItems = {
    inventory: [
      { label: 'Stock Overview', path: '/stock-overview' },
      { label: 'Product Catalog', path: '/product-catalog' },
      { label: 'Inventory Adjustments', path: '/inventory-adjustments' },
      { label: 'Low Stock Alerts', path: '/low-stock-alerts' },
      { label: 'Warehouse Management', path: '/warehouse-management' },
      { label: 'Inventory Valuation', path: '/inventory-valuation' },
    ],
    procurement: [
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

  return (
    <AppBar position="static">
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
              <Box key={menuName} sx={{ position: 'relative' }}>
                <Typography
                  variant="body2"
                  sx={{
                    mx: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': { color: 'secondary.main' },
                  }}
                  onMouseEnter={handleMenuOpen(menuName)}
                >
                  {menuName.charAt(0).toUpperCase() + menuName.slice(1)}
                  <KeyboardArrowDownIcon fontSize="small" />
                </Typography>
                <Menu
                  anchorEl={menuAnchors[menuName]}
                  open={Boolean(menuAnchors[menuName])}
                  onClose={handleMenuClose(menuName)}
                  MenuListProps={{ onMouseLeave: handleMenuClose(menuName) }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {menuItems[menuName].map((item) => (
                    <MenuItem key={item.path} onClick={() => navigate(item.path)}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
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
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
              <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;