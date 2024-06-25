import React from 'react';
import { Typography, Box } from '@mui/material';

const OrderedJsonViewer = ({ data }) => {
  const renderObject = (obj) => {
    return Object.entries(obj).map(([key, value]) => (
      <Box key={key} sx={{ marginBottom: '8px' }}>
        <Typography variant="body1">
          <strong>{key}:</strong> {
            typeof value === 'object' && value !== null
              ? renderObject(value)
              : value?.toString() || 'N/A'
          }
        </Typography>
      </Box>
    ));
  };

  return <Box>{renderObject(data)}</Box>;
};

export default OrderedJsonViewer;