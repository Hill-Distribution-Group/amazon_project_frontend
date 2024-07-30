import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
 Box, Tooltip, Select, MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from './SnackbarContext';
import api from './api';
import  { 
  PageContainer, 
  ContentContainer, 
  ResultsContainer, 
  StyledHeader,
  HeaderTitle,
  HeaderActions
} from './themes/globalTheme';
import FilterControls from './FilterControls';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const Inventory = () => {
  const [inventories, setInventories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    sku: '',
    name: '',
    quantity: '',
    location: 'Hounslow' // Default location
  });
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { showSnackbar } = useSnackbar();

  const fetchInventories = useCallback(async () => {
    try {
      const response = await api.get('/api/inventory/get_inventories');
      if (response.status === 200) {
        setInventories(response.data); 
      } else {
        showSnackbar('Failed to fetch inventories', 'error');
      }
    } catch (error) {
      console.error('Error fetching inventories:', error);
      showSnackbar('Failed to fetch inventories', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  const handleOpen = (inventory = null) => {
    if (inventory) {
      setEditingId(inventory.id);
      setFormData({
        ...inventory,
        location: inventory.location || 'Hounslow' // Default location
      });
    } else {
      setEditingId(null);
      setFormData({
        product_id: '',
        sku: '',
        name: '',
        quantity: '',
        location: 'Hounslow' // Default location
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.quantity) {
      showSnackbar('Product ID and Quantity are required', 'error');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/inventory/update_inventory/${editingId}`, formData);
        showSnackbar('Inventory updated successfully', 'success');
      } else {
        await api.post('/api/inventory/create_inventory', formData);
        showSnackbar('Inventory added successfully', 'success');
      }
      handleClose();
      fetchInventories();
    } catch (error) {
      console.error('Error updating/creating inventory:', error);
      showSnackbar(error.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/inventory/delete_inventory/${id}`);
      if (response.status === 200) {
        showSnackbar('Inventory deleted successfully', 'success');
        fetchInventories();
      } else {
        showSnackbar('Failed to delete inventory', 'error');
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      showSnackbar('Failed to delete inventory', 'error');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const columns = useMemo(() => [
    { field: 'product_id', headerName: 'Product ID' },
    { field: 'sku', headerName: 'SKU' },
    { field: 'name', headerName: 'Name' },
    { field: 'quantity', headerName: 'Quantity' },
    { field: 'location', headerName: 'Location' },
    { field: 'last_updated', headerName: 'Last Updated' },
  ], []);

  const filteredAndSortedInventories = useMemo(() => {
    let result = inventories;

    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[field]).toLowerCase().includes(value.toLowerCase())
        );
      }
    });

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
  }, [inventories, filters, sortConfig]);

  return (
    <PageContainer>
      <StyledHeader>
        <HeaderTitle variant="h5" component="h1" color="textPrimary">
          Inventory Management
        </HeaderTitle>
        <HeaderActions>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Inventory
          </Button>
        </HeaderActions>
      </StyledHeader>
      <ContentContainer>
        <ResultsContainer>
          <FilterControls
            columns={columns}
            onFilterChange={handleFilterChange}
          />
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map(column => (
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedInventories.map((inventory) => (
                  <TableRow key={inventory.id}>
                    <TableCell>{inventory.product_id}</TableCell>
                    <TableCell>{inventory.sku}</TableCell>
                    <TableCell>
                      <Tooltip title={inventory.name} arrow>
                        <span>{inventory.name}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{inventory.quantity}</TableCell>
                    <TableCell>{inventory.location}</TableCell>
                    <TableCell>{inventory.last_updated}</TableCell>
                    <TableCell>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => handleOpen(inventory)}
                      >
                        Edit
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(inventory.id)}
                        color="error"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </ResultsContainer>
      </ContentContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingId ? 'Edit Inventory' : 'Add Inventory'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="product_id"
            label="Product ID"
            type="text"
            fullWidth
            value={formData.product_id}
            onChange={handleInputChange}
            disabled={editingId}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={handleInputChange}
          />
          <Select
            margin="dense"
            name="location"
            label="Location"
            fullWidth
            value={formData.location}
            onChange={handleInputChange}
          >
            <MenuItem value="Hounslow">Hounslow</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Inventory;
