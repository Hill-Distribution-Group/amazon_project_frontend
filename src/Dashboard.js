import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, List, ListItem, ListItemText, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider,
  
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Inventory, ShoppingCart, AttachMoney, Refresh,
  Warning, CheckCircle, Cancel
} from '@mui/icons-material';
import theme, { 
  PageContainer, 
  ContentContainer, 
  StyledHeader,
  HeaderTitle,
  HeaderActions,
  StyledButton
} from './themes/globalTheme';

// Mock data for charts
const salesData = [
  { name: 'Jan', sales: 40000 },
  { name: 'Feb', sales: 30000 },
  { name: 'Mar', sales: 50000 },
  { name: 'Apr', sales: 45000 },
  { name: 'May', sales: 60000 },
  { name: 'Jun', sales: 55000 },
];

const inventoryData = [
  { name: 'In Stock', value: 300 },
  { name: 'Low Stock', value: 50 },
  { name: 'Out of Stock', value: 20 },
];

const profitMarginData = [
  { name: 'Jan', margin: 15 },
  { name: 'Feb', margin: 18 },
  { name: 'Mar', margin: 16 },
  { name: 'Apr', margin: 19 },
  { name: 'May', margin: 21 },
  { name: 'Jun', margin: 20 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [quickStats] = useState({
    totalSales: 280000,
    inventoryValue: 1250000,
    pendingOrders: 37,
    profitMargin: 18.5
  });

  const [topProducts] = useState([
    { id: 1, name: 'Product A', sales: 12500, stock: 150 },
    { id: 2, name: 'Product B', sales: 10800, stock: 80 },
    { id: 3, name: 'Product C', sales: 9200, stock: 200 },
    { id: 4, name: 'Product D', sales: 8500, stock: 60 },
    { id: 5, name: 'Product E', sales: 7900, stock: 100 },
  ]);

  const [recentActivities] = useState([
    { id: 1, type: 'order', message: 'New order received', details: 'Order #1234 - £500', icon: <ShoppingCart color="primary" /> },
    { id: 2, type: 'alert', message: 'Low stock alert', details: 'SKU: ABC123 - Reorder soon', icon: <Warning color="error" /> },
    { id: 3, type: 'approval', message: 'Price change approved', details: 'Product XYZ - New price: £24.99', icon: <CheckCircle color="success" /> },
    { id: 4, type: 'payment', message: 'Supplier payment due', details: 'Invoice #5678 - Due in 3 days', icon: <AttachMoney color="secondary" /> },
    { id: 5, type: 'cancellation', message: 'Order cancelled', details: 'Order #9876 - Refund processed', icon: <Cancel color="error" /> },
  ]);

  useEffect(() => {
    // In a real application, you would fetch data here
    // For now, we're using static data
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1500);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  };

  return (
    <PageContainer>
      <StyledHeader>
        <HeaderTitle variant="h4">Dashboard</HeaderTitle>
        <HeaderActions>
          <StyledButton
            variant="text"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </StyledButton>
        </HeaderActions>
      </StyledHeader>

      <ContentContainer>
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">Total Sales</Typography>
                <Typography variant="h4">{formatCurrency(quickStats.totalSales)}</Typography>
              </Box>
              <TrendingUp color="success" fontSize="large" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">Inventory Value</Typography>
                <Typography variant="h4">{formatCurrency(quickStats.inventoryValue)}</Typography>
              </Box>
              <Inventory color="primary" fontSize="large" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">Pending Orders</Typography>
                <Typography variant="h4">{quickStats.pendingOrders}</Typography>
              </Box>
              <ShoppingCart color="secondary" fontSize="large" />
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">Profit Margin</Typography>
                <Typography variant="h4">{quickStats.profitMargin}%</Typography>
              </Box>
              <AttachMoney color="success" fontSize="large" />
            </Paper>
          </Grid>

          {/* Sales Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Monthly Sales</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="sales" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Inventory Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Inventory Status</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Top Performing Products</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Sales</TableCell>
                      <TableCell align="right">Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell component="th" scope="row">{product.name}</TableCell>
                        <TableCell align="right">{formatCurrency(product.sales)}</TableCell>
                        <TableCell align="right">{product.stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Profit Margin Trend */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Profit Margin Trend</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={profitMarginData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="margin" stroke={theme.palette.secondary.main} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Activities</Typography>
              <List>
                {recentActivities.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemText 
                        primary={activity.message} 
                        secondary={activity.details}
                        primaryTypographyProps={{ variant: 'subtitle1' }}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                      {activity.icon}
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <StyledButton variant="outlined" startIcon={<ShoppingCart />}>
                  Create Order
                </StyledButton>
                <StyledButton variant="outlined" startIcon={<Inventory />}>
                  Update Inventory
                </StyledButton>
                <StyledButton variant="outlined" startIcon={<TrendingDown />}>
                  View Reports
                </StyledButton>
                <StyledButton variant="outlined" startIcon={<AttachMoney />}>
                  Manage Finances
                </StyledButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </ContentContainer>
    </PageContainer>
  );
};

export default Dashboard;