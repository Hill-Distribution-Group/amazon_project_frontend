import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  InputAdornment, Checkbox, Select, MenuItem, FormControl, InputLabel,
  Tooltip, ThemeProvider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import theme, {
  PageContainer, ContentContainer, ResultsContainer, StyledHeader, HeaderTitle, HeaderActions
} from './themes/globalTheme';
import FilterControls from './FilterControls';
import InvoiceDialog from './InvoiceDialog';

const PurchaseOrders = () => {
  const availableSalesChannels = ['Initial Location Amazon', 'Initial Location Warehouse'];
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();

  // Dialog states
  const [createEditPODialogOpen, setCreateEditPODialogOpen] = useState(false);
  const [poDetailsDialogOpen, setPODetailsDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // Data states
  const [selectedPO, setSelectedPO] = useState(null);
  const [isEditingPO, setIsEditingPO] = useState(false);
  const [poData, setPOData] = useState({
    supplier: null,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: null,
    status: 'Draft',
    items: [],
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filtering and sorting states
  const [selectedPOs, setSelectedPOs] = useState({});
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const statusOptions = [
    'Draft','Waiting Payment', 'Pending', 'Shipped', 'Received', 'Rejected', 'Checked'
  ];

  const truncateText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text || '';
  };

  const handleAddItem = () => {
    setPOData(prevData => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          product_id: '',
          quantity: 0,
          unit_cost: 0,
          extra_packing_needed: 'None',
          sales_channel_split: availableSalesChannels.reduce((acc, channel) => ({...acc, [channel]: 0}), {})
        }
      ]
    }));
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const extraPackagingOptions = [
    { value: 'None', label: 'None' },
    { value: 'Bubble Wrap', label: 'Bubble Wrap' },
    { value: 'Box', label: 'Box' },
    { value: 'Fragile Sticker', label: 'Fragile Sticker' },
  ];

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      const response = await api.get('/api/purchase_orders/get_pos');
      setPurchaseOrders(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError('Failed to load purchase orders. Please try again later.');
      showSnackbar('Failed to load purchase orders', 'error');
    }
  }, [showSnackbar]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/api/to_procure/get_suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      showSnackbar('Error fetching suppliers. Please try again.', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, [fetchPurchaseOrders, fetchSuppliers]);

  const handleOpenCreateEditPODialog = () => {
    setCreateEditPODialogOpen(true);
    setIsEditingPO(false);
    setPOData({
      supplier: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: null,
      status: 'Draft',
      items: [],
    });
  };

  const handleCloseCreateEditPODialog = () => {
    setCreateEditPODialogOpen(false);
    setIsEditingPO(false);
    setPOData({
      supplier: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: null,
      status: 'Draft',
      items: [],
    });
  };

  const handleInputChange = (index, field, value) => {
    if ((field === 'quantity' || field === 'unit_cost') && value < 0) {
      showSnackbar(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be negative.`, 'error');
      return;
    }
    
    setPOData((prevData) => ({
      ...prevData,
      items: prevData.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSplitChange = (index, channel, value) => {
    if (value < 0) {
      showSnackbar('Split quantity cannot be negative.', 'error');
      return;
    }
  
    const updatedItems = poData.items.map((item, i) => {
      if (i === index) {
        const updatedSplit = {
          ...item.sales_channel_split,
          [channel]: parseInt(value, 10) || 0,
        };
        const totalSplit = Object.values(updatedSplit).reduce(
          (sum, qty) => sum + qty,
          0
        );
  
        if (totalSplit <= item.quantity) {
          return { ...item, sales_channel_split: updatedSplit };
        } else {
          showSnackbar(
            `Total split quantity for ${channel} exceeds available quantity`,
            'error'
          );
        }
      }
      return item;
    });
    setPOData({
      ...poData,
      items: updatedItems,
    });
  };
  

  const handleCreatePurchaseOrder = async () => {
    if (!poData.supplier) {
      showSnackbar('Please select a supplier.', 'error');
      return;
    }
  
    if (poData.expectedDeliveryDate && new Date(poData.expectedDeliveryDate) < new Date()) {
      showSnackbar('Expected delivery date cannot be in the past.', 'error');
      return;
    }
  
    const areAllQuantitiesIntegers = poData.items.every((item) =>
      Number.isInteger(parseFloat(item.quantity))
    );
    if (!areAllQuantitiesIntegers) {
      showSnackbar('All quantities must be integers.', 'error');
      return;
    }
  
    if (!checkQuantitySplitReconciliation(poData.items)) {
      showSnackbar('The total quantity must match the sum of split quantities for each item.', 'error');
      return;
    }
  
    try {
      const response = await api.post('/api/purchase_orders/create_po', {
        ...poData,
        orderDate: new Date().toISOString(),
      });
  
      const newPO = response.data; 
      console.log("New Purchase Order created:", newPO);
    
      await fetchPurchaseOrders();
      showSnackbar('Purchase order created successfully', 'success');
      handleCloseCreateEditPODialog(); 
    } catch (error) {
      console.error('Error creating purchase order:', error);
      showSnackbar(
        error.response?.data?.error ||
          'Failed to create purchase order. Please try again.',
        'error'
      );
    }
  };

  const handlePOCheckboxChange = (poId) => {
    setSelectedPOs((prevSelected) => ({
      ...prevSelected,
      [poId]: !prevSelected[poId],
    }));
  };
  
  
  const handleUpdatePurchaseOrder = async () => {
    if (poData.expectedDeliveryDate && new Date(poData.expectedDeliveryDate) < new Date()) {
      showSnackbar('Expected delivery date cannot be in the past.', 'error');
      return;
    }
  
    const areAllQuantitiesValid = poData.items.every((item) => {
      return item.quantity >= 0;
    });
  
    if (!areAllQuantitiesValid) {
      showSnackbar('Ensure all quantities are valid and not negative.', 'error');
      return;
    }
  
    if (!checkQuantitySplitReconciliation(poData.items)) {
      showSnackbar('The total quantity must match the sum of split quantities for each item.', 'error');
      return;
    }
  
    try {
      const updatedPOData = {
        ...poData,
        expected_delivery_date: poData.expectedDeliveryDate
          ? poData.expectedDeliveryDate.toISOString().split('T')[0]
          : null,
        items: poData.items.map(item => ({
          ...item,
          extra_packing_needed: item.extra_packing_needed
        }))
      };
      await api.put(`/api/purchase_orders/update_po/${selectedPO.id}`, updatedPOData);
      await fetchPurchaseOrders();
      showSnackbar('Purchase order updated successfully', 'success');
      handleCloseCreateEditPODialog();
    } catch (error) {
      console.error('Error updating purchase order:', error);
      showSnackbar('Failed to update purchase order. Please try again.', 'error');
    }
  };

  const handleOpenPODetailsDialog = (po) => {
    setSelectedPO(po);
    setPODetailsDialogOpen(true);
  };

  const handleClosePODetailsDialog = () => {
    setPODetailsDialogOpen(false);
  };

  const handleOpenInvoiceDialog = (po) => {
    setSelectedInvoice(po.invoice || {});
    setSelectedPO(po);
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceSaved = useCallback(async (updatedInvoice) => {
    try {
      // Fetch the updated PO data
      const response = await api.get(`/api/purchase_orders/get_po/${selectedPO.id}`);
      const updatedPO = response.data;
  
      // Update the purchaseOrders state
      setPurchaseOrders(prevPOs =>
        prevPOs.map(po =>
          po.id === updatedPO.id ? updatedPO : po
        )
      );
  
      // Update the selectedPO state
      setSelectedPO(updatedPO);
  
      showSnackbar('Invoice saved successfully', 'success');
    } catch (error) {
      console.error('Error fetching updated PO data:', error);
      showSnackbar('Failed to update PO data. Please refresh the page.', 'error');
    }
  }, [selectedPO, showSnackbar]);



  const checkQuantitySplitReconciliation = (items) => {
    return items.every(item => {
      const totalSplit = Object.values(item.sales_channel_split).reduce((sum, qty) => sum + qty, 0);
      return item.quantity === totalSplit;
    });
  };

  const isPoEditable = (status) => {
    return status !== 'Checked';
  };

  const getRowStyle = (status) => {
    return status === 'Checked' ? { opacity: 0.5 } : {};
  };

  const columns = useMemo(() => [
    { field: 'po_number', headerName: 'PO Number' },
    { field: 'supplier.name', headerName: 'Supplier' },
    { field: 'order_date', headerName: 'Order Date' },
    { field: 'expected_delivery_date', headerName: 'Expected Delivery' },
    { field: 'status', headerName: 'Status' },
    { field: 'total_amount', headerName: 'Total Amount' },
  ], []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedPurchaseOrders = useMemo(() => {
    let result = purchaseOrders;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(po => {
          const fieldValue = field.includes('.')
            ? field.split('.').reduce((obj, key) => obj && obj[key], po)
            : po[field];
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((obj, key) => obj && obj[key], a)
          : a[sortConfig.key];
        const bValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((obj, key) => obj && obj[key], b)
          : b[sortConfig.key];

        // Special handling for 'status' field
        if (sortConfig.key === 'status') {
          if (aValue === 'Checked' && bValue !== 'Checked') return 1;
          if (bValue === 'Checked' && aValue !== 'Checked') return -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    // Always move 'Checked' status to the end, regardless of the sort field
    result.sort((a, b) => {
      if (a.status === 'Checked' && b.status !== 'Checked') return 1;
      if (b.status === 'Checked' && a.status !== 'Checked') return -1;
      return 0;
    });

    return result;
  }, [purchaseOrders, filters, sortConfig]);


  if (error) {
    return (
      <Box width="100%">
        <Typography variant="h4" color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <PageContainer>
        <StyledHeader>
          <Box sx={{ width: '33%' }} />
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Purchase Orders
          </HeaderTitle>
          <HeaderActions>
            <Button
              variant="text"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleOpenCreateEditPODialog}
            >
              Create New PO
            </Button>
          </HeaderActions>
        </StyledHeader>
        <ContentContainer>
          <ResultsContainer>
            <FilterControls
              columns={columns}
              onFilterChange={handleFilterChange}
            />
            <TableContainer component={Paper} sx={{ maxHeight: '600px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={Object.values(selectedPOs).some(Boolean) && !Object.values(selectedPOs).every(Boolean)}
                        checked={Object.values(selectedPOs).every(Boolean)}
                        onChange={(e) => {
                          const allChecked = e.target.checked;
                          setSelectedPOs(
                            filteredAndSortedPurchaseOrders.reduce(
                              (newSelected, po) => ({ ...newSelected, [po.id]: allChecked }),
                              {}
                            )
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    {columns.map(column => (
                      <TableCell
                        key={column.field}
                        onClick={() => handleSort(column.field)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Box display="flex" alignItems="center">
                          {column.headerName}
                          {sortConfig.key === column.field && (
                            sortConfig.direction === 'ascending'
                              ? <ArrowUpwardIcon fontSize="small" />
                              : <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedPurchaseOrders.map((po) => (
                    <TableRow
                      key={po.id}
                      hover
                      onClick={() => handleOpenPODetailsDialog(po)}
                      style={getRowStyle(po.status)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!selectedPOs[po.id]}
                          onChange={() => handlePOCheckboxChange(po.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell>{po.po_number}</TableCell>
                      <TableCell>{po.supplier.name}</TableCell>
                      <TableCell>
                        {new Date(po.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth>
                          <InputLabel id={`status-label-${po.id}`}>Status</InputLabel>
                          <Select
                            labelId={`status-label-${po.id}`}
                            id={`status-select-${po.id}`}
                            value={po.status}
                            label="Status"
                            onChange={async (e) => {
                              try {
                                const newStatus = e.target.value;
                                await api.put(
                                  `/api/purchase_orders/update_po/${po.id}`,
                                  { status: newStatus }
                                );
                                await fetchPurchaseOrders();
                                showSnackbar(
                                  `Purchase order status updated to ${newStatus}`,
                                  'success'
                                );
                              } catch (error) {
                                console.error(
                                  'Error updating purchase order status:',
                                  error
                                );
                                showSnackbar(
                                  'Failed to update purchase order status.',
                                  'error'
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!isPoEditable(po.status)}
                          >
                            {statusOptions.map((status) => (
                              <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>£{po.total_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* PO Details Dialog */}
            <Dialog open={poDetailsDialogOpen} onClose={handleClosePODetailsDialog} fullWidth maxWidth="xl">
              {selectedPO && (
                <>
                  <DialogTitle>Purchase Order Details - {selectedPO.po_number}</DialogTitle>
                  <DialogContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Supplier: {selectedPO.supplier.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Order Date: {new Date(selectedPO.order_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Expected Delivery: {selectedPO.expected_delivery_date
                        ? new Date(selectedPO.expected_delivery_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Status: {selectedPO.status}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Invoice: 
                      {selectedPO.invoice ? (
                        <Button
                          variant="text"
                          onClick={() => handleOpenInvoiceDialog(selectedPO)}
                        >
                          Show Invoice ({selectedPO.invoice.invoice_number})
                        </Button>
                      ) : (
                        <Button variant="text" onClick={() => handleOpenInvoiceDialog(selectedPO)}>
                          Create Invoice
                        </Button>
                      )}
                    </Typography>

                    <TableContainer component={Paper} sx={{ marginTop: '1rem' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Product Name</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit Cost</TableCell>
                            <TableCell>Total Amount</TableCell>
                            <TableCell>Extra Packaging</TableCell>
                            {availableSalesChannels.map((channel) => (
                              <TableCell key={channel}>{channel}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPO.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Tooltip title={item.product.name}>
                                  <span>{truncateText(item.product.name, 30)}</span>
                                </Tooltip>
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>£{item.unit_price.toFixed(2)}</TableCell>
                              <TableCell>£{(item.unit_price * item.quantity).toFixed(2)}</TableCell>
                              <TableCell>{item.extra_packing_needed}</TableCell>
                              {availableSalesChannels.map((channel) => (
                                <TableCell key={channel}>
                                  {item.sales_channel_split[channel] || 0}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClosePODetailsDialog}>Close</Button>
                  </DialogActions>
                </>
              )}
            </Dialog>

            {/* Invoice Dialog */}
            <InvoiceDialog
              open={invoiceDialogOpen}
              onClose={handleCloseInvoiceDialog}
              invoice={selectedInvoice}
              onSave={handleInvoiceSaved}
              po={selectedPO}
            />

        {/* Create/Edit PO Dialog */}
        <Dialog open={createEditPODialogOpen} onClose={handleCloseCreateEditPODialog} fullWidth maxWidth="xl">
  <DialogTitle>{isEditingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
  <DialogContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, mb: 3, mt: 1 }}>
      <FormControl sx={{ minWidth: 230 }}>
        <InputLabel>Supplier</InputLabel>
        <Select
          value={poData.supplier ? poData.supplier.id : ''}
          onChange={(e) =>
            setPOData({
              ...poData,
              supplier: suppliers.find((s) => s.id === e.target.value),
            })
          }
          label="Supplier"
        >
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Expected Delivery Date"
          value={poData.expectedDeliveryDate}
          onChange={(newValue) =>
            setPOData({ ...poData, expectedDeliveryDate: newValue })
          }
          renderInput={(params) => <TextField {...params} sx={{ minWidth: 220 }} />}
        />
      </LocalizationProvider>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Button
        onClick={handleAddItem}
        color="primary"
        startIcon={<AddCircleOutlineIcon />}
      >
        Add Item
      </Button>
    </Box>

    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product ID</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Unit Cost</TableCell>
            <TableCell>Extra Packaging</TableCell>
            <TableCell>Initial Location Amazon Split</TableCell>
            <TableCell>Initial Location Warehouse Split</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {poData.items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <TextField
                  value={item.product_id}
                  onChange={(e) => handleInputChange(index, 'product_id', e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleInputChange(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.unit_cost}
                  onChange={(e) => handleInputChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">£</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={item.extra_packing_needed}
                  onChange={(e) => handleInputChange(index, 'extra_packing_needed', e.target.value)}
                  fullWidth
                >
                  {extraPackagingOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.sales_channel_split['Initial Location Amazon'] || 0}
                  onChange={(e) => handleSplitChange(index, 'Initial Location Amazon', parseInt(e.target.value, 10) || 0)}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.sales_channel_split['Initial Location Warehouse'] || 0}
                  onChange={(e) => handleSplitChange(index, 'Initial Location Warehouse', parseInt(e.target.value, 10) || 0)}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
    <Button onClick={handleCloseCreateEditPODialog} color="primary">
      Cancel
    </Button>
    <Button
      onClick={isEditingPO ? handleUpdatePurchaseOrder : handleCreatePurchaseOrder}
      color="primary"
      variant="contained"
    >
      {isEditingPO ? 'Update PO' : 'Create PO'}
    </Button>
  </DialogActions>
</Dialog>
          </ResultsContainer>
        </ContentContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default PurchaseOrders;