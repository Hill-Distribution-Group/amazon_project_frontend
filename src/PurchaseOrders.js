import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  IconButton,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  ThemeProvider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from './api';
import { useSnackbar } from './SnackbarContext';
import theme, { 
  PageContainer, 
  ContentContainer, 
  ResultsContainer, 
  StyledHeader,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';
import EnhancedFilterSortControls from './EnhancedFilterSortControls';

const PurchaseOrders = () => {
  const availableSalesChannels = [
    'Amazon FBA',
    'Amazon FBM',
    'eBay',
    'TikTok',
    'Not Specified',
  ];

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState(null);
  const { showSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [poData, setPOData] = useState({
    supplier: null,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: null,
    status: 'Draft',
    items: [],
  });
  const [selectedPOs, setSelectedPOs] = useState({});
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: '', direction: 'asc' });

  const truncateText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text || '';
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (field, direction) => {
    setSortConfig({ field, direction });
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
    }
  }, []);

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

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setIsEditing(false);
    setEditingPO(null);
    setPOData({
      supplier: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: null,
      status: 'Draft',
      items: [],
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setEditingPO(null);
    setPOData({
      supplier: null,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: null,
      status: 'Draft',
      items: [],
    });
  };

  const handleAddItem = () => {
    setPOData({
      ...poData,
      items: [
        ...poData.items,
        {
          product_id: '',
          quantity: 1,
          unit_cost: 0,
          extra_packing_needed: 'None',
          sales_channel_split: availableSalesChannels.reduce(
            (split, channel) => ({ ...split, [channel]: 0 }),
            {}
          ),
        },
      ],
    });
  };

  const handleDeleteItem = (index) => {
    setPOData({
      ...poData,
      items: poData.items.filter((_, i) => i !== index),
    });
  };

  const handleInputChange = (index, field, value) => {
    if (field === 'quantity') {
      const totalSplitQuantity = Object.values(poData.items[index].sales_channel_split).reduce(
        (sum, qty) => sum + qty,
        0
      );
      if (value < totalSplitQuantity) {
        showSnackbar('Quantity cannot be less than the total split quantity.', 'error');
        return;
      }
      if (value < 0) {
        showSnackbar('Quantity cannot be negative.', 'error');
        return;
      }
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

    try {
      await api.post('/api/purchase_orders/create_po', {
        ...poData,
        orderDate: new Date().toISOString(),
      });
      await fetchPurchaseOrders();
      showSnackbar('Purchase order created successfully', 'success');
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating purchase order:', error);
      showSnackbar(
        error.response?.data?.message ||
          'Failed to create purchase order. Please try again.',
        'error'
      );
    }
  };

  const handleEditPO = (po) => {
    const updatedItems = po.items.map((item) => ({
      ...item,
      product_id: item.product.id,
      unit_cost: item.unit_price,
      extra_packing_needed: item.extra_packing_needed || 'None',
      sales_channel_split: {
        ...availableSalesChannels.reduce(
          (split, channel) => ({ ...split, [channel]: 0 }),
          {}
        ),
        ...item.sales_channel_split,
      },
    }));

    setIsEditing(true);
    setEditingPO(po);
    setPOData({
      ...po,
      supplier: { id: po.supplier.id, name: po.supplier.name },
      expectedDeliveryDate: po.expected_delivery_date
        ? new Date(po.expected_delivery_date)
        : null,
      items: updatedItems,
    });
    setOpenDialog(true);
  };

  const handleUpdatePurchaseOrder = async () => {
    if (poData.expectedDeliveryDate && new Date(poData.expectedDeliveryDate) < new Date()) {
      showSnackbar('Expected delivery date cannot be in the past.', 'error');
      return;
    }

    const areAllQuantitiesValid = poData.items.every((item) => {
      const totalSplitQuantity = Object.values(item.sales_channel_split).reduce(
        (sum, qty) => sum + qty,
        0
      );
      return item.quantity >= totalSplitQuantity && item.quantity >= 0;
    });

    if (!areAllQuantitiesValid) {
      showSnackbar('Ensure all quantities are valid and not negative.', 'error');
      return;
    }

    const areAllSplitQuantitiesEqual = poData.items.every((item) => {
      const totalSplitQuantity = Object.values(item.sales_channel_split).reduce(
        (sum, qty) => sum + qty,
        0
      );
      return totalSplitQuantity === item.quantity;
    });

    if (!areAllSplitQuantitiesEqual) {
      showSnackbar('Total split quantities must equal the item quantity.', 'error');
      return;
    }

    try {
      const updatedPOData = {
        ...poData,
        expected_delivery_date: poData.expectedDeliveryDate
          ? poData.expectedDeliveryDate.toISOString().split('T')[0]
          : null,
      };
      const response = await api.put(
        `/api/purchase_orders/update_po/${editingPO.id}`,
        updatedPOData
      );
      await fetchPurchaseOrders();

      if (selectedPO && selectedPO.id === editingPO.id) {
        setSelectedPO(response.data);
      }

      showSnackbar('Purchase order updated successfully', 'success');
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating purchase order:', error);
      showSnackbar(
        error.response?.data?.message ||
          'Failed to update purchase order. Please try again.',
        'error'
      );
    }
  };

  const handleRowClick = (po) => {
    setSelectedPO(po);
  };

  const handleClosePODialog = () => {
    setSelectedPO(null);
  };

  const handlePOCheckboxChange = (poId) => {
    setSelectedPOs((prevSelected) => ({
      ...prevSelected,
      [poId]: !prevSelected[poId],
    }));
  };

  const handleRemoveSelectedPOs = async () => {
    const poIdsToRemove = Object.keys(selectedPOs).filter(
      (poId) => selectedPOs[poId]
    );
    if (poIdsToRemove.length === 0) {
      showSnackbar('Please select purchase orders to remove.', 'warning');
      return;
    }

    try {
      await api.delete('/api/purchase_orders/delete_pos', {
        data: { poIds: poIdsToRemove },
      });
      await fetchPurchaseOrders();
      showSnackbar('Purchase orders removed successfully.', 'success');
      setSelectedPOs({});
    } catch (error) {
      console.error('Error removing purchase orders:', error);
      showSnackbar('Failed to remove purchase orders.', 'error');
    }
  };

  const columns = useMemo(() => [
    { field: 'po_number', headerName: 'PO Number' },
    { field: 'supplier.name', headerName: 'Supplier' },
    { field: 'order_date', headerName: 'Order Date' },
    { field: 'expected_delivery_date', headerName: 'Expected Delivery' },
    { field: 'status', headerName: 'Status' },
    { field: 'total_amount', headerName: 'Total Amount' },
  ], []);

  const filteredAndSortedPurchaseOrders = useMemo(() => {
    let result = purchaseOrders;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(po => {
          const fieldValue = field.includes('.') ? field.split('.').reduce((obj, key) => obj && obj[key], po) : po[field];
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.field) {
      result.sort((a, b) => {
        const aValue = sortConfig.field.includes('.') ? 
          sortConfig.field.split('.').reduce((obj, key) => obj && obj[key], a) : 
          a[sortConfig.field];
        const bValue = sortConfig.field.includes('.') ? 
          sortConfig.field.split('.').reduce((obj, key) => obj && obj[key], b) : 
          b[sortConfig.field];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

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
          <Box sx={{ width: '33%' }} /> {/* Left spacer */}
          <HeaderTitle variant="h5" component="h1" color="textPrimary">
            Purchase Orders
          </HeaderTitle>
          <HeaderActions>
            {/* Add your header buttons here if needed */}
          </HeaderActions>
        </StyledHeader>
        <ContentContainer>
          <ResultsContainer>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <EnhancedFilterSortControls
                columns={columns}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
              />
              <Box display="flex" alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleOpenDialog}
                  sx={{ marginRight: '1rem' }}
                >
                  Create New PO
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleRemoveSelectedPOs}
                  disabled={Object.values(selectedPOs).filter(Boolean).length === 0}
                >
                  Remove Selected
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '600px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                  <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          Object.values(selectedPOs).some(Boolean) &&
                          !Object.values(selectedPOs).every(Boolean)
                        }
                        checked={Object.values(selectedPOs).every(Boolean)}
                        onChange={(e) => {
                          const allChecked = e.target.checked;
                          setSelectedPOs(
                            filteredAndSortedPurchaseOrders.reduce(
                              (newSelected, po) => ({
                                ...newSelected,
                                [po.id]: allChecked,
                              }),
                              {}
                            )
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={column.field}>{column.headerName}</TableCell>
                    ))}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedPurchaseOrders.map((po) => (
                    <TableRow key={po.id} hover onClick={() => handleRowClick(po)}>
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
                          >
                            <MenuItem value="Draft">Draft</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Shipped">Shipped</MenuItem>
                            <MenuItem value="Received">Received</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>£{po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPO(po);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="xl">
              <DialogTitle>{isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
              <DialogContent>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={poData.supplier ? poData.supplier.id : ''}
                    onChange={(e) =>
                      setPOData({
                        ...poData,
                        supplier: suppliers.find((s) => s.id === e.target.value),
                      })
                    }
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
                    renderInput={(params) => (
                      <TextField {...params} fullWidth margin="normal" />
                    )}
                    format="dd/MM/yyyy"
                  />
                </LocalizationProvider>

                <TableContainer component={Paper} style={{ marginTop: '1rem' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product ID</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Cost</TableCell>
                        <TableCell>Extra Packaging</TableCell>
                        {availableSalesChannels.map((channel) => (
                          <TableCell key={channel}>{channel} Split</TableCell>
                        ))}
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {poData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              value={item.product_id}
                              onChange={(e) =>
                                handleInputChange(index, 'product_id', e.target.value)
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  'quantity',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.unit_cost}
                              onChange={(e) =>
                                handleInputChange(
                                  index,
                                  'unit_cost',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              fullWidth
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">£</InputAdornment>
                                ),
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth>
                              <Select
                                value={item.extra_packing_needed}
                                onChange={(e) =>
                                  handleInputChange(
                                    index,
                                    'extra_packing_needed',
                                    e.target.value
                                  )
                                }
                              >
                                {extraPackagingOptions.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          {availableSalesChannels.map((channel) => (
                            <TableCell key={channel}>
                              <TextField
                                type="number"
                                value={item.sales_channel_split[channel] || 0}
                                onChange={(e) =>
                                  handleSplitChange(
                                    index,
                                    channel,
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                fullWidth
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <IconButton onClick={() => handleDeleteItem(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button variant="outlined" onClick={handleAddItem} sx={{ marginTop: '1rem' }}>
                  Add Item
                </Button>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                {isEditing ? (
                  <Button onClick={handleUpdatePurchaseOrder} color="primary">
                    Update PO
                  </Button>
                ) : (
                  <Button onClick={handleCreatePurchaseOrder} color="primary">
                    Create PO
                  </Button>
                )}
              </DialogActions>
            </Dialog>

            <Dialog open={!!selectedPO} onClose={handleClosePODialog} fullWidth maxWidth="xl">
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
                      Expected Delivery:{' '}
                      {selectedPO.expected_delivery_date
                        ? new Date(selectedPO.expected_delivery_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Status: {selectedPO.status}
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
                              <TableCell key={channel}>{channel} Split</TableCell>
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
                    <Button onClick={handleClosePODialog}>Close</Button>
                  </DialogActions>
                </>
              )}
            </Dialog>
          </ResultsContainer>
        </ContentContainer>
      </PageContainer>
    </ThemeProvider>
  );
};

export default PurchaseOrders;
