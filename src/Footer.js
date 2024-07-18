import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ mt: 5, py: 3, textAlign: 'center'}}>
      <Typography variant="body2" color="textSecondary">
        &copy; {new Date().getFullYear()} Hill Distribution Group. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
