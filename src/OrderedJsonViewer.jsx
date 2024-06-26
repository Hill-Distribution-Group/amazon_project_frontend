import React from 'react';
import { Typography, Box,Paper, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

const OrderedJsonViewer = ({ data }) => {
  const renderObject = (obj, level = 0) => {
    return Object.entries(obj).map(([key, value]) => (
      <TableRow key={key}>
        <TableCell component="th" scope="row" sx={{ paddingLeft: `${level * 16}px`, fontWeight: 'bold' }}>
          {key}
        </TableCell>
        <TableCell>
          {typeof value === 'object' && value !== null ? (
            <Box sx={{ marginLeft: '16px' }}>
              {renderObject(value, level + 1)}
            </Box>
          ) : (
            <Typography variant="body1">{value?.toString() || 'N/A'}</Typography>
          )}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <TableContainer component={Paper} sx={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <Table>
        <TableBody>
          {renderObject(data)}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OrderedJsonViewer;
