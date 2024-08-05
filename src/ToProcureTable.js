import React, { useState, useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Box, Checkbox, TextField, FormControl, InputLabel, Select,
  MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Menu, Tooltip, Button, Modal, Typography
} from '@mui/material';
import api from './api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import OrderedJsonViewer from './OrderedJsonViewer';
import { useSnackbar } from './SnackbarContext';
import FilterControls from './FilterControls';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import BlockIcon from '@mui/icons-material/Block';

const ToProcureTable = ({ data, setData, onSaveSelected, fetchToProcureItems }) => {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [editedData, setEditedData] = useState({});
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poDetails, setPoDetails] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [extraPackingNeeded, setExtraPackingNeeded] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    setEditedData(data.reduce((acc, item) => ({ ...acc, [item.ID]: { ...item } }), {}));
  }, [data]);

  const truncateText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text || '';
  };

  const handleCheckboxChange = (product) => {
    setSelectedProducts((prevSelected) => ({
      ...prevSelected,
      [product.ID]: !prevSelected[product.ID]
    }));
  };

  const handleSelectAll = (event) => {
    const isChecked = event.target.checked;
    const newSelectedProducts = {};
    data.forEach((item) => {
      newSelectedProducts[item.ID] = isChecked;
    });
    setSelectedProducts(newSelectedProducts);
  };

  const handleEdit = (item) => {
    console.log('Editing item:', item);
    setEditingItem({
      ...item,
      'Cost of Goods': item['Cost of Goods'] || '',
      Quantity: item.Quantity || ''
    });
    setEditDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    setEditingItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      const response = await api.put(`/api/to_procure/update_to_procure_item`, editingItem);
      if (response.data.status === "moved_to_saved_results") {
        setData(prevData => prevData.filter(item => item.ID !== editingItem.ID));
        showSnackbar("Item moved back to approval due to margin decrease or quantity change", 'warning');
      } else if (response.data.status === "updated") {
        setData(prevData => prevData.map(item => item.ID === editingItem.ID ? response.data.item : item));
        showSnackbar("Item updated successfully.", 'success');
      }
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      showSnackbar("Error updating item. Please try again.", 'error');
    }
  };
  

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePoDialogClose = () => {
    setPoDialogOpen(false);
    setPoDetails([]);
  };

  const handleContextMenu = (event, product) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
          product: product,
        }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleCreatePO = () => {
    if (contextMenu) {
      const selectedItem = editedData[contextMenu.product.ID];
      const fbaSplit = parseInt(selectedItem['Initial Location Amazon']) || 0;
      const fbmSplit = parseInt(selectedItem['Initial Location Warehouse']) || 0;
      const totalQuantity = fbaSplit + fbmSplit;
  
      const newPoDetails = [{
        ...selectedItem,
        totalQuantity: totalQuantity,
        splits: [
          { id: 1, channel: 'Initial Location Amazon', quantity: fbaSplit },
          { id: 2, channel: 'Initial Location Warehouse', quantity: fbmSplit }
        ].filter(split => split.quantity > 0)
      }];
      setPoDetails(newPoDetails);
      setPoDialogOpen(true);
      handleCloseContextMenu();
    }
  };

  const handlePoSubmit = async () => {
    if (!expectedDeliveryDate) {
      showSnackbar("Please set an expected delivery date", "error");
      return;
    }
  
    if (poDetails.length === 0) {
      showSnackbar("No items to create a purchase order", "error");
      return;
    }
  
    const isValid = poDetails.every(item => {
      const splitTotal = item.splits.reduce((sum, split) => sum + parseInt(split.quantity || 0), 0);
      return splitTotal === item.totalQuantity && item.totalQuantity > 0;
    });
  
    if (!isValid) {
      showSnackbar("Split quantities do not match total quantity", "error");
      return;
    }
  
    const purchaseOrders = poDetails.map(item => ({
      product_id: item['Product ID'],
      quantity: item.totalQuantity,
      unit_cost: item['Cost of Goods'],
      counter_party: item['Counter Party'],
      extra_packing_needed: extraPackingNeeded,
      expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
      sales_channel_split: item.splits.reduce((acc, split) => {
        acc[split.channel] = split.quantity;
        return acc;
      }, {})
    }));
  
    onSaveSelected(purchaseOrders);
    handlePoDialogClose();
  };

  const handleCantProcure = async () => {
    const selectedItems = Object.keys(selectedProducts)
    .filter(id => selectedProducts[id])
    .map(id => ({ ID: id }));

    if (selectedItems.length === 0) {
      showSnackbar("No items selected for can't procure.", 'warning');
      return;
    }

    try {
      console.log('selectedItems:', selectedItems);
      const response = await api.post('/api/to_procure/cant_procure', { items: selectedItems });
      showSnackbar(response.data.message || 'Items marked as cannot procure', 'success');
      // Fetch the updated data to refresh the table
      await fetchToProcureItems();
      setSelectedProducts({});
    } catch (error) {
      console.error('Error marking items as cannot procure:', error);
      showSnackbar(error.response?.data?.error || 'Failed to mark items as cannot procure. Please try again.', 'error');
    }
  };

  const handleRowClick = (event, product) => {
    if (event.target.closest('input, select, .MuiCheckbox-root')) {
      return;
    }
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const columns = useMemo(() => [
    { field: 'Product SKU', headerName: 'SKU' },
    { field: 'Amazon Product Name', headerName: 'Product Name' },
    { field: 'ASIN', headerName: 'ASIN' },
    { field: 'Cost of Goods', headerName: 'Cost of Goods', editable: true },
    { field: 'Quantity', headerName: 'Quantity', editable: true },
    { field: 'VAT Rate', headerName: 'VAT Rate' },
    { field: 'Counter Party', headerName: 'Counter Party' },
    { field: 'Sell Price FBA', headerName: 'Sell Price FBA' },
    { field: 'Sell Price FBM', headerName: 'Sell Price FBM' },
    { field: 'Margin FBA', headerName: 'Margin FBA' },
    { field: 'Margin FBM', headerName: 'Margin FBM' },
    { field: 'Net Profit FBA', headerName: 'Net Profit FBA' },
    { field: 'Net Profit FBM', headerName: 'Net Profit FBM' },
    { field: 'Fulfilment Type', headerName: 'Fulfilment Type' },
    { field: 'Initial Location Amazon', headerName: 'Initial Location Amazon' },
    { field: 'Initial Location Warehouse', headerName: 'Initial Location Warehouse' },
    { field: 'Approved By', headerName: 'Approved By' },
    { field: 'Approved At', headerName: 'Approved At' },
  ], []);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[field]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, filters, sortConfig]);

  const getHighlightedColumns = (item) => {
    const columns = [];
    if (item['Fulfilment Type'] === 'FBA') {
      columns.push('Sell Price FBA', 'Margin FBA', 'Net Profit FBA');
    }
    if (item['Fulfilment Type'] === 'FBM') {
      columns.push('Sell Price FBM', 'Margin FBM', 'Net Profit FBM');
    }
    return columns;
  };

  const extraPackagingOptions = [
    { value: 'None', label: 'None' },
    { value: 'Bubble Wrap', label: 'Bubble Wrap' },
    { value: 'Box', label: 'Box' },
    { value: 'Fragile Sticker', label: 'Fragile Sticker' },
  ];

  const renderEditableCell = (item, column) => {
    const value = editedData[item.ID]?.[column.field] || item[column.field];
    const highlightedColumns = getHighlightedColumns(item);
    const isHighlighted = highlightedColumns.includes(column.field);
  
    const cellStyle = {
      backgroundColor: isHighlighted ? '#e3f2fd' : 'inherit',
      fontWeight: isHighlighted ? 'bold' : 'normal',
    };

    if (column.field === 'Amazon Product Name') {
      return (
        <Tooltip title={value || 'N/A'}>
          <span style={cellStyle}>{truncateText(value, 30)}</span>
        </Tooltip>
      );
    }

    if (column.field === 'VAT Rate') {
      // Display VAT Rate as a percentage
      const percentage = (parseFloat(value) * 100).toFixed(0) + '%';
      return <span style={cellStyle}>{percentage}</span>;
    }

    return <span style={cellStyle}>{value}</span>;
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <FilterControls
          columns={columns}
          onFilterChange={handleFilterChange}
        />
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            color="warning"
            onClick={handleCantProcure}
            startIcon={<BlockIcon />}
            disabled={Object.keys(selectedProducts).filter(id => selectedProducts[id]).length === 0}
            sx={{ padding: '6px 12px' }}
          >
            Can't Procure
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper} sx={{ minHeight: '400px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">
                <Checkbox
                  indeterminate={Object.values(selectedProducts).some(Boolean) && Object.values(selectedProducts).some(value => !value)}
                  checked={Object.values(selectedProducts).every(Boolean)}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell 
                  key={column.field}
                  onClick={() => handleSort(column.field)}
                  style={{ cursor: 'pointer' }}
                >
                  <Box display="flex" alignItems="center">
                    {column.headerName}
                    {sortConfig.key === column.field && (
                      sortConfig.direction === 'ascending' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedData.map((item) => (
              <TableRow
                key={item.ID}
                onClick={(event) => handleRowClick(event, item)}
                onContextMenu={(event) => handleContextMenu(event, item)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[item.ID]}
                    onChange={() => handleCheckboxChange(item)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {renderEditableCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={() => handleEdit(contextMenu.product)}>Edit Item</MenuItem>
        <MenuItem onClick={handleCreatePO}>Create Purchase Order</MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md">
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Cost of Goods"
                type="number"
                value={editingItem['Cost of Goods']}
                onChange={(e) => handleInputChange('Cost of Goods', e.target.value)}
                inputProps={{ min: 0 }} // Add min attribute to prevent negative input
              />
              <TextField
                label="Quantity"
                type="number"
                value={editingItem.Quantity}
                onChange={(e) => handleInputChange('Quantity', e.target.value)}
                inputProps={{ min: 0 }} // Add min attribute to prevent negative input
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} color="primary">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={poDialogOpen} onClose={handlePoDialogClose} maxWidth="md" fullWidth>
  <DialogTitle>Create Purchase Order</DialogTitle>
  <DialogContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: '5px', maxWidth: '400px' }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Expected Delivery Date"
          value={expectedDeliveryDate}
          onChange={(newValue) => setExpectedDeliveryDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
      <FormControl>
        <InputLabel>Extra Packing Needed</InputLabel>
        <Select
          value={extraPackingNeeded}
          onChange={(e) => setExtraPackingNeeded(e.target.value)}
        >
          {extraPackagingOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
    {poDetails.map((item, itemIndex) => (
      <Box key={item.ID} sx={{ mt: 3 }}>
        <Typography variant="subtitle1">{item['Amazon Product Name']}</Typography>
        <Typography variant="body2">Total Quantity: {item.totalQuantity}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Split</TableCell>
              <TableCell align="right">Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {item.splits.map((split) => (
              <TableRow key={split.id}>
                <TableCell>{split.channel}</TableCell>
                <TableCell align="right">{split.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    ))}
  </DialogContent>
  <DialogActions>
    <Button onClick={handlePoDialogClose}>Cancel</Button>
    <Button onClick={handlePoSubmit} color="primary">
      Create PO
    </Button>
  </DialogActions>
</Dialog>

      <Modal
        open={!!selectedProduct}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxHeight: '90%',
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          overflow: 'auto',
          p: 4,
        }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Full Product Details
          </Typography>
          <Box
            id="modal-modal-description"
            sx={{ marginTop: '16px', maxHeight: '80vh', overflow: 'auto' }}
          >
            <OrderedJsonViewer data={selectedProduct} />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ToProcureTable;
