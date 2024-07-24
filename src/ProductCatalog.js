import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Typography, Box, Tooltip
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

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    sku: '',
    name: '',
    description: ''
  });
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { showSnackbar } = useSnackbar();
  

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/product_catalog/get_products');
      if (response.status === 200) {
        setProducts(response.data);
      } else {
        showSnackbar('Failed to fetch products', 'error');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Failed to fetch products', 'error');
    }
  };

  const handleOpen = (product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        id: product.id,
        name: product.name || '',
        description: product.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        id: '',
        sku: '',
        name: '',
        description: ''
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
    try {
      if (editingId) {
        await api.put(`/api/product_catalog/update_product/${editingId}`, formData);
        showSnackbar('Product updated successfully', 'success');
      } else {
        await api.post('/api/product_catalog/create_product', formData);
        showSnackbar('Product added successfully', 'success');
      }
      handleClose();
      fetchProducts();
    } catch (error) {
      showSnackbar('Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/product_catalog/delete_product/${id}`);
      if (response.status === 204) {
        showSnackbar('Product deleted successfully', 'success');
        fetchProducts();
      } else {
        showSnackbar('Failed to delete product', 'error');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showSnackbar('Failed to delete product', 'error');
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
    { field: 'id', headerName: 'Product ID' },
    { field: 'sku', headerName: 'SKU' },
    { field: 'name', headerName: 'Name' },
    { field: 'description', headerName: 'Description' },
  ], []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => 
          String(item[field] || '').toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if ((a[sortConfig.key] || '') < (b[sortConfig.key] || '')) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if ((a[sortConfig.key] || '') > (b[sortConfig.key] || '')) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [products, filters, sortConfig]);

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <PageContainer>
      <StyledHeader>
        <HeaderTitle variant="h5" component="h1" color="textPrimary">
          Product Catalog
        </HeaderTitle>
        <HeaderActions>
          <Button
            variant="text"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Product
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
                {filteredAndSortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.sku}</TableCell>

                    <TableCell>
                      <Tooltip title={product.name || ''} arrow>
                        <span>{truncateText(product.name, 20)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={product.description || ''} arrow>
                        <span>{truncateText(product.description, 30)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => handleOpen(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(product.id)}
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
        <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
          />
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

export default ProductCatalog;