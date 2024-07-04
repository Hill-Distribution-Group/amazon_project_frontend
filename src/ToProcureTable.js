// ToProcureTable.js
import React, { useState, useMemo, useEffect,useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
   Box, Checkbox, TextField, FormControl, InputLabel, Select,
  MenuItem, Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, IconButton, Menu, Tooltip, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from './api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const ToProcureTable = ({ data, setData, onSaveSelected }) => {
  const [selectedProducts, setSelectedProducts] = useState({});
  const [editedData, setEditedData] = useState({});
  const [filterText, setFilterText] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [poDetails, setPoDetails] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [isPoValid, setIsPoValid] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(null);



  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await api.get('/get_suppliers');
        setSuppliers(response.data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
  
    fetchSuppliers();
  }, []);

  const truncateText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text || '';
  };

  useEffect(() => {
    setEditedData(data.reduce((acc, item) => ({ ...acc, [item.product_id]: { ...item } }), {}));
  }, [data]);

  const handleCheckboxChange = (product) => {
    setSelectedProducts((prevSelected) => ({
      ...prevSelected,
      [product.product_id]: !prevSelected[product.product_id]
    }));
  };

  const handleInputChange = async (id, field, value) => {
    const updatedData = {
      ...editedData[id],
      [field]: value
    };
  
    setEditedData(prev => ({
      ...prev,
      [id]: updatedData
    }));
  
    try {
      await api.post('/update_to_procure_items', { items: [updatedData] });
      setSnackbarMessage("Changes saved successfully.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Reset poDetails and isPoValid when quantity changes
      if (field === 'quantity') {
        setPoDetails([]);
        setIsPoValid(false);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setSnackbarMessage("Error saving changes. Please try again.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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
      const selectedItem = editedData[contextMenu.product.product_id];
      setPoDetails([{
        ...selectedItem,
        totalQuantity: selectedItem.quantity,
        splits: [
          { id: 1, channel: 'Amazon FBA', quantity: Math.floor(selectedItem.quantity / 2) },
          { id: 2, channel: 'Amazon FBM', quantity: Math.ceil(selectedItem.quantity / 2) }
        ]
      }]);
      setIsPoValid(true);
      setPoDialogOpen(true);
      handleCloseContextMenu();
    }
  };


  const handleAddSplit = (index) => {
    setPoDetails(prevDetails => {
      const newDetails = [...prevDetails];
      const item = newDetails[index];
      const totalAssigned = item.splits.reduce((sum, split) => sum + parseInt(split.quantity || 0), 0);
      const remainingQuantity = item.totalQuantity - totalAssigned;

      if (remainingQuantity > 0) {
        const newSplitId = Math.max(...item.splits.map(split => split.id), 0) + 1;
        item.splits.push({ id: newSplitId, channel: 'Not Specified', quantity: remainingQuantity });
      }

      return newDetails;
    });
  };

  const handleRemoveSplit = (itemIndex, splitId) => {
    setPoDetails(prevDetails => {
      const newDetails = [...prevDetails];
      const item = newDetails[itemIndex];
      item.splits = item.splits.filter(split => split.id !== splitId);
      return newDetails;
    });
  };

  const validatePoDetails = useCallback(() => {
    return poDetails.every(item => {
      const splitTotal = item.splits.reduce((sum, split) => sum + parseInt(split.quantity || 0), 0);
      return splitTotal === item.totalQuantity;
    }) && expectedDeliveryDate !== null;
  }, [poDetails, expectedDeliveryDate]);
  
  useEffect(() => {
    setIsPoValid(validatePoDetails());
  }, [validatePoDetails]);

  const handleSplitChange = (itemIndex, splitId, field, value) => {
    setPoDetails(prevDetails => {
      const newDetails = [...prevDetails];
      const item = newDetails[itemIndex];
      const splitIndex = item.splits.findIndex(split => split.id === splitId);
      
      if (splitIndex === -1) return prevDetails;
  
      const updatedSplit = {
        ...item.splits[splitIndex],
        [field]: field === 'quantity' ? parseInt(value) || 0 : value
      };
  
      const updatedSplits = [...item.splits];
      updatedSplits[splitIndex] = updatedSplit;
  
      newDetails[itemIndex] = {
        ...item,
        splits: updatedSplits
      };
  
      return newDetails;
    });
  };

  
  const getAvailableSalesChannels = (item) => {
    const usedChannels = new Set(item.splits.map(split => split.channel));
    return ['Amazon FBA', 'Amazon FBM', 'eBay', 'TikTok', 'Not Specified'].filter(channel => !usedChannels.has(channel));
  };

  const handlePoSubmit = async () => {
    if (!validatePoDetails()) {
      onSaveSelected(null, "Split quantities do not match total quantity or expected delivery date is not set");
      return;
    }

    const purchaseOrders = poDetails.map(item => ({
      product_id: item.product_id,
      quantity: item.totalQuantity,
      unit_cost: item.purchase_price,
      counter_party: item.counter_party,
      extra_packing_needed: item.extra_packing_needed,
      expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
      sales_channel_split: item.splits.reduce((acc, split) => {
        acc[split.channel] = split.quantity;
        return acc;
      }, {})
    }));

    onSaveSelected(purchaseOrders);
    handlePoDialogClose();
  };

  const handleRemoveItems = async () => {
    const itemsToRemove = Object.keys(selectedProducts)
      .filter(productId => selectedProducts[productId])
      .map(productId => ({ product_id: productId }));

    if (itemsToRemove.length === 0) {
      setSnackbarMessage("No items selected for removal.");
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      await api.post('/remove_to_procure_items', { items: itemsToRemove });
      setSnackbarMessage("Items removed successfully.");
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setSelectedProducts({});
      // Optionally, refetch the data or remove items from the current state
      const updatedData = data.filter(product => !selectedProducts[product.product_id]);
      setData(updatedData);
    } catch (error) {
      console.error('Error removing items:', error);
      setSnackbarMessage("Error removing items. Please try again.");
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(product =>
      (product.product_name || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (product.product_asin || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (product.product_sku || '').toLowerCase().includes(filterText.toLowerCase())
    );
  }, [data, filterText]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortField) {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      }
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Filter by Name, ASIN, or SKU"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <FormControl>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            <MenuItem value="purchase_price">Purchase Price</MenuItem>
            <MenuItem value="sell_price_fba">Sell Price FBA</MenuItem>
            <MenuItem value="sell_price_fbm">Sell Price FBM</MenuItem>
            <MenuItem value="quantity">Quantity</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Sort Direction</InputLabel>
          <Select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ASIN</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Product Name</TableCell>
              <TableCell>Purchase Price</TableCell>
              <TableCell>Sell Price FBA</TableCell>
              <TableCell>Sell Price FBM</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>VAT Rate</TableCell>
              <TableCell>Counter Party</TableCell>
              <TableCell>Extra Packing Needed</TableCell>
              <TableCell>Approved By</TableCell>
              <TableCell>Approved At</TableCell>
              <TableCell align="center">Select</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((product) => (
              <TableRow
                key={product.product_id}
                style={{ cursor: 'context-menu' }}
                onContextMenu={(event) => handleContextMenu(event, product)}
              >
                <TableCell>{product.product_asin || 'N/A'}</TableCell>
                <TableCell>{product.product_sku || 'N/A'}</TableCell>
                <TableCell>
                  <Tooltip title={product.product_name || 'N/A'}>
                    <span>{truncateText(product.product_name, 30)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <TextField
                    value={editedData[product.product_id]?.purchase_price || ''}
                    onChange={(e) => handleInputChange(product.product_id, 'purchase_price', e.target.value)}
                    type="number"
                    InputProps={{ style: { width: '100px' } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={editedData[product.product_id]?.sell_price_fba || ''}
                    onChange={(e) => handleInputChange(product.product_id, 'sell_price_fba', e.target.value)}
                    type="number"
                    InputProps={{ style: { width: '100px' } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={editedData[product.product_id]?.sell_price_fbm || ''}
                    onChange={(e) => handleInputChange(product.product_id, 'sell_price_fbm', e.target.value)}
                    type="number"
                    InputProps={{ style: { width: '100px' } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    value={editedData[product.product_id]?.quantity || ''}
                    onChange={(e) => handleInputChange(product.product_id, 'quantity', e.target.value)}
                    type="number"
                    InputProps={{ style: { width: '80px' } }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl>
                    <Select
                      value={editedData[product.product_id]?.vat_rate || ''}
                      onChange={(e) => handleInputChange(product.product_id, 'vat_rate', e.target.value)}
                      style={{ width: '80px' }}
                    >
                      <MenuItem value="0">0%</MenuItem>
                      <MenuItem value="0.05">5%</MenuItem>
                      <MenuItem value="0.20">20%</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl fullWidth>
                    <Select
                      value={editedData[product.product_id]?.counter_party || ''}
                      onChange={(e) => handleInputChange(product.product_id, 'counter_party', e.target.value)}
                      style={{ width: '120px' }}
                    >
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={editedData[product.product_id]?.extra_packing_needed || false}
                    onChange={(e) => handleInputChange(product.product_id, 'extra_packing_needed', e.target.checked)}
                  />
                </TableCell>
                <TableCell>{product.approved_by || 'N/A'}</TableCell>
                <TableCell>{new Date(product.approved_at).toLocaleString()}</TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={!!selectedProducts[product.product_id]}
                    onChange={() => handleCheckboxChange(product)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
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
        <MenuItem onClick={handleCreatePO}>Create Purchase Order</MenuItem>
      </Menu>

      <Dialog open={poDialogOpen} onClose={handlePoDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
        <div style={{ marginTop: '5px' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Expected Delivery Date"
              value={expectedDeliveryDate}
              onChange={(newValue) => setExpectedDeliveryDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
          </LocalizationProvider>
        </div>
          <List>
            {poDetails.map((item, itemIndex) => (
              <ListItem key={item.product_id} divider>
                <ListItemText
                  primary={item.product_name}
                  secondary={`Total Quantity: ${item.totalQuantity}`}
                />
                <Box>
                  {item.splits.map((split) => (
                    <Box key={split.id} display="flex" alignItems="center" my={1}>
                      <FormControl sx={{ minWidth: 120, mr: 1 }}>
                        <Select
                          value={split.channel}
                          onChange={(e) => handleSplitChange(itemIndex, split.id, 'channel', e.target.value)}
                        >
                          {getAvailableSalesChannels(item).concat([split.channel]).map(channel => (
                            <MenuItem key={channel} value={channel}>{channel}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        type="number"
                        value={split.quantity}
                        onChange={(e) => handleSplitChange(itemIndex, split.id, 'quantity', e.target.value)}
                        sx={{ width: 100, mr: 1 }}
                      />
                      <IconButton onClick={() => handleRemoveSplit(itemIndex, split.id)} disabled={item.splits.length === 1}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleAddSplit(itemIndex)}
                    disabled={item.splits.length >= 5 || item.splits.reduce((sum, split) => sum + parseInt(split.quantity || 0), 0) >= item.totalQuantity}
                  >
                    Add Split
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePoDialogClose}>Cancel</Button>
          <Button onClick={handlePoSubmit} color="primary" disabled={!isPoValid}>Create PO</Button>
        </DialogActions>
      </Dialog>


      
      <Button
          variant="contained"
          color="secondary"
          onClick={handleRemoveItems}
          startIcon={<DeleteIcon />}
          disabled={Object.keys(selectedProducts).filter(productId => selectedProducts[productId]).length === 0}
          sx={{ marginTop: 2 }} // Add margin top
        >
          Remove Selected
        </Button>

        <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} elevation={6} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ToProcureTable;
