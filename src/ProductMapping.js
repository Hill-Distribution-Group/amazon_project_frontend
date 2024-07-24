import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Box, Select, MenuItem,Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from './SnackbarContext';
import api from './api';
import theme, { 
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

const ProductMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    channel: 'Amazon', // Default channel
    channel_id: '',
    marketplace: 'UK' // Default marketplace
  });
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await api.get('/api/product_mapping/get_mappings');
      if (response.status === 200) {
        setMappings(response.data);
        console.log(mappings);
      } else {
        showSnackbar('Failed to fetch product mappings', 'error');
      }
    } catch (error) {
      console.error('Error fetching product mappings:', error);
      showSnackbar('Failed to fetch product mappings', 'error');
    }
  };

  const handleOpen = (mapping = null) => {
    if (mapping) {
      setEditingId(mapping.id);
      setFormData(mapping);
    } else {
      setEditingId(null);
      setFormData({
        product_id: '',
        name: '',
        channel: 'Amazon', // Default channel
        channel_id: '',
        marketplace: 'UK' // Default marketplace
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

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api.put(`/api/product_mapping/update_mapping/${editingId}`, formData);
        showSnackbar('Product mapping updated successfully', 'success');
      } else {
        await api.post('/api/product_mapping/create_mapping', formData);
        showSnackbar('Product mapping added successfully', 'success');
      }
      handleClose();
      fetchMappings();
    } catch (error) {
      showSnackbar('Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/product_mapping/delete_mapping/${id}`);
      if (response.status === 200) { // Updated to check for status 200
        showSnackbar('Product mapping deleted successfully', 'success');
        fetchMappings();
      } else {
        showSnackbar('Failed to delete product mapping', 'error');
      }
    } catch (error) {
      console.error('Error deleting product mapping:', error);
      showSnackbar('Failed to delete product mapping', 'error');
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
    { field: 'name', headerName: 'Name' },
    { field: 'channel', headerName: 'Channel' },
    { field: 'channel_id', headerName: 'Channel ID' },
    { field: 'marketplace', headerName: 'Marketplace' },
  ], []);

  const filteredAndSortedMappings = useMemo(() => {
    let result = mappings;

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
  }, [mappings, filters, sortConfig]);

  return (
    <PageContainer>
      <StyledHeader>
        <HeaderTitle variant="h5" component="h1" color="textPrimary">
          Product Mapping Management
        </HeaderTitle>
        <HeaderActions>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Mapping
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
          {filteredAndSortedMappings.map((mapping) => (
            <TableRow key={mapping.id}>
              <TableCell>{mapping.product_id}</TableCell>
              <TableCell>
                <Tooltip title={mapping.name} arrow>
                  <span>{truncateText(mapping.name, 20)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>{mapping.channel}</TableCell>
              <TableCell>{mapping.channel_id}</TableCell>
              <TableCell>{mapping.marketplace}</TableCell>
              <TableCell>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(mapping)}
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(mapping.id)}
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
        <DialogTitle>{editingId ? 'Edit Product Mapping' : 'Add Product Mapping'}</DialogTitle>
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
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
          />
          <Select
            margin="dense"
            name="channel"
            label="Channel"
            fullWidth
            value={formData.channel}
            onChange={handleInputChange}
          >
            <MenuItem value="Amazon">Amazon</MenuItem>
          </Select>
          <TextField
            margin="dense"
            name="channel_id"
            label="Channel ID"
            type="text"
            fullWidth
            value={formData.channel_id}
            onChange={handleInputChange}
          />
          <Select
            margin="dense"
            name="marketplace"
            label="Marketplace"
            fullWidth
            value={formData.marketplace}
            onChange={handleInputChange}
          >
            <MenuItem value="UK">UK</MenuItem>
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

export default ProductMapping;
