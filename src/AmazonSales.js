import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Box, Paper, Grid, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Alert
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import api from './api';

const AmazonSales = () => {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/amazon/sales-report');
        setSalesData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch Amazon sales data');
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const processedData = useMemo(() => {
    if (!salesData) return { fba: [], fbm: [], combined: [] };

    const fbaData = salesData.fba.map(item => ({
      date: item['purchase-date'].split('T')[0],
      sales: parseFloat(item['item-price']),
      unitsSold: parseInt(item['quantity-purchased'], 10)
    }));

    const fbmData = salesData.fbm.map(item => ({
      date: item['purchase-date'].split('T')[0],
      sales: parseFloat(item['item-price']),
      unitsSold: parseInt(item['quantity-purchased'], 10)
    }));

    const combinedData = [...fbaData, ...fbmData].reduce((acc, curr) => {
      const existingEntry = acc.find(item => item.date === curr.date);
      if (existingEntry) {
        existingEntry.sales += curr.sales;
        existingEntry.unitsSold += curr.unitsSold;
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []);

    return {
      fba: fbaData,
      fbm: fbmData,
      combined: combinedData.sort((a, b) => new Date(a.date) - new Date(b.date))
    };
  }, [salesData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Amazon Sales</Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="FBA" />
        <Tab label="FBM" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Total Sales</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={processedData.combined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" name="Total Sales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>FBA Sales</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">Units Sold</TableCell>
                  <TableCell align="right">Average Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedData.fba.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell component="th" scope="row">{row.date}</TableCell>
                    <TableCell align="right">${row.sales.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.unitsSold}</TableCell>
                    <TableCell align="right">${(row.sales / row.unitsSold).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>FBM Sales</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">Units Sold</TableCell>
                  <TableCell align="right">Average Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedData.fbm.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell component="th" scope="row">{row.date}</TableCell>
                    <TableCell align="right">${row.sales.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.unitsSold}</TableCell>
                    <TableCell align="right">${(row.sales / row.unitsSold).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AmazonSales;